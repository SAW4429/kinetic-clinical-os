import { useState, useMemo } from 'react';
import { FITT_VP_PROTOCOLS, type FITTVPParameter, type Contraindication, type RiskLevel, type Language } from '../../data/clinicalDB';

const RISK_STYLE: Record<RiskLevel, { badge: string; row: string; dot: string }> = {
  absolute: { badge:'bg-red-600 text-white',                                    row:'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50',     dot:'bg-red-500' },
  high:     { badge:'border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300', row:'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30', dot:'bg-red-400' },
  moderate: { badge:'border border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300', row:'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30', dot:'bg-amber-400' },
  low:      { badge:'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400', row:'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50', dot:'bg-slate-400' },
};
const RISK_LABEL: Record<RiskLevel, Record<Language,string>> = {
  absolute:{ko:'절대 금기',ja:'絶対禁忌',en:'Absolute CI'},
  high:{ko:'고위험',ja:'高リスク',en:'High Risk'},
  moderate:{ko:'중위험',ja:'中リスク',en:'Moderate'},
  low:{ko:'저위험',ja:'低リスク',en:'Low Risk'},
};
const PARAM_META: { key:keyof FITTVPParameter; ko:string; ja:string; en:string; icon:string }[] = [
  { key:'frequency',   ko:'빈도 (F)',   ja:'頻度',   en:'Frequency',   icon:'◷' },
  { key:'intensity',   ko:'강도 (I)',   ja:'強度',   en:'Intensity',   icon:'◈' },
  { key:'time',        ko:'시간 (T)',   ja:'時間',   en:'Time',        icon:'◔' },
  { key:'type',        ko:'유형 (T)',   ja:'種類',   en:'Type',        icon:'◉' },
  { key:'volume',      ko:'볼륨 (V)',   ja:'量',     en:'Volume',      icon:'⬡' },
  { key:'progression', ko:'진행 (P)',   ja:'進行',   en:'Progression', icon:'▲' },
];

// ── HRR 계산 ─────────────────────────────────────────────────

interface PatientCalc { age: number; restHR: number; vas: number; }

interface HRRResult {
  hmax: number; hrr: number;
  low40: number; high60: number;   // moderate
  low60: number; high75: number;   // vigorous
  vasLabel: string; pctLow: number; pctHigh: number;
  recFreq: Record<Language,string>;
}

function calcHRR(p: PatientCalc, lang: Language): HRRResult {
  const hmax = Math.round(208 - 0.7 * p.age);
  const hrr  = hmax - p.restHR;
  const tr = (pct: number) => Math.round(p.restHR + hrr * pct);

  let pctLow = 0.40, pctHigh = 0.60, vasLabel = '';
  if (p.vas >= 7) { pctLow = 0; pctHigh = 0; vasLabel = lang==='ko'?'운동 금기 (VAS≥7)':lang==='ja'?'運動禁忌':'Contraindicated'; }
  else if (p.vas >= 4) { pctLow = 0.30; pctHigh = 0.45; vasLabel = lang==='ko'?'강도 감량 (VAS 4-6)':lang==='ja'?'強度減量':'Reduced (VAS 4-6)'; }

  const recFreq: Record<Language,string> = p.vas >= 7
    ? {ko:'운동 금기',ja:'運動禁忌',en:'Contraindicated'}
    : p.vas >= 4
    ? {ko:'주 2~3회',ja:'週2〜3回',en:'2–3×/wk'}
    : {ko:'주 3~5회',ja:'週3〜5回',en:'3–5×/wk'};

  return { hmax, hrr, low40:tr(0.40), high60:tr(0.60), low60:tr(0.60), high75:tr(0.75), vasLabel, pctLow, pctHigh, recFreq };
}

// ── 실시간 강도 배지 ─────────────────────────────────────────

function HRBadge({ result, lang }: { result: HRRResult; lang: Language }) {
  if (result.pctLow === 0) return (
    <span className="rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-700 px-2 py-1 text-xs font-bold text-red-700 dark:text-red-400">{result.vasLabel}</span>
  );
  return (
    <span className="rounded-lg bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 px-2 py-1 text-xs font-semibold text-sky-800 dark:text-sky-300">
      {lang==='ko'?'중강도':lang==='ja'?'中強度':'Moderate'}: {result.low40}–{result.high60} bpm
      {result.vasLabel && <span className="ml-1.5 text-amber-600 dark:text-amber-400">({result.vasLabel})</span>}
    </span>
  );
}

