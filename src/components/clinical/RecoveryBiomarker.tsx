import { useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import type { Language } from '../../data/clinicalDB';

interface Inputs { cpk: string; urea: string; sleep: string; sleepQ: string; hrv: string; soreness: string; }
const EMPTY: Inputs = { cpk:'', urea:'', sleep:'', sleepQ:'3', hrv:'', soreness:'' };

function score(inp: Inputs): { total: number; items: { label: Record<Language,string>; pts: number; note: Record<Language,string> }[] } | null {
  const cpk = parseFloat(inp.cpk); const urea = parseFloat(inp.urea);
  const sleep = parseFloat(inp.sleep); const sleepQ = parseFloat(inp.sleepQ);
  const hrv = parseFloat(inp.hrv); const sor = parseFloat(inp.soreness);
  if ([cpk,urea,sleep,hrv,sor].some(isNaN)) return null;

  const items = [
    { label:{ko:'CPK',ja:'CPK',en:'CPK'},
      pts: cpk>1000?-4:cpk>500?-2:cpk>200?-1:0,
      note:{ko:cpk>1000?'심한 근손상':cpk>500?'중등도 손상':cpk>200?'경미한 손상':'정상',ja:cpk>1000?'重篤な筋損傷':cpk>500?'中等度':cpk>200?'軽微':'正常',en:cpk>1000?'Severe EIMD':cpk>500?'Moderate':cpk>200?'Mild':'Normal'} },
    { label:{ko:'혈중 요소(Urea)',ja:'血中尿素',en:'Serum Urea'},
      pts: urea>10?-2:urea>7?-1:0,
      note:{ko:urea>10?'과도한 단백질 이화':urea>7?'경미한 상승':'정상',ja:urea>10?'過剰タンパク異化':urea>7?'軽微上昇':'正常',en:urea>10?'Excess protein catabolism':urea>7?'Mildly elevated':'Normal'} },
    { label:{ko:'수면 시간',ja:'睡眠時間',en:'Sleep Duration'},
      pts: sleep<5?-3:sleep<6?-1:sleep<=9?2:1,
      note:{ko:sleep<5?'심각한 수면 부족':sleep<6?'수면 부족':sleep<=9?'최적':'과수면',ja:sleep<5?'重篤な睡眠不足':sleep<6?'不足':sleep<=9?'最適':'過眠',en:sleep<5?'Severe deficit':sleep<6?'Insufficient':sleep<=9?'Optimal':'Excessive'} },
    { label:{ko:'수면 질 (1-5)',ja:'睡眠質(1-5)',en:'Sleep Quality (1-5)'},
      pts: sleepQ<=2?-2:sleepQ>=4?1:0,
      note:{ko:sleepQ<=2?'불량':sleepQ>=4?'양호':'보통',ja:sleepQ<=2?'不良':sleepQ>=4?'良好':'普通',en:sleepQ<=2?'Poor':sleepQ>=4?'Good':'Moderate'} },
    { label:{ko:'HRV (ms)',ja:'HRV(ms)',en:'HRV (ms)'},
      pts: hrv<20?-3:hrv<50?-1:hrv<=100?1:2,
      note:{ko:hrv<20?'자율신경 심각 억제':hrv<50?'회복 불량':hrv<=100?'양호':'우수',ja:hrv<20?'自律神経重篤抑制':hrv<50?'回復不良':hrv<=100?'良好':'優秀',en:hrv<20?'Severe ANS suppression':hrv<50?'Poor recovery':hrv<=100?'Good':'Excellent'} },
    { label:{ko:'근육통 (VAS)',ja:'筋肉痛(VAS)',en:'Muscle Soreness (VAS)'},
      pts: sor>=8?-3:sor>=5?-1:sor>=3?0:1,
      note:{ko:sor>=8?'심각':sor>=5?'중등도':sor>=3?'경미':'무증상',ja:sor>=8?'重篤':sor>=5?'中等度':sor>=3?'軽微':'無症状',en:sor>=8?'Severe':sor>=5?'Moderate':sor>=3?'Mild':'None'} },
  ];
  const raw   = items.reduce((s,i)=>s+i.pts,0);
  const total = Math.max(0, Math.min(10, 5 + raw)); // base 5
  return { total, items };
}

function ScoreGauge({ score }: { score: number }) {
  const color = score>=7?'text-emerald-400':score>=4?'text-amber-400':'text-rose-400';
  const bg    = score>=7?'bg-emerald-500':score>=4?'bg-amber-500':'bg-rose-500';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl font-black ${color}`}>{score.toFixed(1)}</div>
      <div className="text-xs text-slate-500">/10</div>
      <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bg}`} style={{width:`${score*10}%`}}/>
      </div>
      <div className={`text-sm font-bold ${color}`}>
        {score>=7?'✓ Good Recovery':score>=4?'⚠ Partial Recovery':'✗ Insufficient Recovery'}
      </div>
    </div>
  );
}

