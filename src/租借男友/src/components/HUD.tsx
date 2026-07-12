import React, { useEffect, useState } from "react";
import { PopCard } from "./ui/PopCard";
import { Clock, MapPin, User, Briefcase, Eye, EyeOff, Menu, X, Maximize2, Minimize2, Brain, Database, BookText, Trash2, RefreshCw, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGameContext } from "../state/GameContext";
import { CalendarModal } from "./modals/CalendarModal";
import { MapModal } from "./modals/MapModal";
import { cn } from "../utils";
import { FloorSelector } from "./FloorSelector";

interface HUDProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenThinking: () => void;
  onOpenVariables: () => void;
  onOpenReading: () => void;
  onOpenDelete: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
  isGenerating?: boolean;
}

export function HUD({ isSidebarOpen, onToggleSidebar, isFullscreen, onToggleFullscreen, onOpenThinking, onOpenVariables, onOpenReading, onOpenDelete, onRegenerate, regenerating, isGenerating = false }: HUDProps) {
  const { currentOrder, setIsCalendarOpen, setIsMapOpen, totalDebt, totalIncome, remainingDebt, isEyeCareMode, setIsEyeCareMode, gameTime, currentWeekday, currentLocation } = useGameContext();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const progress = totalDebt > 0 ? Math.min(100, Math.max(0, (totalIncome / totalDebt) * 100)) : 0;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 p-2 pointer-events-none">
        {/* 宽屏：三列左右布局；窄屏：上下堆叠 */}
        <div className="flex flex-col lg:flex-row items-stretch gap-2 w-full">
          
          {/* Left column: 时间 / 地点 / 折叠按钮 */}
          <div className="flex flex-col gap-2 shrink-0 pointer-events-auto">
            {/* 第一行：时间 + 菜单按钮（手机端始终显示） */}
            <div className="flex gap-2">
              <PopCard 
                onClick={() => setIsCalendarOpen(true)}
                className="py-1 px-3 flex items-center gap-2 bg-pop-cyan clip-diagonal shadow-pop-cyan cursor-pointer hover:scale-105 transition-transform flex-1 min-w-0"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="font-bold text-sm whitespace-nowrap truncate">
                  {currentWeekday || ['周日','周一','周二','周三','周四','周五','周六'][gameTime.getDay()]} {gameTime.getMonth() + 1}月{String(gameTime.getDate()).padStart(2, '0')}日 {gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </PopCard>
              <PopCard 
                onClick={onToggleSidebar}
                className="py-1 px-2 flex items-center justify-center bg-pop-yellow text-pop-black clip-diagonal shadow-pop-pink cursor-pointer hover:scale-110 transition-transform"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </PopCard>
            </div>
            
            {/* 第二行：地点 + 核心功能（手机端）/ 全部功能按钮（PC端） */}
            <div className="flex gap-2">
              <PopCard 
                onClick={() => setIsMapOpen(true)}
                className="py-1 px-3 flex items-center gap-2 bg-pop-yellow clip-diagonal shadow-pop-cyan cursor-pointer hover:scale-105 transition-transform flex-1 min-w-0"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="font-bold text-sm whitespace-nowrap truncate">{currentLocation}</span>
              </PopCard>
              
              {/* PC端显示全部功能按钮 */}
              <div className="hidden lg:flex gap-2">
                <PopCard 
                  onClick={() => setIsEyeCareMode(!isEyeCareMode)}
                  className={`py-1 px-2 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform clip-diagonal shrink-0 ${isEyeCareMode ? 'bg-[#cce3de] text-[#2c3e50]' : 'bg-gray-200 text-gray-700'}`}
                  title="护眼模式"
                >
                  {isEyeCareMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </PopCard>
                <PopCard 
                  onClick={onToggleFullscreen}
                  className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                  title={isFullscreen ? "退出全屏" : "全屏模式"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </PopCard>
                <PopCard 
                  onClick={onOpenReading}
                  className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                  title="剧情回顾"
                >
                  <BookText className="w-4 h-4" />
                </PopCard>
                <PopCard 
                  onClick={onOpenDelete}
                  className="py-1 px-2 flex items-center justify-center bg-pop-pink text-white cursor-pointer hover:scale-105 hover:bg-pop-yellow hover:text-pop-black transition-transform clip-diagonal shrink-0"
                  title="删除楼层"
                >
                  <Trash2 className="w-4 h-4" />
                </PopCard>
                <PopCard 
                  onClick={onRegenerate}
                  className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                  title="重新生成"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                </PopCard>
                <PopCard 
                  onClick={onOpenThinking}
                  className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                  title="思维链"
                >
                  <Brain className="w-4 h-4" />
                </PopCard>
                <PopCard 
                  onClick={onOpenVariables}
                  className="py-1 px-2 flex items-center justify-center bg-pop-yellow text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-cyan transition-transform clip-diagonal shrink-0"
                  title="变量"
                >
                  <Database className="w-4 h-4" />
                </PopCard>
                <FloorSelector />
              </div>
              
              {/* 手机端：更多菜单按钮 */}
              <div className="lg:hidden relative">
                <PopCard 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                  title="更多功能"
                >
                  {showMoreMenu ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
                </PopCard>
                
                {/* 手机端下拉菜单 */}
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 flex flex-col gap-2 p-2 bg-pop-black border-2 border-white rounded-lg shadow-pop-pink z-50 min-w-[140px]"
                    >
                      <button onClick={() => { setIsEyeCareMode(!isEyeCareMode); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        {isEyeCareMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} 护眼
                      </button>
                      <button onClick={() => { onToggleFullscreen(); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />} 全屏
                      </button>
                      <button onClick={() => { onOpenReading(); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        <BookText className="w-4 h-4" /> 回顾
                      </button>
                      <button onClick={() => { onOpenDelete(); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        <Trash2 className="w-4 h-4" /> 删除
                      </button>
                      <button onClick={() => { onRegenerate(); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} /> 重生成
                      </button>
                      <button onClick={() => { onOpenThinking(); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        <Brain className="w-4 h-4" /> 思维链
                      </button>
                      <button onClick={() => { onOpenVariables(); setShowMoreMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold">
                        <Database className="w-4 h-4" /> 变量
                      </button>
                      <div className="border-t border-white/20 pt-2">
                        <FloorSelector />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Center column: Debt Progress */}
          <PopCard skew className="flex-1 flex flex-col justify-center bg-pop-black text-white p-2 pointer-events-auto border-pop-pink shadow-pop-pink relative overflow-hidden min-h-[60px] lg:min-h-0">
            <div className="absolute inset-0 bg-halftone opacity-50"></div>
            <div className="relative z-10 flex justify-between items-end mb-1">
              <span className="text-pop-pink font-black text-sm lg:text-lg text-stroke-sm italic">REMAINING DEBT</span>
              <span className="text-base lg:text-xl font-black text-pop-yellow drop-shadow-[2px_2px_0_#ff3366]">
                ¥{remainingDebt.toLocaleString()}
              </span>
            </div>
            <div className="h-3 lg:h-4 w-full bg-white pop-border clip-diagonal relative overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-stripes-cyan-pink"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, type: "spring" }}
              />
            </div>
          </PopCard>

          {/* Right column: 当前角色 / 任务 */}
          <div className="flex flex-col gap-2 shrink-0 pointer-events-auto min-w-[140px] lg:min-w-[160px]">
            {/* 状态灯 */}
            <PopCard
              className={cn(
                "py-1 px-3 flex items-center justify-center gap-2 clip-diagonal border-2 border-white shadow-[2px_2px_0_#1a1a1a] transition-colors duration-300",
                isGenerating ? "bg-red-500 text-white" : "bg-green-500 text-white"
              )}
              title={isGenerating ? "AI 生成中..." : "AI 空闲"}
            >
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isGenerating ? "bg-white" : "bg-white"
              )} />
              <span className="font-bold text-sm whitespace-nowrap">
                {isGenerating ? "生成中" : "就绪"}
              </span>
            </PopCard>

            <AnimatePresence mode="wait">
              {!currentOrder ? (
                <motion.div
                  key="none"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="flex flex-col gap-2"
                >
                  <PopCard className="py-2 px-3 flex items-center justify-center gap-2 bg-pop-black text-gray-400 clip-diagonal border-2 border-gray-600 shadow-none">
                     <span className="font-bold text-sm">当前任务: 无</span>
                  </PopCard>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="flex flex-col gap-2"
                >
                  <PopCard className="py-1 px-3 flex items-center gap-2 bg-pop-pink clip-diagonal border-2 border-pop-black shadow-[2px_2px_0_#1a1a1a]">
                    <User className="w-4 h-4 shrink-0 text-white" />
                    <span className="font-bold text-sm text-white whitespace-nowrap overflow-hidden text-ellipsis">当前: {currentOrder.charName}</span>
                  </PopCard>
                  <PopCard className="py-1 px-3 flex items-center gap-2 bg-white clip-diagonal border-2 border-pop-black shadow-[2px_2px_0_#1a1a1a] text-pop-pink">
                    <Briefcase className="w-4 h-4 shrink-0 text-pop-black" />
                    <span className="font-bold text-sm text-pop-black whitespace-nowrap overflow-hidden text-ellipsis">{currentOrder.task}</span>
                  </PopCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <AnimatePresence>
        <CalendarModal key="calendar" />
        <MapModal key="map" />
      </AnimatePresence>
    </>
  );
}