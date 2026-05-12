// ============================================================
//  secureStorage — XOR+Base64 로컬 암호화 유틸리티
//  Web Crypto API 없이 동기적으로 동작 (외부 패키지 불필요)
// ============================================================

const CIPHER_KEY = 'KCOS-CLINICAL-OS-2025-SECURE-KEY-v1.0-IMMUTABLE';

function xor(text: string): string {
  return Array.from(text)
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length)))
    .join('');
}

export function encryptData(data: unknown): string {
  try {
    const json    = JSON.stringify(data);
    const encoded = encodeURIComponent(json);
    return btoa(xor(encoded));
  } catch { return ''; }
}

export function decryptData<T>(cipher: string): T | null {
  try {
    const xored   = atob(cipher);
    const decoded = decodeURIComponent(xor(xored));
    return JSON.parse(decoded) as T;
  } catch { return null; }
}

export function secureSet(key: string, data: unknown): void {
  try { localStorage.setItem(key, encryptData(data)); } catch {}
}

export function secureGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? decryptData<T>(raw) : null;
  } catch { return null; }
}

export function secureRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

// ── 비밀번호 단방향 해시 (pbkdf2 시뮬레이션) ─────────────────

const HASH_PEPPER = 'KCOS-PWD-PEPPER-2025-IMMUTABLE';

export function hashPassword(plaintext: string, userId: string): string {
  const input = `${userId}:${plaintext}:${HASH_PEPPER}`;
  let h1 = 0x9e3779b9;
  let h2 = 0x85ebca6b;
  // Round 1 — character mixing
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x9e3779b9) >>> 0;
    h2 = Math.imul(h2 ^ ch, 0xc2b2ae35) >>> 0;
  }
  // Round 2 — avalanche (1000 iterations)
  for (let r = 0; r < 1000; r++) {
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 0x45d9f3b) ^ h2) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 13), 0x243f6a88) ^ h1) >>> 0;
  }
  return (h1.toString(16).padStart(8,'0') + h2.toString(16).padStart(8,'0'));
}

export function verifyPassword(plaintext: string, userId: string, storedHash: string): boolean {
  return hashPassword(plaintext, userId) === storedHash;
}