const T = {
  ko:{title:'회복 바이오마커 분석기',sub:'생체 지표를 입력하여 현재 신체 회복도를 점수화합니다.',cpk:'CPK (U/L)',urea:'혈중 요소 (mmol/L)',sleep:'수면 시간 (h)',sleepQ:'수면 질 (1-5)',hrv:'HRV (ms)',sor:'근육통 VAS (0-10)',calc:'회복도 계산',result:'회복도 분석 결과',item:'지표',pts:'점수',status:'상태',note:'참고',refCPK:'정상 <200 U/L',refUrea:'정상 2.5-7 mmol/L',refSleep:'권장 7-9h',refHRV:'40-100ms 목표'},
  ja:{title:'回復バイオマーカー分析',sub:'生体指標を入力して現在の回復度をスコア化します。',cpk:'CPK (U/L)',urea:'血中尿素 (mmol/L)',sleep:'睡眠時間 (h)',sleepQ:'睡眠質 (1-5)',hrv:'HRV (ms)',sor:'筋肉痛VAS(0-10)',calc:'回復度計算',result:'回復度分析結果',item:'指標',pts:'スコア',status:'状態',note:'参考',refCPK:'正常 <200 U/L',refUrea:'正常 2.5-7 mmol/L',refSleep:'推奨 7-9h',refHRV:'目標 40-100ms'},
  en:{title:'Recovery Biomarker Analyser',sub:'Enter biomarker values to calculate current physiological recovery score.',cpk:'CPK (U/L)',urea:'Serum Urea (mmol/L)',sleep:'Sleep Duration (h)',sleepQ:'Sleep Quality (1–5)',hrv:'HRV (ms)',sor:'Muscle Soreness VAS (0–10)',calc:'Calculate Recovery Score',result:'Recovery Analysis',item:'Marker',pts:'Score',status:'Status',note:'Reference',refCPK:'Normal <200 U/L',refUrea:'Normal 2.5–7 mmol/L',refSleep:'Target 7–9 h',refHRV:'Target 40–100 ms'},
} as const;

