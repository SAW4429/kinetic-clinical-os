import { useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { useDraft } from '../../lib/useDraft';
import type { Language } from '../../data/clinicalDB';

interface Inputs { bw: string; protein: string; source: string; timePost: string; sets: string; reps: string; }
const EMPTY: Inputs = { bw:'', protein:'', source:'whey', timePost:'', sets:'', reps:'' };
const DRAFT_KEY = 'kcos_draft_mps';

const LEUCINE_PCT: Record<string,number> = { whey:0.11, chicken:0.075, egg:0.085, soy:0.065, casein:0.09, plant:0.055 };

function calcMPS(inp: Inputs): { index: number; leucine: number; optDose: number; timeFactor: number; volFactor: number; verdict: Record<Language,string>; tips: Record<Language,string>[] } | null {
  const bw = parseFloat(inp.bw); const prot = parseFloat(inp.protein);
  const t = parseFloat(inp.timePost); const sets = parseFloat(inp.sets); const reps = parseFloat(inp.reps);
  if ([bw,prot,t,sets,reps].some(isNaN)) return null;

  const leuPct  = LEUCINE_PCT[inp.source] ?? 0.08;
  const leucine = prot * leuPct;
  const optDose = 0.4 * bw;
  const protFactor = Math.min(1.5, prot / optDose);
  const leuFactor  = Math.min(1.5, leucine / 2.5);
  const timeFactor = t<=1?1.3:t<=2?1.2:t<=4?1.0:t<=8?0.7:0.4;
  const volFactor  = Math.min(1.3, (sets * reps) / 80);
  const index      = Math.min(100, Math.round(protFactor * leuFactor * timeFactor * volFactor * 65));

  const verdict: Record<Language,string> =
    index>=75?{ko:'최적 MPS 자극',ja:'最適MPS刺激',en:'Optimal MPS stimulus'}:
    index>=45?{ko:'중등도 MPS 자극',ja:'中等度MPS刺激',en:'Moderate MPS stimulus'}:
              {ko:'불충분한 MPS 자극',ja:'不十分なMPS刺激',en:'Insufficient MPS stimulus'};

  const tips: Record<Language,string>[] = [];
  if (leucine<2.5) tips.push({ko:`류신 추가 필요: 현재 ${leucine.toFixed(1)}g → 목표 ≥2.5g`,ja:`ロイシン不足: 現在${leucine.toFixed(1)}g→目標≥2.5g`,en:`Leucine insufficient: ${leucine.toFixed(1)} g → target ≥2.5 g`});
  if (prot<optDose) tips.push({ko:`단백질 증량 권장: ${prot}g → 목표 ${optDose.toFixed(0)}g (0.4g/kg)`,ja:`タンパク質増量: ${prot}g→目標${optDose.toFixed(0)}g`,en:`Increase protein: ${prot} g → target ${optDose.toFixed(0)} g (0.4 g/kg)`});
  if (t>4) tips.push({ko:'운동 후 4시간 초과 → 섭취 타이밍 앞당기기 권장',ja:'運動後4時間超→摂取タイミングを早めることを推奨',en:'Protein intake >4 h post-exercise; advance timing to within 2 h'});
  if (tips.length===0) tips.push({ko:'현재 전략이 최적화되어 있습니다.',ja:'現在の戦略は最適化されています。',en:'Current strategy is well-optimised.'});
  return { index, leucine, optDose, timeFactor, volFactor, verdict, tips };
}

const T = {
  ko:{title:'MPS 최적화 계산기',sub:'단백질 섭취 타이밍과 운동 볼륨에 따른 리보솜 활성 예측 시뮬레이션',bw:'체중 (kg)',prot:'단백질 섭취량 (g)',src:'단백질 원',time:'운동 후 경과 시간 (h)',sets:'세트 수',reps:'반복 수',calc:'MPS 지수 계산',idx:'MPS 지수',leu:'류신 함량',opt:'최적 단백질량',tf:'타이밍 계수',vf:'볼륨 계수',tips:'최적화 제안'},
  ja:{title:'MPS最適化計算機',sub:'タンパク質摂取タイミングと運動ボリュームによるリボソーム活性予測',bw:'体重(kg)',prot:'タンパク質摂取量(g)',src:'タンパク質源',time:'運動後経過時間(h)',sets:'セット数',reps:'反復数',calc:'MPS指数計算',idx:'MPS指数',leu:'ロイシン含量',opt:'最適量',tf:'タイミング係数',vf:'ボリューム係数',tips:'最適化提案'},
  en:{title:'MPS Optimisation Calculator',sub:'Ribosomal activation prediction based on protein timing and exercise volume',bw:'Body weight (kg)',prot:'Protein intake (g)',src:'Protein source',time:'Time post-exercise (h)',sets:'Sets performed',reps:'Reps per set',calc:'Calculate MPS Index',idx:'MPS Index',leu:'Leucine content',opt:'Optimal dose',tf:'Timing factor',vf:'Volume factor',tips:'Optimisation tips'},
} as const;

const SOURCES: Record<Language, {v:string;l:string}[]> = {
  ko:[{v:'whey',l:'유청(Whey)'},{v:'chicken',l:'닭가슴살'},{v:'egg',l:'달걀'},{v:'casein',l:'카제인'},{v:'soy',l:'대두'},{v:'plant',l:'식물성 복합'}],
  ja:[{v:'whey',l:'ホエイ'},{v:'chicken',l:'鶏胸肉'},{v:'egg',l:'卵'},{v:'casein',l:'カゼイン'},{v:'soy',l:'大豆'},{v:'plant',l:'植物性複合'}],
  en:[{v:'whey',l:'Whey'},{v:'chicken',l:'Chicken breast'},{v:'egg',l:'Egg'},{v:'casein',l:'Casein'},{v:'soy',l:'Soy'},{v:'plant',l:'Mixed plant'}],
};

// ── 환자 프로필로 전송 ────────────────────────────────────────

function MigrateToPatient({ lang, result, inputs }: { lang:Language; result:ReturnType<typeof calcMPS>; inputs:Inputs }) {
  const { myPatients, assignBiomarker } = usePatient();
  const [selectedId, setSelectedId] = useState('');
  const [sent, setSent] = useState(false);

  const L = {
    ko:{title:'결과 → 환자 프로필 전송',sub:'MPS 분석 결과를 환자 바이오마커 기록으로 저장합니다.',select:'환자 선택',send:'환자 프로필로 저장',sent:'저장 완료!',none:'등록된 환자 없음'},
    ja:{title:'結果→患者プロフィール送信',sub:'MPS分析結果を患者バイオマーカー記録として保存。',select:'患者選択',send:'患者プロフィールへ保存',sent:'保存完了!',none:'患者なし'},
    en:{title:'Save to Patient Profile',sub:'Store MPS analysis as a biomarker record.',select:'Select Patient',send:'Save to Patient',sent:'Saved!',none:'No patients registered'},
  }[lang];

  const migrate = () => {
    if (!selectedId || !result) return;
    assignBiomarker(selectedId, {
      date:    new Date().toISOString().slice(0,10),
      subtype: 'mps',
      label:   `MPS 최적화 분석 (지수: ${result.index}/100)`,
      score:   Math.round(result.index / 10),
      data: {
        체중kg:       inputs.bw,
        단백질g:      inputs.protein,
        단백질원:     inputs.source,
        운동후시간h:  inputs.timePost,
        세트수:       inputs.sets,
        반복수:       inputs.reps,
        류신g:        result.leucine.toFixed(1),
        판정:         result.verdict[lang],
      },
    });
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  if (!result) return null;

  return (
    <div className="rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-5 mt-4">
      <p className="text-sm font-bold text-violet-700 dark:text-violet-400 mb-1 flex items-center gap-2"><Send size={14}/>{L.title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{L.sub}</p>
      {myPatients.length === 0 ? (
        <p className="text-xs text-slate-400">{L.none}</p>
      ) : (
        <div className="flex gap-2">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-400 focus:outline-none">
            <option value="">{L.select}</option>
            {myPatients.map(p=><option key={p.id} value={p.id}>{p.name} ({p.condition})</option>)}
          </select>
          <button onClick={migrate} disabled={!selectedId||sent}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-sm font-bold text-white transition-all">
            <Send size={14}/>{sent?L.sent:L.send}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export function MPSCalculator({ lang='ko' }: { lang?: Language }) {
  // useDraft: 복원 + 400ms 디바운스 + beforeunload 즉시저장
  const [inp, setInp] = useDraft<Inputs>(DRAFT_KEY, EMPTY);
  const [calc, setCalc] = useState(false);
  const t = T[lang];
  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    setInp(p=>({...p,[k]:e.target.value}));
    setCalc(false);
  };

  const res = useMemo(() => calc ? calcMPS(inp) : null, [inp, calc]);
  const color = res ? res.index>=75?'emerald':res.index>=45?'amber':'rose' : 'sky';

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="content-wrap">
        <h2 className="text-base font-bold text-slate-100 mb-0.5">{t.title}</h2>
        <p className="text-xs text-slate-500 mb-3">{t.sub}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 입력 */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3">
            {[{k:'bw',lb:t.bw,ph:'e.g. 70'},{k:'prot',lb:t.prot,ph:'e.g. 30'},{k:'time',lb:t.time,ph:'e.g. 1.5'},{k:'sets',lb:t.sets,ph:'e.g. 4'},{k:'reps',lb:t.reps,ph:'e.g. 10'}].map(f=>(
              <div key={f.k} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">{f.lb}</label>
                <input type="number" value={(inp as any)[f.k]} onChange={set(f.k as keyof Inputs)} placeholder={f.ph} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"/>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">{t.src}</label>
              <select value={inp.source} onChange={set('source')} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
                {SOURCES[lang].map(s=><option key={s.v} value={s.v}>{s.l} ({(LEUCINE_PCT[s.v]*100).toFixed(1)}% Leu)</option>)}
              </select>
            </div>
            <button onClick={()=>setCalc(true)} className="mt-1 rounded-lg bg-violet-600 py-2 text-sm font-bold text-white hover:bg-violet-500">{t.calc}</button>
          </div>

          {/* 결과 */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-4">
            {res ? (
              <>
                <div className="text-center">
                  <div className={`text-5xl font-black text-${color}-400`}>{res.index}</div>
                  <div className="text-xs text-slate-500 mb-1">{t.idx} / 100</div>
                  <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 bg-${color}-500`} style={{width:`${res.index}%`}}/>
                  </div>
                  <div className={`mt-1.5 text-sm font-bold text-${color}-400`}>{res.verdict[lang]}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {lb:t.leu, val:`${res.leucine.toFixed(1)} g`, ok: res.leucine>=2.5},
                    {lb:t.opt, val:`${res.optDose.toFixed(0)} g (0.4 g/kg)`, ok: true},
                    {lb:t.tf,  val:`×${res.timeFactor.toFixed(1)}`, ok: res.timeFactor>=1.0},
                    {lb:t.vf,  val:`×${res.volFactor.toFixed(2)}`, ok: res.volFactor>=0.8},
                  ].map((r,i)=>(
                    <div key={i} className="rounded-lg border border-slate-700 bg-slate-800 p-2 flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-500">{r.lb}</span>
                      <span className={`text-xs font-bold ${r.ok?'text-emerald-400':'text-amber-400'}`}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1.5">{t.tips}</p>
                  {res.tips.map((tip,i)=>(
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300 mb-1"><span className="text-violet-400 mt-0.5">›</span><span>{tip[lang]}</span></div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
                <span className="text-3xl">⬢</span>
                <p className="text-xs">{lang==='ko'?'데이터를 입력하고 계산하세요':lang==='ja'?'データを入力して計算してください':'Enter data and calculate'}</p>
              </div>
            )}
          </div>
        </div>

        {/* 환자 프로필 전송 */}
        {res && <MigrateToPatient lang={lang} result={res} inputs={inp}/>}
      </div>
    </div>
  );
}
export default MPSCalculator;
