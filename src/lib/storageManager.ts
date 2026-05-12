// ============================================================
//  storageManager — 버전 관리 · 쿼터 처리 · 충돌 방지
// ============================================================
import { encryptData, decryptData } from './secureStorage';

// ── 버전 레코드 타입 ──────────────────────────────────────────

export interface Versioned {
  version:        number;
  lastModifiedAt: number;
}

export function withVersion<T>(data: T, baseVersion = 0): T & Versioned {
  return { ...data as object, version: baseVersion + 1, lastModifiedAt: Date.now() } as T & Versioned;
}

export function checkConflict(stored: Versioned, inMemory: Versioned): boolean {
  return stored.version > inMemory.version;
}

// ── 스토리지 타입 ─────────────────────────────────────────────

export type StoreKind = 'local' | 'session';

function getStorage(kind: StoreKind): Storage {
  return kind === 'session' ? sessionStorage : localStorage;
}

// ── 용량 추정 ─────────────────────────────────────────────────

const QUOTA_SAFE_BYTES = 4 * 1024 * 1024; // 4 MB

function estimateStorageBytes(): number {
  try {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      const val = localStorage.getItem(key) ?? '';
      total += (key.length + val.length) * 2;
    }
    return total;
  } catch { return 0; }
}

// ── 오래된 데이터 트리밍 ──────────────────────────────────────

const TRIM_PREFIXES = ['kcos_audit_log', 'kcos_secure_audit'];

function trimOldData(): void {
  for (const prefix of TRIM_PREFIXES) {
    try {
      const raw = localStorage.getItem(prefix);
      if (!raw) continue;
      const entries = decryptData<unknown[]>(raw);
      if (!Array.isArray(entries)) continue;
      // 최신 200개만 유지
      const trimmed = entries.slice(0, 200);
      localStorage.setItem(prefix, encryptData(trimmed));
      console.info(`[StorageManager] Trimmed ${prefix}: ${entries.length} → ${trimmed.length}`);
    } catch {}
  }
}

// ── 전역 쿼터 에러 핸들러 ─────────────────────────────────────

let quotaHandlerInstalled = false;

export function installGlobalStorageErrorHandler(): void {
  if (quotaHandlerInstalled) return;
  quotaHandlerInstalled = true;
  window.addEventListener('error', (e) => {
    const isQuota = e.message?.toLowerCase().includes('quota') ||
      (e.error instanceof DOMException && (e.error.name === 'QuotaExceededError' || e.error.name === 'NS_ERROR_DOM_QUOTA_REACHED'));
    if (isQuota) {
      console.warn('[StorageManager] QuotaExceededError caught — trimming old data');
      trimOldData();
    }
  });
}

// ── 안전한 읽기/쓰기 ─────────────────────────────────────────

export function safeSet(key: string, data: unknown, kind: StoreKind = 'local'): boolean {
  const store = getStorage(kind);
  const encrypted = encryptData(data);
  if (!encrypted) return false;

  // 용량 체크
  if (kind === 'local' && estimateStorageBytes() > QUOTA_SAFE_BYTES) {
    console.warn('[StorageManager] Approaching quota limit, trimming...');
    trimOldData();
  }

  try {
    // 쓰기 전 값 트리밍 (문자열인 경우)
    store.setItem(key, encrypted);
    return true;
  } catch (e) {
    if (e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('[StorageManager] QuotaExceededError on write, trimming and retrying...');
      trimOldData();
      try {
        store.setItem(key, encrypted);
        return true;
      } catch { return false; }
    }
    return false;
  }
}

export function safeGet<T>(key: string, kind: StoreKind = 'local'): T | null {
  const store = getStorage(kind);
  try {
    const raw = store.getItem(key);
    return raw ? decryptData<T>(raw) : null;
  } catch { return null; }
}

export function safeRemove(key: string, kind: StoreKind = 'local'): void {
  try { getStorage(kind).removeItem(key); } catch {}
}

// ── 버전 체크 포함 저장 ───────────────────────────────────────

export function versionedSet<T extends Versioned>(
  key: string,
  inMemoryRecord: T,
  kind: StoreKind = 'local',
): { saved: boolean; conflict: boolean } {
  const stored = safeGet<T>(key, kind);
  if (stored && checkConflict(stored, inMemoryRecord)) {
    console.warn(`[StorageManager] Version conflict on key "${key}": stored v${stored.version} > memory v${inMemoryRecord.version}`);
    return { saved: false, conflict: true };
  }
  const next: T = { ...inMemoryRecord, version: inMemoryRecord.version + 1, lastModifiedAt: Date.now() };
  return { saved: safeSet(key, next, kind), conflict: false };
}
