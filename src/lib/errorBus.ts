// ============================================================
//  errorBus.ts — 전역 에러 이벤트 버스
//  main.tsx 의 unhandledrejection → App.tsx 의 배너 UI 로 전달
// ============================================================

type Handler = (message: string) => void;
let _handler: Handler | null = null;

export function registerErrorHandler(h: Handler): void {
  _handler = h;
}

export function emitGlobalError(message: string): void {
  _handler?.(message);
}
