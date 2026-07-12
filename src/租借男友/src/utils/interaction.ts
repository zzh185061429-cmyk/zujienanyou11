/**
 * 交互流程核心模块
 * 封装 "创建 user → generate → 过滤思维链 → 解析变量 → 创建 assistant" 的完整链路
 * 包含错误回退机制：generate 失败时自动删除已创建的 user 楼层
 */

// ── 思维链过滤 ──

/** 剥离 <thinking>、<think> 标签及其中内容，以及 </konatan_planning~> 上方所有内容（大小写不敏感） */
function stripThinking(raw: string): string {
  return raw
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/[\s\S]*?<\/konatan_planning~>/i, '');
}

// ── 提取业务标签 ──

type ParsedResponse = {
  maintext: string;  // 主体剧情文本（供 StoryView 解析为 ScriptLine[]）
  raw: string;       // 过滤思维链后的完整文本（供变量解析）
};

/**
 * 从 AI 回复中提取 <maintext> 标签内容
 * 若不存在 <maintext> 标签，则将过滤后的全文视为 maintext
 */
function extractContent(raw: string): ParsedResponse {
  const maintextMatch = raw.match(/<maintext>([\s\S]*?)<\/maintext>/i);
  if (maintextMatch) {
    return {
      maintext: maintextMatch[1].trim(),
      raw: raw, // 变量命令可能散落在任意位置，保留全文
    };
  }
  return {
    maintext: raw.trim(),
    raw,
  };
}

// ── 完整交互流程 ──

type SendResult =
  | { success: true; message: string; mvuData: Mvu.MvuData }
  | { success: false; error: string };

/**
 * 执行一次完整的玩家输入 → AI 回复流程
 *
 * 步骤：
 * 1. 记录当前 lastMessageId（用于回退）
 * 2. createChatMessages 创建 user 楼层（refresh: 'none'）
 * 3. generate 请求 AI 回复
 * 4. 失败 → deleteChatMessages 回退 user 楼层
 * 5. 过滤 <thinking>/<think> 标签
 * 6. 提取 <maintext> 标签（或使用全文）
 * 7. Mvu.parseMessage 解析变量命令
 * 8. createChatMessages 创建 assistant 楼层
 * 9. eventEmit('story_interaction_done') 通知前端刷新
 *
 * @param userText 玩家输入文本
 * @returns 成功时返回 assistant 消息文本和更新后的 MVU 数据；失败时返回错误信息
 */
export async function sendUserMessage(userText: string): Promise<SendResult> {
  const trimmed = userText.trim();
  if (!trimmed) return { success: false, error: '输入为空' };

  let userMsgId: number | null = null;

  try {
    // ── 步骤 1: 记录当前楼层号 ──
    const lastId = getLastMessageId();
    userMsgId = lastId + 1;

    // ── 步骤 2: 创建 user 楼层 ──
    await createChatMessages(
      [{ role: 'user', message: trimmed }],
      { refresh: 'none' },
    );
    console.info('[interaction] user 楼层已创建, id:', userMsgId);

    // ── 步骤 3: 请求 AI 生成 ──
    const rawResponse = await generate({
      user_input: trimmed,
      should_stream: false,
    });

    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('AI 返回了空响应或非文本内容');
    }

    console.info('[interaction] AI 回复长度:', rawResponse.length);

    // ── 步骤 5: 过滤思维链 ──
    const filtered = stripThinking(rawResponse);

    // ── 步骤 6: 提取业务内容 ──
    const { maintext, raw: parsedWithVars } = extractContent(filtered);

    // ── 步骤 7: 解析变量命令 ──
    let mvuData: Mvu.MvuData;
    try {
      await waitGlobalInitialized('Mvu');
      const msgId = getCurrentMessageId();
      const oldData = msgId != null
        ? Mvu.getMvuData({ type: 'message', message_id: msgId })
        : Mvu.getMvuData({ type: 'message' });
      mvuData = await Mvu.parseMessage(parsedWithVars, oldData);
      console.info('[interaction] 变量解析完成');
    } catch {
      console.warn('[interaction] 变量解析失败，使用当前 MVU 数据');
      const msgId = getCurrentMessageId();
      mvuData = msgId != null
        ? Mvu.getMvuData({ type: 'message', message_id: msgId })
        : Mvu.getMvuData({ type: 'message' });
    }

    // ── 步骤 8: 创建 assistant 楼层 ──
    await createChatMessages(
      [{ role: 'assistant', message: maintext }],
      { refresh: 'none' },
    );
    console.info('[interaction] assistant 楼层已创建');

    // ── 步骤 9: 通知前端刷新 ──
    eventEmit('story_interaction_done');

    return { success: true, message: maintext, mvuData };

  } catch (err: any) {
    console.error('[interaction] 流程失败:', err?.message || err);

    // ── 回退: 删除已创建的 user 楼层 ──
    if (userMsgId !== null) {
      try {
        await deleteChatMessages([userMsgId], { refresh: 'none' });
        console.info('[interaction] 已回退 user 楼层, id:', userMsgId);
      } catch (rollbackErr) {
        console.error('[interaction] 回退失败:', rollbackErr);
      }
    }

    return { success: false, error: err?.message || '未知错误' };
  }
}

// ── 重新生成当前楼层 ──

type RegenResult =
  | { success: true }
  | { success: false; error: string };

/**
 * 重新生成当前 assistant 楼层
 * 找到前一层的 user 消息，删除当前 assistant，用原 user 输入重新生成
 *
 * @param assistantFloorId 要重新生成的 assistant 楼层号
 */
export async function regenerateCurrentFloor(assistantFloorId: number | null): Promise<RegenResult> {
  if (assistantFloorId == null) return { success: false, error: '无当前楼层' };

  try {
    // 步骤 1：找到前一层 user 消息
    const prevFloorId = assistantFloorId - 1;
    const prevMsgs = getChatMessages(prevFloorId);
    if (!prevMsgs || prevMsgs.length === 0 || prevMsgs[0].role !== 'user') {
      return { success: false, error: '未找到前一层的用户输入' };
    }
    const userText = prevMsgs[0].message || '';

    // 步骤 2：删除当前 assistant 楼层
    await deleteChatMessages([assistantFloorId], { refresh: 'none' });
    console.info('[regen] 已删除楼层 #' + assistantFloorId);

    // 步骤 3：请求 AI 重新生成
    const rawResponse = await generate({
      user_input: userText,
      should_stream: false,
    });

    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('AI 返回了空响应');
    }

    // 步骤 4：过滤 + 提取
    const filtered = stripThinking(rawResponse);
    const { maintext, raw: parsedWithVars } = extractContent(filtered);

    // 步骤 5：解析变量
    try {
      await waitGlobalInitialized('Mvu');
      const oldData = Mvu.getMvuData({ type: 'message', message_id: prevFloorId });
      await Mvu.parseMessage(parsedWithVars, oldData);
    } catch {
      /* MVU 解析失败不影响继续 */
    }

    // 步骤 6：创建新的 assistant 楼层
    await createChatMessages(
      [{ role: 'assistant', message: maintext }],
      { refresh: 'none' },
    );
    console.info('[regen] 新 assistant 楼层已创建');

    return { success: true };

  } catch (err: any) {
    console.error('[regen] 失败:', err?.message || err);
    return { success: false, error: err?.message || '重新生成失败' };
  }
}