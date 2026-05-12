import React, { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import { GlobalErrorBanner } from './components/ui/GlobalErrorBanner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChartProvider }         from './context/ChartContext';
import { PatientProvider }       from './context/PatientContext';
import { LandingPage }           from './pages/LandingPage';
import { AuthPage }              from './pages/AuthPage';
import { ProfilePage }           from './pages/ProfilePage';
import { MainLayout }            from './components/layout/MainLayout';
import { ClinicalDashboard }     from './components/dashboard/ClinicalDashboard';
import { PatientDetailView }     from './components/dashboard/PatientDetailView';
import { MechanismPanel }        from './components/clinical/MechanismPanel';
import { FITTVPBuilder }         from './components/prescription/FITTVPBuilder';
import { PitfallChecker }        from './components/expert/PitfallChecker';
import { RecoveryBiomarker }     from './components/clinical/RecoveryBiomarker';
import { MPSCalculator }         from './components/clinical/MPSCalculator';
import { CNSFatigueTracker }     from './components/clinical/CNSFatigueTracker';
import { ROMAnalyzer }           from './components/clinical/ROMAnalyzer';
import { ClinicalFlow }          from './components/clinical/ClinicalFlow';
import { SOAPChart }             from './components/clinical/SOAPChart';
import type { Language } from './data/clinicalDB';

type TabKey  = 'dashboard'|'mechanism'|'fitt'|'flow'|'soap'|'pitfalls'|'recovery'|'mps'|'cns'|'rom';
type AppView = 'home'|'auth'|'app';

// ── 전체 앱 에러 경계 ─────────────────────────────────────────

class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:Error|null}> {
  constructor(p:any){super(p);this.state={error:null};}
  static getDerivedStateFromError(e:Error){return{error:e};}
  render(){
    if(this.state.error)return(
      <div style={{minHeight:'100vh',background:'#020617',color:'#f1f5f9',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',padding:'32px',fontFamily:'ui-sans-serif'}}>
        <div style={{fontSize:'48px'}}>⚠️</div>
        <h2 style={{fontSize:'18px',fontWeight:700,margin:0}}>렌더링 오류</h2>
        <pre style={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',padding:'16px',fontSize:'12px',color:'#f87171',maxWidth:'600px',overflow:'auto',whiteSpace:'pre-wrap'}}>
          {this.state.error.message}
        </pre>
        <button onClick={()=>{this.setState({error:null});window.location.reload();}}
          style={{background:'#0284c7',color:'white',border:'none',borderRadius:'12px',padding:'12px 24px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
          새로고침
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── 탭별 에러 경계 (탭 하나가 터져도 전체 앱 보호) ─────────────

class TabErrorBoundary extends React.Component<
  { children:React.ReactNode; tabKey:string },
  { error:Error|null }
> {
  constructor(p:any){super(p);this.state={error:null};}
  static getDerivedStateFromError(e:Error){return{error:e};}
  componentDidUpdate(prev:{tabKey:string}){
    // 탭 전환 시 오류 상태 초기화 (다른 탭은 정상 작동)
    if(prev.tabKey!==this.props.tabKey) this.setState({error:null});
  }
  render(){
    if(this.state.error)return(
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm font-bold text-red-400">이 탭에서 오류가 발생했습니다.</p>
        <pre className="text-xs text-slate-500 max-w-sm whitespace-pre-wrap">{this.state.error.message}</pre>
        <button onClick={()=>this.setState({error:null})}
          className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-500">
          재시도
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── 전문가 코드 입력 모달 ─────────────────────────────────────

function ExpertModal({ lang, onClose }: { lang:Language; onClose:()=>void }) {
  const { verifyKCOS, expertTier, clearExpert } = useAuth();
  const [code,     setCode]     = useState('');
  const [status,   setStatus]   = useState<'idle'|'verifying'|'fail'>('idle');
  const [errMsg,   setErrMsg]   = useState('');
  const onKey = (e:KeyboardEvent<HTMLInputElement>) => { if(e.key==='Enter') submit(); };

  const submit = async () => {
    if (!code.trim()) return;
    setStatus('verifying'); setErrMsg('');
    const tier = await verifyKCOS(code);
    if (tier) { onClose(); }
    else { setStatus('fail'); setErrMsg(lang==='ko'?'유효하지 않은 자격 코드입니다.':lang==='ja'?'無効な資格コードです。':'Invalid credential code.'); }
  };

  const L = {
    ko:{ title:'전문가 자격 인증', sub:'자격 코드를 입력하여 전문가 기능을 활성화합니다.', ph:'KCOS-XXXX-XXXXX', btn:'인증하기', verifying:'검증 중...', granted:'인증됨', clear:'인증 해제', codes:'데모 코드' },
    ja:{ title:'専門家資格認証', sub:'資格コードを入力して専門家機能を有効化します。', ph:'KCOS-XXXX-XXXXX', btn:'認証する', verifying:'検証中...', granted:'認証済み', clear:'認証解除', codes:'デモコード' },
    en:{ title:'Expert Authentication', sub:'Enter credential code to unlock expert features.', ph:'KCOS-XXXX-XXXXX', btn:'Authenticate', verifying:'Verifying...', granted:'Authorised', clear:'Revoke', codes:'Demo codes' },
  }[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div><h2 className="text-base font-bold text-slate-100 flex items-center gap-2"><span>◉</span>{L.title}</h2><p className="text-sm text-slate-400 mt-1">{L.sub}</p></div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl ml-3">✕</button>
        </div>

        {expertTier !== 'none' ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-950/40 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>
              <span className="text-sm font-bold text-emerald-400">{L.granted} — {expertTier}</span>
            </div>
            <button onClick={()=>{clearExpert();onClose();}} className="rounded-xl border border-red-700 bg-red-950/40 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-900/40">{L.clear}</button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <input type="password" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={onKey}
                placeholder={L.ph} disabled={status==='verifying'}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm tracking-widest text-slate-100 focus:border-sky-400 focus:outline-none" autoFocus/>
              <button onClick={submit} disabled={status==='verifying'||!code.trim()}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition-all">
                {status==='verifying'?L.verifying:L.btn}
              </button>
            </div>
            {errMsg && <p className="text-sm text-red-400 mb-3">{errMsg}</p>}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 mt-2">
              <p className="text-xs font-bold text-slate-400 mb-2">{L.codes}</p>
              <div className="flex flex-col gap-1 font-mono text-xs text-slate-400">
                <span>› KCOS-2025-CLINIC <span className="text-slate-600">(clinician)</span></span>
                <span>› KCOS-2025-PHYSIC <span className="text-slate-600">(physician)</span></span>
                <span>› KCOS-2025-RESRCH <span className="text-slate-600">(researcher)</span></span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab Content ───────────────────────────────────────────────

function TabContent({ tab, lang, onNav, onOpenChart }:{ tab:TabKey; lang:Language; onNav:(t:string)=>void; onOpenChart:(id:string)=>void }) {
  switch(tab){
    case 'dashboard': return <ClinicalDashboard lang={lang} onNavigateToTab={onNav} onOpenChart={onOpenChart}/>;
    case 'mechanism': return <MechanismPanel lang={lang}/>;
    case 'fitt':      return <FITTVPBuilder lang={lang}/>;
    case 'flow':      return <ClinicalFlow lang={lang}/>;
    case 'soap':      return <SOAPChart lang={lang} onOpenChart={onOpenChart}/>;
    case 'pitfalls':  return <PitfallChecker lang={lang}/>;
    case 'recovery':  return <RecoveryBiomarker lang={lang}/>;
    case 'mps':       return <MPSCalculator lang={lang}/>;
    case 'cns':       return <CNSFatigueTracker lang={lang}/>;
    case 'rom':       return <ROMAnalyzer lang={lang}/>;
  }
  return null;
}

// ── Dashboard App ─────────────────────────────────────────────

function DashboardApp({ lang, onLangChange, theme, onThemeToggle, onGoHome }:{
  lang:Language; onLangChange:(l:Language)=>void;
  theme:'dark'|'light'; onThemeToggle:()=>void; onGoHome:()=>void;
}) {
  const [activeTab,       setActiveTab]       = useState<TabKey>('dashboard');
  const [showProfile,     setShowProfile]     = useState(false);
  const [showExpert,      setShowExpert]      = useState(false);
  const [patientDetailId, setPatientDetailId] = useState<string|null>(null); // 환자별 독립 차팅 공간
  const { user, logout, canAccess, systemRole, isExpert } = useAuth();

  const EXPERT_TABS: TabKey[] = ['pitfalls','recovery','mps','cns','rom'];

  // ── ref: 최신 auth 값을 항상 반영 (stale closure 완전 차단) ─────
  const authRef = useRef({ isExpert, canAccess });
  useEffect(() => { authRef.current = { isExpert, canAccess }; }, [isExpert, canAccess]);

  // ── 탭 접근 판단 ─────────────────────────────────────────────
  //  핵심: 전문가 코드(isExpert) 보유 시 RBAC 우선순위 역전
  //        kinetic_auth_state.expertCode = 'clinician' → 즉시 접근 (모달 없음)
  const handleTabChange = useCallback((key: string) => {
    const tab = key as TabKey;
    const { isExpert: exp, canAccess: access } = authRef.current;

    const canUse = EXPERT_TABS.includes(tab)
      ? exp                  // 전문가 코드 있으면 역할 무관하게 허용 (Bypass)
      : access(tab);         // 일반 탭: RBAC 적용

    if (!canUse) { setShowExpert(true); return; }
    setShowProfile(false);
    setActiveTab(tab);
  }, []); // authRef로 최신값 읽으므로 deps 없음

  const handleOpenChart = (id: string) => {
    setPatientDetailId(id);
    setShowProfile(false);
  };

  // ── 환자별 독립 차팅 공간 ───────────────────────────────────
  if (patientDetailId) {
    return (
      <MainLayout lang={lang} onLangChange={onLangChange} activeTab={activeTab}
        onTabChange={handleTabChange} theme={theme} onThemeToggle={onThemeToggle}
        onGoHome={onGoHome} currentUser={user} onGoProfile={() => { setShowProfile(true); setPatientDetailId(null); }}>
        <PatientDetailView
          patientId={patientDetailId}
          lang={lang}
          onBack={() => setPatientDetailId(null)}/>
      </MainLayout>
    );
  }

  if (showProfile) {
    return (
      <ProfilePage lang={lang}
        onBack={() => setShowProfile(false)}
        onDeleted={() => { logout(); onGoHome(); }}
        onOpenChart={handleOpenChart}/>
    );
  }

  return (
    <MainLayout lang={lang} onLangChange={onLangChange} activeTab={activeTab}
      onTabChange={handleTabChange} theme={theme} onThemeToggle={onThemeToggle}
      onGoHome={onGoHome} currentUser={user} onGoProfile={() => setShowProfile(true)}>
      <div className="h-full overflow-y-auto" style={{ background: theme==='dark' ? '#020617' : 'rgb(248,249,250)' }}>
        <TabErrorBoundary tabKey={activeTab}>
          <TabContent tab={activeTab} lang={lang} onNav={handleTabChange} onOpenChart={handleOpenChart}/>
        </TabErrorBoundary>
      </div>
      {showExpert && <ExpertModal lang={lang} onClose={() => setShowExpert(false)}/>}
    </MainLayout>
  );
}

// ── App Router ────────────────────────────────────────────────

function AppRouter() {
  const { isLoggedIn, isReady, logout } = useAuth();
  // kinetic_session 복원 완료 후 view 결정 → 로그인 상태 flash 완전 차단
  const [view,  setView]  = useState<AppView>(() => isLoggedIn ? 'app' : 'home');
  const [lang,  setLang]  = useState<Language>('ko');
  const [theme, setTheme] = useState<'dark'|'light'>('dark');

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  // isLoggedIn 변화 감지 (로그아웃 등)
  useEffect(() => {
    if (!isLoggedIn && view === 'app') setView('home');
  }, [isLoggedIn]);

  // isReady 이전: 세션 복원 중 스피너 (kinetic_session 읽기 완료 전)
  if (!isReady) return (
    <div style={{ minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid #334155', borderTopColor:'#38bdf8', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const goHome = () => { logout(); setView('home'); };

  if (view === 'home') return (
    <LandingPage lang={lang} onLangChange={setLang}
      onEnter={() => setView(isLoggedIn ? 'app' : 'auth')}
      onSignup={() => setView('auth')}/>
  );

  if (view === 'auth') return (
    <AuthPage lang={lang} onLangChange={setLang}
      onBack={() => setView('home')}
      onSuccess={() => setView('app')}/>
  );

  // 'app' view: ChartProvider → PatientProvider → DashboardApp
  return (
    <ErrorBoundary>
      <ChartProvider>
        <PatientProvider>
          <DashboardApp lang={lang} onLangChange={setLang}
            theme={theme} onThemeToggle={() => setTheme(t => t==='dark'?'light':'dark')}
            onGoHome={goHome}/>
        </PatientProvider>
      </ChartProvider>
    </ErrorBoundary>
  );
}

// ── Root ──────────────────────────────────────────────────────

// ── 버전 배지 ─────────────────────────────────────────────────
function VersionBadge() {
  return (
    <div style={{
      position:'fixed', bottom:'8px', right:'12px', zIndex:9999,
      background:'rgba(15,23,42,0.85)', color:'#64748b',
      borderRadius:'6px', padding:'3px 8px',
      fontSize:'10px', fontFamily:'monospace', letterSpacing:'0.05em',
      border:'1px solid rgba(100,116,139,0.3)', backdropFilter:'blur(4px)',
      pointerEvents:'none', userSelect:'none',
    }}>
      v1.0.0-production-ready
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalErrorBanner/>
      <AppRouter/>
      <VersionBadge/>
    </AuthProvider>
  );
}