export function RecoveryBiomarker({ lang='ko' }: { lang?: Language }) {
  const [inp, setInp] = useState<Inputs>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const t = T[lang];
  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setInp(p=>({...p,[k]:e.target.value}));
  const res = useMemo(() => submitted ? score(inp) : null, [inp, submitted]);

  const fields: {k:keyof Inputs; lb:string; ph:string; ref:string; type?:string; min?:number; max?:number}[] = [
    {k:'cpk',   lb:t.cpk,   ph:'e.g. 250', ref:t.refCPK},
    {k:'urea',  lb:t.urea,  ph:'e.g. 6.5', ref:t.refUrea},
    {k:'sleep', lb:t.sleep, ph:'e.g. 7',   ref:t.refSleep},
    {k:'hrv',   lb:t.hrv,   ph:'e.g. 65',  ref:t.refHRV},
    {k:'soreness',lb:t.sor, ph:'0-10',     ref:'VAS'},
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="content-wrap">
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-100">{t.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.sub}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 입력 */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3">
            {fields.map(f => (
              <div key={f.k} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-slate-300">{f.lb}</label>
                  <span className="text-[10px] text-slate-600">{f.ref}</span>
                </div>
                <input type="number" value={(inp as any)[f.k]} onChange={set(f.k)} placeholder={f.ph} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
              </div>
            ))}
            {/* 수면 질 슬라이더 */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-300">{t.sleepQ}</label>
                <span className="text-xs font-bold text-sky-400">{inp.sleepQ}</span>
              </div>
              <input type="range" min={1} max={5} step={1} value={inp.sleepQ} onChange={set('sleepQ')} className="w-full accent-sky-500" />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>{lang==='ko'?'매우 불량':lang==='ja'?'非常に悪い':'Very Poor'}</span>
                <span>{lang==='ko'?'우수':lang==='ja'?'優秀':'Excellent'}</span>
              </div>
            </div>
            <button onClick={() => setSubmitted(true)} className="mt-1 rounded-lg bg-sky-600 py-2 text-sm font-bold text-white hover:bg-sky-500 transition-colors">{t.calc}</button>
          </div>

          {/* 결과 */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            {res ? (
              <div className="flex flex-col gap-4">
                <ScoreGauge score={res.total} />
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.result}</p>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-700"><th className="text-left pb-1 text-slate-500">{t.item}</th><th className="text-right pb-1 text-slate-500">{t.pts}</th><th className="text-right pb-1 text-slate-500">{t.status}</th></tr></thead>
                    <tbody>
                      {res.items.map((item,i)=>(
                        <tr key={i} className="border-b border-slate-800">
                          <td className="py-1.5 text-slate-300">{item.label[lang]}</td>
                          <td className={`py-1.5 text-right font-bold ${item.pts>0?'text-emerald-400':item.pts<0?'text-rose-400':'text-slate-400'}`}>{item.pts>0?'+':''}{item.pts}</td>
                          <td className="py-1.5 text-right text-slate-400">{item.note[lang]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
                <span className="text-3xl">♡</span>
                <p className="text-xs">{lang==='ko'?'값을 입력하고 계산 버튼을 눌러주세요':lang==='ja'?'値を入力して計算ボタンを押してください':'Enter values and click Calculate'}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 결과 데이터 등록 (환자 프로필로 전송) ── */}
        {res && <MigrateToPatient lang={lang} score={res.total} inputs={inp}/>}
      </div>
    </div>
  );
}

// ── 결과 데이터 → 환자 프로필 전송 ──────────────────────────────
function MigrateToPatient({ lang, score, inputs }: { lang:Language; score:number; inputs:Inputs }) {
  const { myPatients, assignBiomarker } = usePatient();
  const [selectedId, setSelectedId] = useState('');
  const [sent, setSent] = useState(false);

  const L={ko:{title:'결과 데이터 등록',sub:'분석 결과를 환자 바이오마커 기록으로 저장합니다.',select:'환자 선택',send:'환자 프로필로 저장',sent:'저장 완료!',noPatients:'등록된 환자가 없습니다.'},ja:{title:'結果データ登録',sub:'分析結果を患者バイオマーカー記録として保存します。',select:'患者選択',send:'患者プロフィールへ保存',sent:'保存完了!',noPatients:'患者がいません。'},en:{title:'Save Result to Patient',sub:'Store analysis result as a patient biomarker record.',select:'Select Patient',send:'Save to Patient Profile',sent:'Saved!',noPatients:'No patients registered.'}}[lang];

  const migrate=()=>{
    if(!selectedId)return;
    assignBiomarker(selectedId, {
      date:    new Date().toISOString().slice(0,10),
      subtype: 'recovery',
      label:   `회복 바이오마커 분석 (점수: ${score}/10)`,
      score,
      data: {
        CPK_UL:      inputs.cpk,
        Urea_mmolL:  inputs.urea,
        Sleep_h:     inputs.sleep,
        SleepQ_1to5: inputs.sleepQ,
        HRV_ms:      inputs.hrv,
        Soreness_VAS: inputs.soreness,
      },
    });
    setSent(true); setTimeout(()=>setSent(false),2000);
  };

  return (
    <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-5">
      <p className="text-sm font-bold text-sky-700 dark:text-sky-400 mb-1 flex items-center gap-2"><Send size={14}/>{L.title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{L.sub}</p>
      {myPatients.length===0 ? (
        <p className="text-xs text-slate-400">{L.noPatients}</p>
      ) : (
        <div className="flex gap-2">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none">
            <option value="">{L.select}</option>
            {myPatients.map(p=><option key={p.id} value={p.id}>{p.name} ({p.condition})</option>)}
          </select>
          <button onClick={migrate} disabled={!selectedId||sent} className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-2 text-sm font-bold text-white transition-all">
            <Send size={14}/>{sent?L.sent:L.send}
          </button>
        </div>
      )}
    </div>
  );
}
export default RecoveryBiomarker;
