// ============================================================
//  GlobalErrorBanner — 전역 서버/런타임 오류 배너
//  unhandledrejection 이벤트 발생 시 상단에 표시
// ============================================================

import { useState, useEffect } from 'react';
import { registerErrorHandler } from '../../lib/errorBus';

export function GlobalErrorBanner() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    registerErrorHandler(setMsg);
  }, []);

  // 5초 후 자동 숨김
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(id);
  }, [msg]);

  if (!msg) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-red-600 px-5 py-3 shadow-lg"
      style={{ animation: 'slideDown 0.25s ease' }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span>⚠</span>
        <span>{msg}</span>
      </div>
      <button
        onClick={() => setMsg(null)}
        className="text-white/80 hover:text-white text-lg leading-none"
        aria-label="닫기"
      >
        ✕
      </button>
      <style>{`@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

export default GlobalErrorBanner;
