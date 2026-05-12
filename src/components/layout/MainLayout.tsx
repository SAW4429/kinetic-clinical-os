import { useState, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { useExpertAuth, ExpertGate } from '../../context/ExpertAuthContext';
import type { Language } from '../../data/clinicalDB';
import type { RegisteredUser } from '../../context/UserAuthContext';

const UI: Record<Language, Record<string, string>> = {
  ko: {
    appTitle:'Kinetic Clinical OS', appSub:'스포츠 의학 임상 분석 플랫폼',
    home:'홈으로',
    navDash:'대시보드', navMech:'병태생리 메커니즘', navFITT:'FITT-VP 처방',
    navFlow:'임상 프로세스', navSOAP:'SOAP 차팅',
    navPit:'Clinical Pitfalls', navRecov:'회복 바이오마커', navMPS:'MPS 계산기',
    navCNS:'CNS 피로 추적기', navROM:'ROM 분석',
    navVault:'전문가 전용 공간', vaultLabel:'전문가 전용 공간',
    vaultDesc:'자격이 인증된 임상가만 접근 가능합니다.',
    vaultInput:'자격 코드 입력', vaultPH:'KCOS-XXXX-XXXXX',
    vaultBtn:'입력', vaultVerify:'검증 중...', vaultLock:'잠금',
    vaultGranted:'인증됨', vaultLogout:'세션 종료',
    darkMode:'라이트 모드', lightMode:'다크 모드',
  },
  ja: {
    appTitle:'Kinetic Clinical OS', appSub:'スポーツ医学臨床分析プラットフォーム',
    home:'ホームへ',
    navDash:'ダッシュボード', navMech:'病態生理メカニズム', navFITT:'FITT-VP処方',
    navFlow:'臨床プロセス', navSOAP:'SOAPチャート',
    navPit:'Clinical Pitfalls', navRecov:'回復バイオマーカー', navMPS:'MPS計算機',
    navCNS:'CNS疲労追跡', navROM:'ROM分析',
    navVault:'専門家専用スペース', vaultLabel:'専門家専用スペース',
    vaultDesc:'資格認定臨床家のみアクセス可能です。',
    vaultInput:'資格コード入力', vaultPH:'KCOS-XXXX-XXXXX',
    vaultBtn:'入力', vaultVerify:'検証中...', vaultLock:'ロック',
    vaultGranted:'認証済み', vaultLogout:'セッション終了',
    darkMode:'ライトモード', lightMode:'ダークモード',
  },
  en: {
    appTitle:'Kinetic Clinical OS', appSub:'Sports Medicine Clinical Platform',
    home:'Back to Home',
    navDash:'Dashboard', navMech:'Pathophysiology', navFITT:'FITT-VP Rx',
    navFlow:'Clinical Flow', navSOAP:'SOAP Chart',
    navPit:'Pitfalls', navRecov:'Recovery', navMPS:'MPS Calc',
    navCNS:'CNS Fatigue', navROM:'ROM Analysis',
    navVault:'Expert Vault', vaultLabel:'Expert Vault',
    vaultDesc:'Access restricted to credentialed clinicians.',
    vaultInput:'Enter credential code', vaultPH:'KCOS-XXXX-XXXXX',
    vaultBtn:'Enter', vaultVerify:'Verifying...', vaultLock:'Locked',
    vaultGranted:'Authorised', vaultLogout:'End Session',
    darkMode:'Light Mode', lightMode:'Dark Mode',
  },
};

type NavKey = 'dashboard'|'mechanism'|'fitt'|'flow'|'soap'|'pitfalls'|'recovery'|'mps'|'cns'|'rom';
interface NavItem { key:NavKey; labelKey:string; icon:string; expertOnly:boolean; }

const NAV_ITEMS: NavItem[] = [
  { key:'dashboard', labelKey:'navDash',   icon:'⬡', expertOnly:false },
  { key:'mechanism', labelKey:'navMech',   icon:'⚗', expertOnly:false },
  { key:'fitt',      labelKey:'navFITT',   icon:'◈', expertOnly:false },
  { key:'flow',      labelKey:'navFlow',   icon:'→', expertOnly:false },
  { key:'soap',      labelKey:'navSOAP',   icon:'📋', expertOnly:false },
  { key:'pitfalls',  labelKey:'navPit',    icon:'⊘', expertOnly:true  },
  { key:'recovery',  labelKey:'navRecov',  icon:'♡', expertOnly:true  },
  { key:'mps',       labelKey:'navMPS',    icon:'⬢', expertOnly:true  },
  { key:'cns',       labelKey:'navCNS',    icon:'◎', expertOnly:true  },
  { key:'rom',       labelKey:'navROM',    icon:'∠', expertOnly:true  },
];

// ── Vault Panel ───────────────────────────────────────────────

function VaultPanel({ lang }: { lang: Language }) {
  const t = UI[lang];
  const { state, login, logout, clearError, isAuthorized, isLocked, lockRemainingMs } = useExpertAuth();
  const [code, setCode] = useState('');
  const submit = useCallback(async () => {
    if (!code.trim()) return;
    await login(code);
    setCode('');
  }, [code, login]);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') submit(); };
  const remain = Math.ceil(lockRemainingMs() / 60000);
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString(
    lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US',
    { hour: '2-digit', minute: '2-digit' },
  );

  return (
    <div className="vault-panel">
      <div className="vault-header">
        <span className="vault-icon">◉</span>
        <div><p className="vault-label">{t.vaultLabel}</p><p className="vault-desc">{t.vaultDesc}</p></div>
      </div>
      {state.status !== 'granted' && (
        <div className="vault-input-area">
          <label className="vault-input-label">{t.vaultInput}</label>
          <div className="vault-input-row">
            <input type="password" value={code}
              onChange={e => { setCode(e.target.value); if (state.error) clearError(); }}
              onKeyDown={onKey} placeholder={t.vaultPH}
              disabled={state.status === 'verifying' || isLocked()}
              className="vault-input" autoComplete="off" spellCheck={false}/>
            <button onClick={submit}
              disabled={state.status === 'verifying' || isLocked() || !code.trim()}
              className="vault-btn">
              {state.status === 'verifying' ? t.vaultVerify : t.vaultBtn}
            </button>
          </div>
          {isLocked() && <p className="vault-lock-msg">{t.vaultLock} — {remain}m</p>}
          {state.error && !isLocked() && <p className="vault-error-msg">{state.error}</p>}
        </div>
      )}
      {state.status === 'granted' && state.profile && (
        <div className="vault-granted-area">
          <div className="vault-granted-badge">
            <span className="vault-granted-dot"/><span>{t.vaultGranted} — {state.profile.displayName}</span>
          </div>
          <p className="vault-expiry-text">Exp: {fmt(state.profile.sessionExpiresAt)}</p>
          <button onClick={logout} className="vault-logout-btn">{t.vaultLogout}</button>
        </div>
      )}
      <ExpertGate requiredTier="researcher">
        <div className="vault-researcher-badge">RESEARCHER ACCESS</div>
      </ExpertGate>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface MainLayoutProps {
  children?:    ReactNode;
  lang:         Language;
  onLangChange: (l: Language) => void;
  activeTab:    string;
  onTabChange:  (k: string) => void;
  theme:        'dark' | 'light';
  onThemeToggle:() => void;
  onGoHome:     () => void;
  currentUser?: RegisteredUser | null;
  onGoProfile?: () => void;
}

// ── Layout ────────────────────────────────────────────────────

export function MainLayout({
  children, lang, onLangChange, activeTab, onTabChange,
  theme, onThemeToggle, onGoHome, currentUser, onGoProfile,
}: MainLayoutProps) {
  const [vaultOpen,   setVaultOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const t = UI[lang];
  const { isAuthorized, state: authState } = useExpertAuth();

  return (
    <div className="layout-root">

      {/* ── HEADER ── */}
      <header className="layout-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} aria-label="toggle sidebar">
            ☰
          </button>
          {/* 로고 클릭 → 홈으로 */}
          <button
            onClick={onGoHome}
            className="header-brand text-left hover:opacity-80 transition-opacity"
            title={t.home}
          >
            <span className="header-title">{t.appTitle}</span>
            <span className="header-subtitle">{t.appSub}</span>
          </button>
        </div>

        <div className="header-right">
          {/* 사용자 프로필 버튼 */}
          {currentUser && onGoProfile && (
            <button onClick={onGoProfile} className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 hover:border-sky-300 dark:hover:border-sky-700 transition-all" title="My Profile">
              <div className="h-6 w-6 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-xs font-bold text-sky-700 dark:text-sky-300">
                {currentUser.avatarBase64 ? <img src={currentUser.avatarBase64} alt="" className="h-full w-full object-cover"/> : currentUser.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">{currentUser.name}</span>
            </button>
          )}
          {isAuthorized() && (
            <div className="header-session-badge">
              <span className="session-dot"/>
              <span>{authState.profile?.displayName}</span>
            </div>
          )}
          {/* 3-way 언어 선택 */}
          <div className="lang-group">
            {(['ko','ja','en'] as Language[]).map(l => (
              <button key={l} onClick={() => onLangChange(l)}
                className={`lang-btn ${lang === l ? 'lang-btn-active' : ''}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Expert Vault */}
          <button
            className={`vault-trigger-btn ${vaultOpen ? 'vault-trigger-active' : ''} ${isAuthorized() ? 'vault-trigger-granted' : ''}`}
            onClick={() => setVaultOpen(p => !p)}
          >
            ◉ {isAuthorized() ? t.vaultGranted : t.navVault}
          </button>
        </div>
      </header>

      {/* Vault Dropdown */}
      {vaultOpen && (
        <div className="vault-dropdown-overlay">
          <div className="vault-dropdown-panel"><VaultPanel lang={lang}/></div>
          <div className="vault-dropdown-backdrop" onClick={() => setVaultOpen(false)}/>
        </div>
      )}

      <div className="layout-body">
        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <nav className="layout-sidebar">

            {/* 홈으로 돌아가기 버튼 (사이드바 최상단) */}
            <div className="px-3 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <button
                onClick={onGoHome}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
              >
                <span className="text-base">←</span>
                <span>{t.home}</span>
              </button>
            </div>

            <ul className="nav-list">
              {NAV_ITEMS.map(item => (
                <li key={item.key}>
                  <button
                    className={[
                      'nav-item',
                      activeTab === item.key ? 'nav-item-active' : '',
                      item.expertOnly ? 'nav-item-expert' : '',
                      item.expertOnly && isAuthorized() ? 'nav-item-granted' : '',
                    ].join(' ')}
                    onClick={() => onTabChange(item.key)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{t[item.labelKey]}</span>
                    {item.expertOnly && (
                      <span className={`nav-badge ${isAuthorized() ? 'badge-granted' : 'badge-locked'}`}>
                        {isAuthorized() ? '●' : '🔒'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {/* 사이드바 하단 — 테마 토글 */}
            <div className="sidebar-footer">
              <button
                className="theme-toggle-btn w-full flex items-center justify-center gap-2"
                onClick={onThemeToggle}
              >
                <span>{theme === 'dark' ? '☀' : '☾'}</span>
                <span>{theme === 'dark' ? t.darkMode : t.lightMode}</span>
              </button>
            </div>
          </nav>
        )}

        <main className="layout-main">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