// ── 인터랙티브 입력 패널 ─────────────────────────────────────

interface PatientInputState { age:string; restHR:string; vo2max:string; vas:string; }
const EMPTY_INP: PatientInputState = { age:'', restHR:'', vo2max:'', vas:'' };

// ── 금기증 행 ────────────────────────────────────────────────

function CIRow({ ci, lang }:{ ci:Contraindication; lang:Language }) {
  const s = RISK_STYLE[ci.level];
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border p-3 ${s.row}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`}/>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${s.badge}`}>{RISK_LABEL[ci.level][lang]}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ci.label[lang]}</span>
      </div>
      <p className="ml-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{ci.mechanism[lang]}</p>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export function FITTVPBuilder({ lang = 'ko' }: { lang?: Language }) {
  const [sel, setSel] = useState<string | null>(null);
  const [inp, setInp] = useState<PatientInputState>(EMPTY_INP);
  const setF = (k: keyof PatientInputState) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: e.target.value }));

  const protocol = FITT_VP_PROTOCOLS.find(p => p.condition === sel) ?? null;

  const calc = useMemo<HRRResult | null>(() => {
    const age = parseFloat(inp.age); const restHR = parseFloat(inp.restHR); const vas = parseFloat(inp.vas) || 0;
    if (!age || !restHR || isNaN(age) || isNaN(restHR)) return null;
    return calcHRR({ age, restHR, vas }, lang);
  }, [inp, lang]);

  const L = { ko:'ko', ja:'ja', en:'en' }[lang] as Language;

  return (
    <div className="p-4 md:p-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="content-wrap flex flex-col gap-6">

        {/* ── 헤더 ── */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {lang==='ko'?'FITT-VP 운동 처방 빌더':lang==='ja'?'FITT-VP 運動処方ビルダー':'FITT-VP Prescription Builder'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {lang==='ko'?'환자 수치 입력 → 실시간 HRR 계산 → 질환별 처방 카드 생성':lang==='ja'?'患者数値入力→リアルタイムHRR計算→疾患別処方カード生成':'Enter patient data → real-time HRR calculation → condition-specific prescription card'}
          </p>
        </div>

        {/* ── 환자 데이터 입력 (항상 최상단) ── */}
        <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400 mb-4">
            {lang==='ko'?'환자 수치 입력 (실시간 계산)':lang==='ja'?'患者数値入力（リアルタイム計算）':'Patient Data Input (Real-time)'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k:'age',    lb:{ko:'나이 (세)',ja:'年齢(歳)',en:'Age (yrs)'}, ph:'e.g. 55' },
              { k:'restHR', lb:{ko:'안정 시 HR (bpm)',ja:'安静HR',en:'Rest HR (bpm)'}, ph:'e.g. 72' },
              { k:'vo2max', lb:{ko:'VO₂max (선택)',ja:'VO₂max(任意)',en:'VO₂max (opt.)'}, ph:'ml/kg/min' },
              { k:'vas',    lb:{ko:'VAS 통증 (0-10)',ja:'VAS疼痛',en:'VAS Pain 0-10'}, ph:'0-10' },
            ].map(f => (
              <div key={f.k} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{(f.lb as any)[lang]}</label>
                <input type="number" value={(inp as any)[f.k]} onChange={setF(f.k as keyof PatientInputState)} placeholder={f.ph}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none"/>
              </div>
            ))}
          </div>

          {/* 실시간 계산 결과 */}
          {calc && (
            <div className={`mt-4 rounded-xl border p-4 ${calc.pctLow === 0 ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40' : 'border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-800'}`}>
              {calc.pctLow === 0 ? (
                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                  {lang==='ko'?'⚠ VAS≥7: 운동 금기 — 통증 조절 우선':lang==='ja'?'⚠ VAS≥7: 運動禁忌':'⚠ VAS≥7: Exercise contraindicated — manage pain first'}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { lb:{ko:'예측 HRmax',ja:'予測HRmax',en:'Est. HRmax'},         val:`${calc.hmax} bpm`, good:true },
                    { lb:{ko:'심박수 여유 (HRR)',ja:'HRR',en:'HR Reserve'},        val:`${calc.hrr} bpm`, good:true },
                    { lb:{ko:'중강도 목표 HR',ja:'中強度目標HR',en:'Moderate Target HR'}, val:`${calc.low40}–${calc.high60} bpm`, good:true },
                    { lb:{ko:'권장 빈도',ja:'推奨頻度',en:'Rec. Frequency'},        val:calc.recFreq[lang], good:true },
                  ].map((row,i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{(row.lb as any)[lang]}</span>
                      <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{row.val}</span>
                    </div>
                  ))}
                </div>
              )}
              {calc.vasLabel && calc.pctLow > 0 && (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">⚠ {calc.vasLabel}</p>
              )}
            </div>
          )}
        </div>

        {/* ── 질환 선택 ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <select value={sel??''} onChange={e=>setSel(e.target.value||null)}
              className="flex-1 min-w-[200px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none">
              <option value="">{lang==='ko'?'— 질환 선택 —':lang==='ja'?'— 疾患選択 —':'— Select condition —'}</option>
              {FITT_VP_PROTOCOLS.map(p=><option key={p.condition} value={p.condition}>{p.conditionLabel[lang]}</option>)}
            </select>
            {sel&&<button onClick={()=>setSel(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">{lang==='ko'?'초기화':'Reset'}</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {FITT_VP_PROTOCOLS.map(p=>(
              <button key={p.condition} onClick={()=>setSel(v=>v===p.condition?null:p.condition)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${sel===p.condition?'border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                {p.contraindications.some(c=>c.level==='absolute')&&<span className="mr-1 text-red-500">⚠</span>}
                {p.conditionLabel[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* ── 처방 카드 ── */}
        {protocol && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            {/* 질환 헤더 */}
            <div className={`flex items-center justify-between p-5 ${protocol.contraindications.some(c=>c.level==='absolute')?'bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800':'bg-sky-50 dark:bg-sky-950/30 border-b border-sky-200 dark:border-sky-800'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{lang==='ko'?'처방 대상':lang==='ja'?'処方対象':'Target Condition'}</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{protocol.conditionLabel[lang]}</h3>
              </div>
              {protocol.contraindications.some(c=>c.level==='absolute')&&(
                <span className="animate-pulse rounded-xl bg-red-600 px-3 py-1.5 text-sm font-bold text-white">{lang==='ko'?'절대 금기 포함':lang==='ja'?'絶対禁忌含む':'Has Absolute CI'}</span>
              )}
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* FITT-VP 파라미터 그리드 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PARAM_META.map(pm => {
                  const isIntensity = pm.key === 'intensity';
                  return (
                    <div key={pm.key} className="flex flex-col gap-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sky-600 dark:text-sky-400">{pm.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{(pm as any)[lang]}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{protocol.parameters[pm.key][lang]}</p>
                      {/* 실시간 HRR 숫자 표시 (강도 파라미터만) */}
                      {isIntensity && calc && calc.pctLow > 0 && (
                        <HRBadge result={calc} lang={lang}/>
                      )}
                      {isIntensity && calc && calc.pctLow === 0 && (
                        <span className="rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-700 px-2 py-1 text-xs font-bold text-red-700 dark:text-red-400">
                          {lang==='ko'?'현재 운동 금기':lang==='ja'?'現在運動禁忌':'Currently Contraindicated'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 금기증 */}
              {protocol.contraindications.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-3">⚠ {lang==='ko'?'금기증':lang==='ja'?'禁忌':'Contraindications'}</p>
                  <div className="flex flex-col gap-2">
                    {[...protocol.contraindications].sort((a,b)=>(['absolute','high','moderate','low'].indexOf(a.level)-['absolute','high','moderate','low'].indexOf(b.level))).map(ci=><CIRow key={ci.id} ci={ci} lang={lang}/>)}
                  </div>
                </div>
              )}

              {/* 임상 노트 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{lang==='ko'?'임상 주의사항':lang==='ja'?'臨床注意':'Clinical Note'}</p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{protocol.clinicalNote[lang]}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default FITTVPBuilder;
