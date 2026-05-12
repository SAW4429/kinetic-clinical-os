// ============================================================
//  AuthContext.tsx v7 — Supabase Auth 하이브리드
//
//  USE_CLOUD_DB=false  → 기존 localStorage 인증 (변경 없음)
//  USE_CLOUD_DB=true   → Supabase Auth + profiles 테이블
//
//  register / login 이 async 로 변경됨 (Promise<AuthError|null>)
// ============================================================

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from 'react';
import { setLS, getLS, hashPw, verifyPw, writeAudit } from '../lib/storage';
import { supabase, USE_CLOUD_DB } from '../lib/db/supabaseClient';
import { cloudGetProfile, cloudUpsertProfile } from '../lib/db/cloudAdapter';

// ── 타입 ─────────────────────────────────────────────────────

export type UserRole   = 'student' | 'practitioner' | 'other';
export type SystemRole = 'student' | 'general' | 'expert';
export type ExpertTier = 'none' | 'clinician' | 'physician' | 'researcher';
export type AuthError  = 'ID_EXISTS' | 'ID_NOT_FOUND' | 'WRONG_PASSWORD';

export interface AppUser {
  id:           string;
  userId:       string;
  passwordHash: string;
  name:         string;
  age:          number;
  phone:        string;
  email:        string;
  role:         UserRole;
  school:       string;
  organization: string;
  avatarBase64?: string;
  registeredAt: number;
  lastLoginAt?: number;
}

// ── RBAC ─────────────────────────────────────────────────────

export const ROLE_TABS: Record<SystemRole, string[]> = {
  student: ['dashboard','mechanism','fitt','flow','soap'],
  general: ['dashboard','mechanism','fitt','flow','soap'],
  expert:  ['dashboard','mechanism','fitt','flow','soap','pitfalls','recovery','mps','cns','rom'],
};

const SYSTEM_ROLE: Record<UserRole, SystemRole> = {
  student: 'student', practitioner: 'expert', other: 'general',
};

const KCOS_CODES: Record<string, ExpertTier> = {
  'KCOS-2025-CLINIC': 'clinician',
  'KCOS-2025-PHYSIC': 'physician',
  'KCOS-2025-RESRCH': 'researcher',
};

// ── localStorage 키 ───────────────────────────────────────────

const SESSION_KEY  = 'kinetic_session';
const AUTH_KEY     = 'kinetic_auth_state';
const USERS_KEY    = 'kcos_users_v4';
const REMEMBER_KEY = 'kcos_remember_id';

// ── Supabase synthetic email 패턴 ────────────────────────────
// userId "myuser123" → "myuser123@kinetic-kcos.local"
const toSyntheticEmail = (userId: string) => `${userId.toLowerCase()}@kinetic-kcos.local`;

// ── 영속 상태 ────────────────────────────────────────────────

interface PersistedAuth {
  isLoggedIn: boolean;
  userId:     string | null;
  expertCode: ExpertTier;
}

const DEFAULT_AUTH: PersistedAuth = { isLoggedIn: false, userId: null, expertCode: 'none' };
const VALID_TIERS  = new Set<string>(['none','clinician','physician','researcher']);

function readAuth(): PersistedAuth {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(AUTH_KEY);
    if (!raw) return DEFAULT_AUTH;
    const p = JSON.parse(raw) as PersistedAuth;
    if (typeof p !== 'object' || p === null) return DEFAULT_AUTH;
    return {
      isLoggedIn: !!p.isLoggedIn,
      userId:     typeof p.userId === 'string' ? p.userId : null,
      expertCode: VALID_TIERS.has(p.expertCode as string) ? (p.expertCode as ExpertTier) : 'none',
    };
  } catch { return DEFAULT_AUTH; }
}

function writeAuth(state: PersistedAuth): void {
  try {
    const json = JSON.stringify(state);
    localStorage.setItem(SESSION_KEY, json);
    localStorage.setItem(AUTH_KEY,    json);
  } catch {}
}

function loadUsers(): AppUser[] { return getLS<AppUser[]>(USERS_KEY) ?? []; }
function saveUsers(u: AppUser[]): void { setLS(USERS_KEY, u); }
function uuid(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }

// ── Supabase 프로필 → AppUser 변환 ───────────────────────────

function profileToAppUser(profile: Record<string, unknown>, supabaseId: string): AppUser {
  return {
    id:           supabaseId,
    userId:       profile.user_id_str as string,
    passwordHash: '',                            // Supabase Auth 관리
    name:         (profile.name       as string) ?? '',
    age:          (profile.age        as number) ?? 0,
    phone:        (profile.phone      as string) ?? '',
    email:        (profile.email      as string) ?? '',
    role:         (profile.role       as UserRole) ?? 'student',
    school:       (profile.school     as string) ?? '',
    organization: (profile.organization as string) ?? '',
    avatarBase64: profile.avatar_base64 as string | undefined,
    registeredAt: (profile.registered_at as number) ?? Date.now(),
    lastLoginAt:  profile.last_login_at  as number | undefined,
  };
}

// ── Context 인터페이스 ────────────────────────────────────────

interface AuthCtx {
  user:           AppUser | null;
  isLoggedIn:     boolean;
  isReady:        boolean;
  expertTier:     ExpertTier;
  isExpert:       boolean;
  systemRole:     SystemRole;
  accessibleTabs: string[];
  canAccess:      (tab: string) => boolean;

  // async 로 변경 (Supabase 모드에서 await 필요)
  register:       (d: Omit<AppUser,'id'|'passwordHash'|'registeredAt'> & { password: string }) => Promise<AuthError | null>;
  login:          (userId: string, password: string, rememberMe: boolean) => Promise<AuthError | null>;
  logout:         () => Promise<void>;
  verifyKCOS:     (code: string) => Promise<ExpertTier | null>;
  clearExpert:    () => void;
  updateProfile:  (d: Partial<Pick<AppUser,'name'|'phone'|'email'|'school'|'organization'|'avatarBase64'>>) => void;
  updatePassword: (old: string, next: string) => AuthError | null;
  deleteAccount:  () => void;
  getSavedId:     () => string;
}

