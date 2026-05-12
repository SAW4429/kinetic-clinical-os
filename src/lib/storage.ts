// ============================================================
//  storage.ts — 암호화 LocalStorage (XOR + Base64)
//  모든 read는 try-catch 후 null 반환 → 크래시 없음
// ============================================================

const K = 'KCOS-CLINICAL-2025-SECURE';

function xor(s: string): string {
  return [...s].map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ K.charCodeAt(i % K.length))
  ).join('');
}

export function enc(val: unknown): string {
  try { return btoa(xor(encodeURIComponent(JSON.stringify(val)))); }
  catch { return ''; }
}

export function dec<T>(raw: string | null): T | null {
  try { return raw ? (JSON.parse(decodeURIComponent(xor(atob(raw)))) as T) : null; }
  catch { return null; }
}

export function setLS(key: string, val: unknown): void {
  try { localStorage.setItem(key, enc(val)); }
  catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      // 오래된 감사 로그 절반 제거 후 재시도
      ['kcos_audit_v4', 'kcos_sec_audit_v4'].forEach(k => {
        try {
          const arr = dec<unknown[]>(localStorage.getItem(k));
          if (Array.isArray(arr)) localStorage.setItem(k, enc(arr.slice(0, 150)));
        } catch {}
      });
      try { localStorage.setItem(key, enc(val)); } catch {}
    }
  }
}

export function getLS<T>(key: string): T | null {
  try { return dec<T>(localStorage.getItem(key)); } catch { return null; }
}

export function delLS(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

// ── 비밀번호 해시 (단방향, 1000 라운드) ──────────────────────

const PEPPER = 'KCOS-PEPPER-V4-2025';

export function hashPw(pw: string, salt: string): string {
  const s = `${salt.toLowerCase()}:${pw}:${PEPPER}`;
  let h1 = 0x9e3779b9, h2 = 0x85ebca6b;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (Math.imul(h1 ^ c, 0x9e3779b9) >>> 0);
    h2 = (Math.imul(h2 ^ c, 0xc2b2ae35) >>> 0);
  }
  for (let r = 0; r < 1000; r++) {
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 0x45d9f3b) ^ h2) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 13), 0x243f6a88) ^ h1) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

export function verifyPw(pw: string, salt: string, hash: string): boolean {
  return hashPw(pw, salt) === hash;
}

// ── 감사 로그 ─────────────────────────────────────────────────

export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'REGISTER'
  | 'CREATE_PATIENT' | 'UPDATE_PATIENT' | 'DELETE_PATIENT'
  | 'CREATE_CHART'   | 'UPDATE_CHART'   | 'DELETE_CHART'
  | 'EXPORT_PDF'     | 'UPDATE_PROFILE' | 'DELETE_ACCOUNT';

export interface AuditEntry {
  id:        string;
  ts:        number;
  userId:    string;
  action:    AuditAction;
  targetId?: string;
  detail?:   string;
}

const AUDIT_KEY = 'kcos_audit_v4';

export function writeAudit(userId: string, action: AuditAction, targetId?: string, detail?: string): void {
  if (!userId) return;
  const prev = getLS<AuditEntry[]>(AUDIT_KEY) ?? [];
  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(), userId, action, targetId, detail,
  };
  setLS(AUDIT_KEY, [entry, ...prev].slice(0, 500));
}

export function readAudit(userId: string): AuditEntry[] {
  return (getLS<AuditEntry[]>(AUDIT_KEY) ?? []).filter(e => e.userId === userId);
}
