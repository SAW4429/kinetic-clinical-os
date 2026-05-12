// ============================================================
//  ExpertAuthContext.tsx — 호환 레이어 (AuthContext.tsx 위임)
//  ExpertAuthProvider는 no-op, useExpertAuth는 useAuth 래핑
// ============================================================

import { type ReactNode } from 'react';
import { useAuth } from './AuthContext';
export type { ExpertTier } from './AuthContext';

// ── 기존 인터페이스 (호환용) ──────────────────────────────────

export type AuthStatus = 'idle' | 'verifying' | 'granted' | 'denied';

export interface ExpertProfile {
  tier:             string;
  displayName:      string;
  credentialHash:   string;
  accessGrantedAt:  number;
  sessionExpiresAt: number;
}

export interface ExpertAuthState {
  status:        AuthStatus;
  profile:       ExpertProfile | null;
  failedAttempts:number;
  lockedUntil:   number | null;
  error:         string | null;
}

// ── useExpertAuth — AuthContext 상태를 기존 인터페이스로 래핑 ──

export function useExpertAuth() {
  const { expertTier, isExpert, verifyKCOS, clearExpert } = useAuth();

  const status: AuthStatus = isExpert ? 'granted' : 'idle';
  const profile: ExpertProfile | null = isExpert ? {
    tier:             expertTier,
    displayName:      expertTier.charAt(0).toUpperCase() + expertTier.slice(1),
    credentialHash:   '',
    accessGrantedAt:  Date.now(),
    sessionExpiresAt: Date.now() + 8 * 3600 * 1000,
  } : null;

  // 기존 코드는 login(code: string): Promise<void> 형태를 기대함
  const login = async (code: string) => {
    await verifyKCOS(code);
  };

  return {
    state:          { status, profile, failedAttempts: 0, lockedUntil: null, error: null } as ExpertAuthState,
    login,
    logout:         () => clearExpert(),
    clearError:     () => {},
    isAuthorized:   (_?: string) => isExpert,
    isLocked:       () => false,
    lockRemainingMs:() => 0,
  };
}

// ── ExpertGate — AuthContext 기반으로 렌더링 제어 ─────────────

export function ExpertGate({
  requiredTier = 'clinician',
  fallback     = null,
  children,
}: {
  requiredTier?: string;
  fallback?:     ReactNode;
  children:      ReactNode;
}) {
  const { isExpert } = useAuth();
  return isExpert ? <>{children}</> : <>{fallback}</>;
}

// ── ExpertAuthProvider — No-op (상태는 AuthProvider에서 관리) ─

export function ExpertAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
