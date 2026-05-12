import { useState } from 'react';
import { RED_FLAGS, PATHOPHYSIOLOGY_FACTORS, type RedFlag, type PathFactor, type PathCategory } from '../../data/clinicalDBExtended';
import { useExpertAuth } from '../../context/ExpertAuthContext';
import type { Language } from '../../data/clinicalDB';

// ── 단계 정의 ────────────────────────────────────────────────

type StepId = 'interview'|'redflag'|'hypothesis'|'measure'|'remeasure'|'chart';
interface Step { id:StepId; icon:string; label:Record<Language,string>; desc:Record<Language,string>; }

const STEPS: Step[] = [
  { id:'interview',  icon:'💬', label:{ko:'문진',ja:'問診',en:'Interview'},       desc:{ko:'주호소, 손상 기전, 병력 청취',ja:'主訴・受傷機転・病歴聴取',en:'Chief complaint, injury mechanism, history'} },
  { id:'redflag',    icon:'🚨', label:{ko:'위험 신호 확인',ja:'レッドフラグ確認',en:'Red Flag Check'}, desc:{ko:'즉각 의뢰 필요 여부 선별',ja:'即時紹介要否の選別',en:'Screen for immediate referral indicators'} },
  { id:'hypothesis', icon:'💡', label:{ko:'가설 세우기',ja:'仮説設定',en:'Hypothesis'},       desc:{ko:'조직·부하·움직임·전신 요인 분류',ja:'組織・負荷・動作・全身因子分類',en:'Classify tissue / load / movement / systemic factors'} },
  { id:'measure',    icon:'📏', label:{ko:'측정',ja:'測定',en:'Measure'},             desc:{ko:'ROM, MMT, 특수 검사 수행',ja:'ROM・MMT・特殊テスト実施',en:'ROM, MMT, special tests'} },
  { id:'remeasure',  icon:'🔄', label:{ko:'재측정',ja:'再測定',en:'Re-assess'},          desc:{ko:'중재 후 변화 확인',ja:'介入後の変化確認',en:'Confirm changes after intervention'} },
  { id:'chart',      icon:'📝', label:{ko:'차팅',ja:'チャート記録',en:'Chart'},             desc:{ko:'SOAP 형식으로 임상 기록',ja:'SOAP形式で臨床記録',en:'Document in SOAP format'} },
];

const PATH_LABELS: Record<PathCategory,Record<Language,string>> = {
  tissue:   {ko:'조직 요인',ja:'組織因子',en:'Tissue Factors'},
  load:     {ko:'부하 요인',ja:'負荷因子',en:'Load Factors'},
  movement: {ko:'움직임 요인',ja:'動作因子',en:'Movement Factors'},
  systemic: {ko:'전신 요인',ja:'全身因子',en:'Systemic Factors'},
};
const PATH_COLOR: Record<PathCategory,string> = {
  tissue:   'bg-rose-50   border-rose-200   text-rose-700   dark:bg-rose-950/40   dark:border-rose-800   dark:text-rose-300',
  load:     'bg-amber-50  border-amber-200  text-amber-700  dark:bg-amber-950/40  dark:border-amber-800  dark:text-amber-300',
  movement: 'bg-sky-50    border-sky-200    text-sky-700    dark:bg-sky-950/40    dark:border-sky-800    dark:text-sky-300',
  systemic: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-300',
};
const URGENCY_COLOR: Record<string,string> = {
  immediate: 'bg-red-600 text-white',
  '24h':     'bg-amber-500 text-white',
  monitor:   'bg-sky-500 text-white',
};

// ── 문진 단계 ────────────────────────────────────────────────

