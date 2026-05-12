// ============================================================
//  useDraft — 폼 드래프트 영속성 훅
//  • 마운트 시 localStorage 복원
//  • 400ms 디바운스 자동저장
//  • beforeunload 시 즉시 동기 저장 (디바운스 미처리분 보호)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

export function useDraft<T>(
  key:      string,
  fallback: T,
): [T, (v: T | ((prev: T) => T)) => void, () => void] {

  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      // null / undefined는 fallback 사용
      return parsed ?? fallback;
    } catch { return fallback; }
  });

  // ref: 클로저 stale 없이 최신 값을 beforeunload에서 접근
  const valRef = useRef(val);
  valRef.current = val;

  // 400ms 디바운스 저장
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [val, key]);

  // beforeunload: 디바운스 대기 중이더라도 즉시 동기 저장
  useEffect(() => {
    const flush = () => {
      try { localStorage.setItem(key, JSON.stringify(valRef.current)); } catch {}
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [key]);

  // clear: 상태 및 저장소 초기화
  const clear = useCallback(() => {
    setVal(fallback);
    try { localStorage.removeItem(key); } catch {}
  }, [key, fallback]);

  return [val, setVal, clear];
}
