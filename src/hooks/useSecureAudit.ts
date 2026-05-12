// ============================================================
//  useSecureAudit — 보안 감사 로그 (읽기 전용 · 활동 내역과 분리)
//  대상: 수정·삭제·PDF 출력 등 민감 동작만 기록
// ============================================================
import { safeGet, safeSet } from '../lib/storageManager';

export type SecureAction =
  | 'MODIFY_CHART'    // 차트 수정
  | 'DELETE_CHART'    // 차트 삭제
  | 'MODIFY_PATIENT'  // 환자 수정
  | 'DELETE_PATIENT'  // 환자 삭제
  | 'EXPORT_PDF'      // PDF 출력
  | 'EXPORT_JSON'     // JSON 내보내기
  | 'DELETE_ACCOUNT'  // 계정 삭제
  | 'AUTH_FAIL'       // 인증 실패 (보안)
  | 'BULK_DELETE';    // 일괄 삭제

export interface SecureAuditEntry {
  id:          string;
  timestamp:   number;
  userId:      string;
  action:      SecureAction;
  targetId?:   string;
  targetType?: string;
  details?:    string;
  ipHint?:     string; // 브라우저 핑거프린트 힌트 (timezone + lang)
}

const LS_KEY  = 'kcos_secure_audit_v2';
const MAX_LOG = 1000;

function uid() { return `sa-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }
function browserHint() {
  try { return `${Intl.DateTimeFormat().resolvedOptions().timeZone}/${navigator.language}`; } catch { return ''; }
}

// ── 정적 함수 (context 없이 직접 호출 가능) ──────────────────

export function writeSecureAudit(
  userId:      string,
  action:      SecureAction,
  targetId?:   string,
  targetType?: string,
  details?:    string,
): void {
  if (!userId) return;
  const all: SecureAuditEntry[] = safeGet<SecureAuditEntry[]>(LS_KEY) ?? [];
  const entry: SecureAuditEntry = {
    id: uid(), timestamp: Date.now(), userId, action,
    targetId, targetType, details, ipHint: browserHint(),
  };
  // 읽기 전용 보장: prepend only, no editing
  safeSet(LS_KEY, [entry, ...all].slice(0, MAX_LOG));
}

export function readSecureAudit(userId: string): SecureAuditEntry[] {
  const all: SecureAuditEntry[] = safeGet<SecureAuditEntry[]>(LS_KEY) ?? [];
  return all.filter(e => e.userId === userId);
}

// ── React 훅 ─────────────────────────────────────────────────

export function useSecureAudit(currentUserId: string | undefined) {
  const logSecure = (
    action:      SecureAction,
    targetId?:   string,
    targetType?: string,
    details?:    string,
  ) => {
    if (!currentUserId) return;
    writeSecureAudit(currentUserId, action, targetId, targetType, details);
  };

  const getSecureLogs = (): SecureAuditEntry[] =>
    currentUserId ? readSecureAudit(currentUserId) : [];

  return { logSecure, getSecureLogs };
}
