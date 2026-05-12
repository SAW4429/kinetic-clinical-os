// ============================================================
//  useAuditLog — 감사 로그 훅
//  동작: 생성/수정/삭제/내보내기/로그인 등 이벤트 기록
// ============================================================

import { useCallback } from 'react';
import { secureGet, secureSet } from '../lib/secureStorage';

export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'REGISTER'
  | 'CREATE_PATIENT' | 'UPDATE_PATIENT' | 'DELETE_PATIENT'
  | 'CREATE_SESSION' | 'UPDATE_SESSION' | 'DELETE_SESSION'
  | 'EXPORT_PDF' | 'EXPORT_JSON'
  | 'UPDATE_PROFILE' | 'DELETE_ACCOUNT'
  | 'VIEW_DATA';

export interface AuditEntry {
  id:          string;
  timestamp:   number;
  userId:      string;
  action:      AuditAction;
  targetType?: string;
  targetId?:   string;
  details?:    string;
}

const LS_KEY     = 'kcos_audit_log_v2';
const MAX_ENTRIES = 500;

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

// 정적 helper (context 밖에서 직접 호출할 때 사용)
export function writeAuditLog(
  userId: string,
  action: AuditAction,
  targetType?: string,
  targetId?: string,
  details?: string,
): void {
  if (!userId) return;
  const all: AuditEntry[] = secureGet<AuditEntry[]>(LS_KEY) ?? [];
  const entry: AuditEntry = { id: uid(), timestamp: Date.now(), userId, action, targetType, targetId, details };
  secureSet(LS_KEY, [entry, ...all].slice(0, MAX_ENTRIES));
}

export function readAuditLog(userId: string): AuditEntry[] {
  const all: AuditEntry[] = secureGet<AuditEntry[]>(LS_KEY) ?? [];
  return all.filter(e => e.userId === userId);
}

export function readAllAuditLog(): AuditEntry[] {
  return secureGet<AuditEntry[]>(LS_KEY) ?? [];
}

// ── React 훅 ─────────────────────────────────────────────────

export function useAuditLog(currentUserId: string | undefined) {
  const log = useCallback((
    action:      AuditAction,
    targetType?: string,
    targetId?:   string,
    details?:    string,
  ) => {
    if (!currentUserId) return;
    writeAuditLog(currentUserId, action, targetType, targetId, details);
  }, [currentUserId]);

  const getMyLogs = useCallback((): AuditEntry[] => {
    return currentUserId ? readAuditLog(currentUserId) : [];
  }, [currentUserId]);

  return { log, getMyLogs };
}
