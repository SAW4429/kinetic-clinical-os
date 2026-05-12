// ============================================================
//  LandingPage — 단일 CTA + 핵심 기능 요약 카드
// ============================================================

import { useUserAuth } from '../context/UserAuthContext';
import type { Language } from '../data/clinicalDB';

const T = {
  ko: {
    badge:    'Sports Medicine Clinical Platform',
    title1:   'Kinetic',
    title2:   'Clinical OS',
    subtitle: '문진부터 복귀 판정까지, 임상 현장의 모든 워크플로우를 하나의 플랫폼에.',
    cta:      '대시보드 시작하기',
    ctaReturn:'대시보드 재접속',
    signup:   '계정 만들기',
    features: [
      { icon:'⚗', title:'병태생리 기반 접근', desc:'mTOR·PGC-1α·NMJ 등 8가지 분자 수준 기전부터 임상 적용까지 체계적으로 연결.' },
      { icon:'→', title:'6단계 임상 워크플로우', desc:'문진 → 레드플래그 → 가설 → 측정 → 재측정 → SOAP 차팅. 처음부터 끝까지 한 화면에서.' },
      { icon:'◈', title:'근거 기반 운동 처방', desc:'5개 기저질환 FITT-VP 프로토콜과 실시간 HRR 계산으로 안전한 강도 처방을 즉시 생성.' },
      { icon:'◉', title:'역할별 전문가 시스템', desc:'학생용 교육 콘텐츠와 임상가용 실무 도구를 역할에 따라 자동으로 최적화하여 제공.' },
    ],
    stats: [
      { val:'8',   label:'병태생리 메커니즘' },
      { val:'5',   label:'FITT-VP 프로토콜'  },
      { val:'20',  label:'임상 Pitfalls'      },
      { val:'3',   label:'지원 언어'          },
    ],
    footer: '© 2025 Kinetic Clinical OS — 스포츠 의학 임상가를 위한 오픈 플랫폼',
    userGreet: (name: string) => `${name}님으로 등록됨`,
    signOut: '계정 변경',
  },
  ja: {
    badge:    'Sports Medicine Clinical Platform',
    title1:   'Kinetic',
    title2:   'Clinical OS',
    subtitle: '問診から競技復帰まで、臨床現場のすべてのワークフローをひとつのプラットフォームに。',
    cta:      'ダッシュボードを開始',
    ctaReturn:'ダッシュボードに再接続',
    signup:   'アカウント作成',
    features: [
      { icon:'⚗', title:'病態生理ベースアプローチ', desc:'mTOR・PGC-1α・NMJなど8つの分子レベル機序から臨床応用まで体系的に連結。' },
      { icon:'→', title:'6ステップ臨床ワークフロー', desc:'問診→レッドフラグ→仮説→測定→再測定→SOAPチャート。最初から最後まで1画面で。' },
      { icon:'◈', title:'根拠に基づく運動処方', desc:'5疾患FITT-VPプロトコルとリアルタイムHRR計算で安全な強度処方を即時生成。' },
      { icon:'◉', title:'役割別専門家システム', desc:'学生用教育コンテンツと臨床家用実務ツールを役割に応じて自動最適化して提供。' },
    ],
    stats: [
      { val:'8',   label:'病態生理メカニズム' },
      { val:'5',   label:'FITT-VPプロトコル'  },
      { val:'20',  label:'臨床Pitfalls'        },
      { val:'3',   label:'対応言語'            },
    ],
    footer: '© 2025 Kinetic Clinical OS — スポーツ医学臨床家のためのオープンプラットフォーム',
    userGreet: (name: string) => `${name}さんで登録済み`,
    signOut: 'アカウント変更',
  },
  en: {
    badge:    'Sports Medicine Clinical Platform',
    title1:   'Kinetic',
    title2:   'Clinical OS',
    subtitle: 'From initial interview to return-to-sport — every clinical workflow in one platform.',
    cta:      'Launch Dashboard',
    ctaReturn:'Return to Dashboard',
    signup:   'Create Account',
    features: [
      { icon:'⚗', title:'Pathophysiology-Based Approach', desc:'Systematically link 8 molecular mechanisms (mTOR, PGC-1α, NMJ…) to clinical application.' },
      { icon:'→', title:'6-Step Clinical Workflow', desc:'Interview → Red flags → Hypothesis → Assessment → Re-assessment → SOAP chart — all in one screen.' },
      { icon:'◈', title:'Evidence-Based Exercise Prescription', desc:'Instant safe intensity prescription via 5 condition FITT-VP protocols with real-time HRR calculation.' },
      { icon:'◉', title:'Role-Based Expert System', desc:'Student education content and practitioner clinical tools automatically optimised by registered role.' },
    ],
    stats: [
      { val:'8',   label:'Pathophysiology Mechanisms' },
      { val:'5',   label:'FITT-VP Protocols'          },
      { val:'20',  label:'Clinical Pitfalls'           },
      { val:'3',   label:'Languages Supported'         },
    ],
    footer: '© 2025 Kinetic Clinical OS — An open platform for sports medicine clinicians',
    userGreet: (name: string) => `Registered as ${name}`,
    signOut: 'Change account',
  },
} as const;

interface Props {
  lang:         Language;
  onLangChange: (l: Language) => void;
  onEnter:      () => void;
  onSignup:     () => void;
}

export function LandingPage({ lang, onLangChange, onEnter, onSignup }: Props) {
  const t = T[lang];
  const { user, isRegistered, signOut } = useUserAuth();

  const handleCTA = () => {
    if (isRegistered) {
      onEnter();
    } else {
      onSignup();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── 상단 네비게이션 ── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
          <span className="text-lg font-black tracking-tight text-white">
            Kinetic <span className="text-sky-400">Clinical OS</span>
          </span>
          <div className="flex items-center gap-3">
            {/* 언어 전환 */}
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {(['ko','ja','en'] as Language[]).map(l => (
                <button key={l} onClick={() => onLangChange(l)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all ${lang===l?'bg-sky-600 text-white':'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {/* 등록 상태 표시 */}
            {isRegistered && user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-semibold">{t.userGreet(user.name)}</span>
                <button onClick={() => { signOut(); }}
                  className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button onClick={onSignup}
                className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-all">
                {t.signup}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero 섹션 ── */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <span className="mb-5 inline-block rounded-full border border-sky-800 bg-sky-950/50 px-4 py-1.5 text-xs font-bold tracking-widest text-sky-400 uppercase">
          {t.badge}
        </span>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-5">
          <span className="text-white">{t.title1} </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">{t.title2}</span>
        </h1>
        <p className="max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          {t.subtitle}
        </p>

        {/* 단일 CTA 버튼 */}
        <button onClick={handleCTA}
          className="rounded-2xl bg-sky-600 hover:bg-sky-500 px-10 py-4 text-base font-bold text-white transition-all shadow-2xl shadow-sky-900/50 hover:shadow-sky-700/40 hover:-translate-y-0.5 active:translate-y-0">
          {isRegistered ? t.ctaReturn : t.cta} →
        </button>
      </section>

      {/* ── 통계 ── */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-screen-xl px-6 py-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            {t.stats.map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-black text-sky-400">{s.val}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 핵심 기능 요약 (4개 카드, 중복 CTA 없음) ── */}
      <section className="mx-auto w-full max-w-screen-xl px-6 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.map((f, i) => (
            <div key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-sky-800 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950/60 border border-sky-800 text-lg">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-5 text-center">
        <p className="text-xs text-slate-600">{t.footer}</p>
      </footer>
    </div>
  );
}

export default LandingPage;
