import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { emitGlobalError } from './lib/errorBus'

// ── 세이프 모드: ?reset=true 로 접속 시 localStorage 초기화 ──
try {
  if (new URLSearchParams(window.location.search).get('reset') === 'true') {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', window.location.pathname);
    console.info('[SafeMode] Storage cleared. Starting fresh.');
  }
} catch {}

// ── 스타트업 Self-Healing: 깨진 저장소 자동 복구 ────────────────
;(function storageIntegrityCheck() {
  const KEYS_TO_VALIDATE: Record<string, 'array' | 'object'> = {
    'kinetic_patients':   'array',
    'kinetic_recycle_bin':'array',
    'kinetic_session':    'object',
    'kinetic_auth_state': 'object',
  };
  Object.entries(KEYS_TO_VALIDATE).forEach(([key, expectedType]) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return; // 없으면 pass (첫 방문)
      const parsed = JSON.parse(raw);
      const actualType = Array.isArray(parsed) ? 'array' : typeof parsed;
      if (actualType !== expectedType) {
        console.warn(`[integrity] ${key} has wrong type (${actualType} ≠ ${expectedType}) — resetting`);
        localStorage.removeItem(key);
      }
    } catch {
      console.warn(`[integrity] ${key} is corrupt JSON — resetting`);
      try { localStorage.removeItem(key); } catch {}
    }
  });
})();

// ── 전역 에러 핸들러 ─────────────────────────────────────────

const ERROR_MSG = {
  quota:   '저장 공간이 부족합니다. 오래된 기록을 정리해 주세요.',
  network: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.',
  default: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
} as const;

// 동기 런타임 에러 (localStorage quota 등)
window.addEventListener('error', (e) => {
  const isQuota = e.message?.toLowerCase().includes('quota') ||
    (e.error instanceof DOMException &&
     (e.error.name === 'QuotaExceededError' || e.error.code === 22));
  if (isQuota) {
    console.warn('[Storage] QuotaExceeded — clearing old audit logs');
    try {
      ['kcos_audit_v4','kcos_sec_audit_v4'].forEach(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        localStorage.setItem(k, raw.slice(0, 4096));
      });
    } catch {}
    emitGlobalError(ERROR_MSG.quota);
  }
});

// 비동기 Promise rejection (fetch 실패, Supabase 오류 등)
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  const msg = reason instanceof Error ? reason.message.toLowerCase() : String(reason).toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    emitGlobalError(ERROR_MSG.network);
  } else if (msg.includes('quota')) {
    emitGlobalError(ERROR_MSG.quota);
  } else {
    emitGlobalError(ERROR_MSG.default);
    console.error('[UnhandledRejection]', reason);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
