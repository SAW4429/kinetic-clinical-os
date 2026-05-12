// ============================================================
//  UserAuthContext.tsx — 호환 레이어 (AuthContext.tsx 위임)
//  기존 컴포넌트가 이 파일에서 import해도 AuthContext 상태 사용
// ============================================================

export type {
  UserRole,
  SystemRole,
  ExpertTier,
  AuthError,
  AppUser,
  AppUser as RegisteredUser,   // 기존 컴포넌트 호환 alias
} from './AuthContext';

export { ROLE_TABS } from './AuthContext';

export {
  AuthProvider    as UserAuthProvider,
  useAuth         as useUserAuth,
  useAuth,
} from './AuthContext';