function InterviewStep({ lang }:{ lang:Language }) {
  const [form, setForm] = useState({ chiefComplaint:'', mechanism:'', onset:'', duration:'', aggravating:'', easing:'' });
  const set = (k:keyof typeof form) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(p=>({...p,[k]:e.target.value}));
  const F: {k:keyof typeof form; label:Record<Language,string>; rows?:number}[] = [
    {k:'chiefComplaint', label:{ko:'주호소',ja:'主訴',en:'Chief Complaint'}, rows:2},
    {k:'mechanism',      label:{ko:'손상 기전',ja:'受傷機転',en:'Injury Mechanism'}, rows:2},
    {k:'onset',          label:{ko:'발생 시점',ja:'発症時点',en:'Onset'}},
    {k:'duration',       label:{ko:'증상 지속 기간',ja:'症状持続期間',en:'Duration'}},
    {k:'aggravating',    label:{ko:'악화 인자',ja:'増悪因子',en:'Aggravating Factors'}, rows:2},
    {k:'easing',         label:{ko:'완화 인자',ja:'緩和因子',en:'Easing Factors'}, rows:2},
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {F.map(f=>(
        <div key={f.k} className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{f.label[lang]}</label>
          {f.rows ? (
            <textarea rows={f.rows} value={form[f.k]} onChange={set(f.k)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none resize-none" placeholder="—"/>
          ) : (
            <input type="text" value={form[f.k]} onChange={set(f.k)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none" placeholder="—"/>
          )}
        </div>
      ))}
    </div>
  );
}

// ── 위험 신호 확인 단계 ────────────────────────────────────

function RedFlagStep({ lang }:{ lang:Language }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id:string) => setChecked(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const flagged = RED_FLAGS.filter(f=>checked.has(f.id));
  const hasImmediate = flagged.some(f=>f.urgency==='immediate');

  return (
    <div className="flex flex-col gap-4">
      {hasImmediate&&(
        <div className="rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/50 p-4 flex items-start gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-bold text-red-700 dark:text-red-400 text-base">{lang==='ko'?'즉각 의뢰 필요':lang==='ja'?'即時紹介必要':'Immediate Referral Required'}</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{lang==='ko'?'선택된 위험 신호가 즉각적인 의사 의뢰를 요구합니다. 재활 중단.':lang==='ja'?'選択されたレッドフラグは即時医師紹介を要求。リハビリ中断。':'Selected red flags require immediate physician referral. Suspend rehabilitation.'}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RED_FLAGS.map(flag=>{
          const isChecked = checked.has(flag.id);
          return (
            <label key={flag.id} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${isChecked?'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40':'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              <input type="checkbox" checked={isChecked} onChange={()=>toggle(flag.id)} className="mt-0.5 h-4 w-4 accent-red-500"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{flag.label[lang]}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${URGENCY_COLOR[flag.urgency]}`}>{flag.urgency}</span>
                </div>
                {isChecked&&<p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{flag.rationale[lang]}</p>}
                {isChecked&&<p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">→ {flag.action[lang]}</p>}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── 가설 단계 ──────────────────────────────────────────────

function HypothesisStep({ lang, isExpert }:{ lang:Language; isExpert:boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id:string) => setSelected(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const categories: PathCategory[] = ['tissue','load','movement','systemic'];

  return (
    <div className="flex flex-col gap-5">
      {categories.map(cat=>{
        const factors = PATHOPHYSIOLOGY_FACTORS.filter(f=>f.category===cat);
        return (
          <div key={cat}>
            <p className={`inline-block rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3 ${PATH_COLOR[cat]}`}>{PATH_LABELS[cat][lang]}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {factors.map(f=>{
                const isSel = selected.has(f.id);
                return (
                  <div key={f.id} className={`rounded-xl border p-4 cursor-pointer transition-all ${isSel?'border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-950/40':'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`} onClick={()=>toggle(f.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{f.title[lang]}</p>
                      <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${isSel?'border-sky-500 bg-sky-500':'border-slate-300 dark:border-slate-600'}`}>
                        {isSel&&<svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.description[lang]}</p>
                    {isSel&&(
                      <div className="mt-3 flex flex-col gap-2">
                        {isExpert&&(
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-1">{lang==='ko'?'임상 검사':lang==='ja'?'臨床検査':'Clinical Tests'}</p>
                            {f.clinicalTests.map((t,i)=><p key={i} className="text-xs text-slate-600 dark:text-slate-400">• {t[lang]}</p>)}
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{lang==='ko'?'중재':lang==='ja'?'介入':'Interventions'}</p>
                          {f.interventions.map((v,i)=><p key={i} className="text-xs text-slate-600 dark:text-slate-400">• {v[lang]}</p>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 측정 단계 ──────────────────────────────────────────────

function MeasureStep({ lang, isReMeasure }:{ lang:Language; isReMeasure?:boolean }) {
  const [data, setData] = useState({ vasRest:'', vasActive:'', gripL:'', gripR:'', specialTest:'', notes:'' });
  const set = (k:keyof typeof data) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setData(p=>({...p,[k]:e.target.value}));
  const prefix = isReMeasure ? {ko:'재측정',ja:'再測定',en:'Re-Assessment'} : {ko:'측정',ja:'測定',en:'Assessment'};
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{prefix[lang]}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {k:'vasRest',   lb:{ko:'VAS 안정 시',ja:'VAS安静時',en:'VAS Rest'},    ph:'0-10'},
          {k:'vasActive', lb:{ko:'VAS 활동 시',ja:'VAS活動時',en:'VAS Active'},  ph:'0-10'},
          {k:'gripL',     lb:{ko:'악력 좌 (kg)',ja:'握力左(kg)',en:'Grip L (kg)'},ph:'e.g.35'},
          {k:'gripR',     lb:{ko:'악력 우 (kg)',ja:'握力右(kg)',en:'Grip R (kg)'},ph:'e.g.38'},
        ].map(f=>(
          <div key={f.k} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{(f.lb as any)[lang]}</label>
            <input type="number" value={(data as any)[f.k]} onChange={set(f.k as keyof typeof data)} placeholder={f.ph} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none"/>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?'특수 검사 결과':lang==='ja'?'特殊テスト結果':'Special Test Results'}</label>
        <input type="text" value={data.specialTest} onChange={set('specialTest')} placeholder={lang==='ko'?'예: Lachman (+), Valgus stress (-)':lang==='ja'?'例: Lachman (+), Valgus stress (-)':'e.g. Lachman (+), Valgus stress (-)'} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none"/>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?'추가 메모':lang==='ja'?'追加メモ':'Additional Notes'}</label>
        <textarea rows={3} value={data.notes} onChange={set('notes')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none resize-none"/>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────

export function ClinicalFlow({ lang='ko' }:{ lang?:Language }) {
  const [activeStep, setActiveStep] = useState<StepId>('interview');
  const { isAuthorized } = useExpertAuth();
  const isExpert = isAuthorized('clinician');
  const curIdx = STEPS.findIndex(s=>s.id===activeStep);

  return (
    <div className="p-4 md:p-6">
      <div className="content-wrap">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {lang==='ko'?'임상 프로세스 플로우':lang==='ja'?'臨床プロセスフロー':'Clinical Process Flow'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang==='ko'?'문진부터 차팅까지 단계별 임상 워크플로우를 안내합니다.':lang==='ja'?'問診からチャート記録まで段階的な臨床ワークフローをガイドします。':'Step-by-step clinical workflow from initial interview through to charting.'}
          </p>
        </div>

        {/* 스텝 타임라인 */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step,i)=>{
            const isActive = step.id===activeStep;
            const isDone   = i<curIdx;
            return (
              <div key={step.id} className="flex items-center">
                <button onClick={()=>setActiveStep(step.id)} className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[80px] ${isActive?'bg-sky-50 dark:bg-sky-950/40':'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg transition-all ${isActive?'border-sky-500 bg-sky-100 dark:bg-sky-900':isDone?'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/40':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    {isDone?'✓':step.icon}
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight ${isActive?'text-sky-600 dark:text-sky-400':isDone?'text-emerald-600 dark:text-emerald-400':'text-slate-500'}`}>{step.label[lang]}</span>
                </button>
                {i<STEPS.length-1&&<div className={`w-6 h-0.5 shrink-0 ${isDone?'bg-emerald-400':'bg-slate-200 dark:bg-slate-700'}`}/>}
              </div>
            );
          })}
        </div>

        {/* 현재 스텝 설명 */}
        <div className="mb-5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{STEPS[curIdx].icon}</span>
            <div>
              <p className="font-bold text-sky-700 dark:text-sky-300 text-base">{STEPS[curIdx].label[lang]}</p>
              <p className="text-sm text-sky-600 dark:text-sky-400">{STEPS[curIdx].desc[lang]}</p>
            </div>
          </div>
        </div>

        {/* 단계별 콘텐츠 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          {activeStep==='interview'  && <InterviewStep lang={lang}/>}
          {activeStep==='redflag'    && <RedFlagStep lang={lang}/>}
          {activeStep==='hypothesis' && <HypothesisStep lang={lang} isExpert={isExpert}/>}
          {activeStep==='measure'    && <MeasureStep lang={lang}/>}
          {activeStep==='remeasure'  && <MeasureStep lang={lang} isReMeasure/>}
          {activeStep==='chart'      && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="text-3xl">📝</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{lang==='ko'?'SOAP 차팅으로 이동':lang==='ja'?'SOAPチャートへ移動':'Proceed to SOAP Charting'}</p>
              <p className="text-sm text-slate-500">{lang==='ko'?'상단 탭에서 "SOAP 차팅"을 선택하세요.':lang==='ja'?'上のタブから「SOAPチャート」を選択してください。':'Select "SOAP Chart" from the tab navigation above.'}</p>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={()=>setActiveStep(STEPS[Math.max(0,curIdx-1)].id)} disabled={curIdx===0} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all">
            ← {lang==='ko'?'이전':lang==='ja'?'前へ':'Back'}
          </button>
          <span className="text-xs text-slate-400">{curIdx+1} / {STEPS.length}</span>
          <button onClick={()=>setActiveStep(STEPS[Math.min(STEPS.length-1,curIdx+1)].id)} disabled={curIdx===STEPS.length-1} className="px-5 py-2.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 text-sm font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 disabled:opacity-40 transition-all">
            {lang==='ko'?'다음':lang==='ja'?'次へ':'Next'} →
          </button>
        </div>
      </div>
    </div>
  );
}
export default ClinicalFlow;