const Ctx = createContext<AuthCtx | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {

  const [persisted, setPersisted] = useState<PersistedAuth>(() => readAuth());
  const [userObj,   setUserObj]   = useState<AppUser | null>(() => {
    if (USE_CLOUD_DB) return null; // Supabase: onAuthStateChange 에서 복원
    const p = readAuth();
    if (!p.isLoggedIn || !p.userId) return null;
    return loadUsers().find(u => u.id === p.userId) ?? null;
  });
  const [isReady, setIsReady] = useState(false);

  // ── Supabase Auth 세션 리스너 (USE_CLOUD_DB=true) ────────────
  useEffect(() => {
    if (!USE_CLOUD_DB || !supabase) {
      // localStorage 모드: 기존 세션 복원
      const saved = readAuth();
      if (saved.isLoggedIn && saved.userId) {
        const found = loadUsers().find(u => u.id === saved.userId) ?? null;
        setUserObj(found);
        setPersisted(saved);
      }
      setIsReady(true);
      return;
    }

    // Supabase 모드: 세션 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await cloudGetProfile(session.user.id);
        if (profile) {
          const u = profileToAppUser(profile, session.user.id);
          setUserObj(u);
          setPersisted(p => ({ ...p, isLoggedIn: true, userId: session.user.id }));
          writeAuth({ isLoggedIn: true, userId: session.user.id, expertCode: (profile.expert_code as ExpertTier) ?? 'none' });
          if (profile.expert_code && VALID_TIERS.has(profile.expert_code as string)) {
            setPersisted(p => ({ ...p, expertCode: profile.expert_code as ExpertTier }));
          }
        }
      } else {
        setUserObj(null);
        setPersisted(DEFAULT_AUTH);
        writeAuth(DEFAULT_AUTH);
      }
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── 파생 상태 ────────────────────────────────────────────────
  const expertTier     = persisted.expertCode;
  const isExpert       = expertTier !== 'none';
  const systemRole: SystemRole = userObj
    ? (isExpert && SYSTEM_ROLE[userObj.role] !== 'expert' ? 'expert' : SYSTEM_ROLE[userObj.role])
    : 'general';
  const accessibleTabs = ROLE_TABS[systemRole];
  const canAccess      = useCallback((t: string) => accessibleTabs.includes(t), [accessibleTabs]);

  // ── auto-save (localStorage 모드) ────────────────────────────
  useEffect(() => {
    if (USE_CLOUD_DB) return; // Supabase 모드: onAuthStateChange 가 저장
    writeAuth({ isLoggedIn: !!userObj, userId: userObj?.id ?? null, expertCode: persisted.expertCode });
  }, [userObj, persisted.expertCode]);

  // ── 회원가입 ──────────────────────────────────────────────────
  const register = useCallback(async (
    d: Omit<AppUser,'id'|'passwordHash'|'registeredAt'> & { password: string }
  ): Promise<AuthError | null> => {

    if (USE_CLOUD_DB && supabase) {
      // ─ Supabase 모드 ─
      const email = toSyntheticEmail(d.userId);

      // userId 중복 확인
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id_str', d.userId.trim());
      if ((count ?? 0) > 0) return 'ID_EXISTS';

      const { data, error } = await supabase.auth.signUp({ email, password: d.password });
      if (error || !data.user) return 'ID_NOT_FOUND';

      await cloudUpsertProfile({
        id:           data.user.id,
        user_id_str:  d.userId.trim(),
        name:         d.name.trim(),
        age:          d.age,
        phone:        d.phone.trim(),
        email:        d.email.trim(),
        role:         d.role,
        school:       d.school.trim(),
        organization: d.organization.trim(),
        expert_code:  'none',
        registered_at:Date.now(),
      });
      return null;
    }

    // ─ localStorage 모드 ─
    const users = loadUsers();
    if (users.some(u => u.userId.toLowerCase() === d.userId.toLowerCase())) return 'ID_EXISTS';
    const id = uuid();
    const nu: AppUser = {
      ...d, id,
      userId:       d.userId.trim(),
      passwordHash: hashPw(d.password, d.userId.trim()),
      name:         d.name.trim(),
      phone:        d.phone.trim(),
      email:        d.email.trim(),
      school:       d.school.trim(),
      organization: d.organization.trim(),
      registeredAt: Date.now(),
    };
    saveUsers([...users, nu]);
    setUserObj(nu);
    setPersisted(p => ({ ...p, isLoggedIn: true, userId: id }));
    writeAudit(id, 'REGISTER', id);
    return null;
  }, []);

  // ── 로그인 ───────────────────────────────────────────────────
  const login = useCallback(async (
    userId: string, password: string, rememberMe: boolean
  ): Promise<AuthError | null> => {

    if (USE_CLOUD_DB && supabase) {
      // ─ Supabase 모드 ─
      const email = toSyntheticEmail(userId);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) return 'WRONG_PASSWORD';
        return 'ID_NOT_FOUND';
      }
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, userId.trim());
      else            localStorage.removeItem(REMEMBER_KEY);

      // onAuthStateChange 가 프로필 로드 처리
      await cloudUpsertProfile({ id: data.user.id, last_login_at: Date.now() });
      return null;
    }

    // ─ localStorage 모드 ─
    const users = loadUsers();
    const found = users.find(u => u.userId.toLowerCase() === userId.trim().toLowerCase());
    if (!found) return 'ID_NOT_FOUND';
    if (!verifyPw(password, found.userId.trim(), found.passwordHash)) return 'WRONG_PASSWORD';

    if (rememberMe) localStorage.setItem(REMEMBER_KEY, userId.trim());
    else            localStorage.removeItem(REMEMBER_KEY);

    const updated = { ...found, lastLoginAt: Date.now() };
    saveUsers(users.map(u => u.id === found.id ? updated : u));
    setUserObj(updated);

    const prev = readAuth();
    setPersisted({ isLoggedIn: true, userId: found.id, expertCode: prev.expertCode });
    writeAudit(found.id, 'LOGIN', found.id);
    return null;
  }, []);

  // ── 로그아웃 ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (userObj) writeAudit(userObj.id, 'LOGOUT', userObj.id);
    if (USE_CLOUD_DB && supabase) await supabase.auth.signOut();
    setUserObj(null);
    setPersisted({ isLoggedIn: false, userId: null, expertCode: 'none' });
    writeAuth({ isLoggedIn: false, userId: null, expertCode: 'none' });
  }, [userObj]);

  // ── 전문가 코드 ───────────────────────────────────────────────
  const verifyKCOS = useCallback(async (code: string): Promise<ExpertTier | null> => {
    await new Promise(r => setTimeout(r, 700));
    const tier = KCOS_CODES[code.trim().toUpperCase()] ?? null;
    if (tier) {
      setPersisted(p => ({ ...p, expertCode: tier }));
      if (USE_CLOUD_DB && supabase && userObj) {
        await cloudUpsertProfile({ id: userObj.id, expert_code: tier });
      }
    }
    return tier;
  }, [userObj]);

  const clearExpert = useCallback(() => {
    setPersisted(p => ({ ...p, expertCode: 'none' }));
    if (USE_CLOUD_DB && supabase && userObj) {
      cloudUpsertProfile({ id: userObj.id, expert_code: 'none' });
    }
  }, [userObj]);

  // ── 프로필 수정 ───────────────────────────────────────────────
  const updateProfile = useCallback((d: Partial<Pick<AppUser,'name'|'phone'|'email'|'school'|'organization'|'avatarBase64'>>) => {
    if (!userObj) return;
    const updated = { ...userObj, ...d };
    if (!USE_CLOUD_DB) saveUsers(loadUsers().map(u => u.id === userObj.id ? updated : u));
    if (USE_CLOUD_DB && supabase) {
      cloudUpsertProfile({
        id:           userObj.id,
        name:         d.name         ?? userObj.name,
        phone:        d.phone        ?? userObj.phone,
        email:        d.email        ?? userObj.email,
        school:       d.school       ?? userObj.school,
        organization: d.organization ?? userObj.organization,
        avatar_base64:d.avatarBase64 ?? userObj.avatarBase64,
      });
    }
    setUserObj(updated);
    writeAudit(userObj.id, 'UPDATE_PROFILE', userObj.id);
  }, [userObj]);

  // ── 비밀번호 변경 (localStorage 모드만, Supabase는 별도 플로우) ──
  const updatePassword = useCallback((old: string, next: string): AuthError | null => {
    if (!userObj) return 'ID_NOT_FOUND';
    if (USE_CLOUD_DB) {
      // Supabase: supabase.auth.updateUser({ password: next }) 사용
      // 현재는 localStorage 모드에서만 지원
      return null;
    }
    if (!verifyPw(old, userObj.userId.trim(), userObj.passwordHash)) return 'WRONG_PASSWORD';
    const updated = { ...userObj, passwordHash: hashPw(next, userObj.userId.trim()) };
    saveUsers(loadUsers().map(u => u.id === userObj.id ? updated : u));
    setUserObj(updated);
    return null;
  }, [userObj]);

  // ── 계정 삭제 ─────────────────────────────────────────────────
  const deleteAccount = useCallback(() => {
    if (!userObj) return;
    writeAudit(userObj.id, 'DELETE_ACCOUNT', userObj.id);
    if (!USE_CLOUD_DB) saveUsers(loadUsers().filter(u => u.id !== userObj.id));
    if (USE_CLOUD_DB && supabase) supabase.auth.admin?.deleteUser(userObj.id);
    setUserObj(null);
    setPersisted(DEFAULT_AUTH);
    writeAuth(DEFAULT_AUTH);
  }, [userObj]);

  const getSavedId = useCallback(() => localStorage.getItem(REMEMBER_KEY) ?? '', []);

  const value: AuthCtx = {
    user: userObj, isLoggedIn: !!userObj, isReady,
    expertTier, isExpert, systemRole, accessibleTabs, canAccess,
    register, login, logout, verifyKCOS, clearExpert,
    updateProfile, updatePassword, deleteAccount, getSavedId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export const useUserAuth = useAuth;
