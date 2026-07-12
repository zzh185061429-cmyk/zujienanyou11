import { createRoot } from 'react-dom/client';
import App from './src/App';
import './src/index.css';

$(() => {
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);

  // 自动全屏：先尝试直接全屏，失败则等待用户点击
  const tryFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* 浏览器阻止自动全屏，等待用户点击 */
      const onClick = async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch { /* 浏览器可能阻止全屏 */ }
        document.removeEventListener('click', onClick);
      };
      document.addEventListener('click', onClick);
    }
  };
  tryFullscreen();

  $(window).on('pagehide', () => {
    root.unmount();
  });
});