import { useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { useDraft } from '../../lib/useDraft';
import type { Language } from '../../data/clinicalDB';

interface Entry { date: string; grip: string; jump: string; note: string; }
const DRAFT_KEY = 'kcos_draft_cns';

const T = {
  ko:{title:'CNS 피로도 추적기',sub:'악력 및 수직 점프 변화를 기록하여 중추신경계 피로를 모니터링합니다.',date:'날짜',grip:'악력 (kg)',jump:'수직 점프 (cm)',note:'메모 (선택)',add:'데이터 추가',baseline:'기준값 (첫 입력 기준)',trend:'추세 그래프',table:'기록 내역',noData:'데이터를 입력해주세요.',good:'정상 범위',warn:'주의 (5-10% 감소)',alert:'CNS 피로 의심 (>10% 감소)',del:'삭제'},
  ja:{title:'CNS疲労度トラッカー',sub:'握力・垂直跳び変化を記録して中枢神経系疲労をモニタリング。',date:'日付',grip:'握力(kg)',jump:'垂直跳び(cm)',note:'メモ（任意）',add:'データ追加',baseline:'基準値（初回入力）',trend:'トレンドグラフ',table:'記録一覧',noData:'データを入力してください。',good:'正常範囲',warn:'注意（5-10%減少）',alert:'CNS疲労疑い（>10%減少）',del:'削除'},
  en:{title:'CNS Fatigue Tracker',sub:'Record grip strength and vertical jump to monitor central nervous system fatigue.',date:'Date',grip:'Grip Strength (kg)',jump:'Vertical Jump (cm)',note:'Note (optional)',add:'Add Entry',baseline:'Baseline (first entry)',trend:'Trend Chart',table:'History',noData:'No data yet. Add an entry above.',good:'Normal range',warn:'Caution (5–10% decline)',alert:'CNS fatigue suspected (>10% decline)',del:'Delete'},
} as const;

function pctChange(base: number, cur: number) { return ((cur - base) / base) * 100; }
function status(pct: number): 'good'|'warn'|'alert' { return pct > -5 ? 'good' : pct > -10 ? 'warn' : 'alert'; }
const STATUS_COLOR = { good:'text-emerald-400', warn:'text-amber-400', alert:'text-rose-400 animate-pulse' } as const;
const STATUS_BG    = { good:'border-emerald-800 bg-emerald-950/30', warn:'border-amber-800 bg-amber-950/30', alert:'border-rose-700 bg-rose-950/40' } as const;

// ── 환자 프로필로 전송 ────────────────────────────────────────

function MigrateToPatient({ lang, entries, latest }: {
  lang: Language;
  entries: Entry[];
  latest: { gPct:number; jPct:number; overallSt:'good'|'warn'|'alert'; grip:string; jump:string } | undefined;
}) {
  const { myPatients, assignBiomarker } = usePatient();
  const [selectedId, setSelectedId] = useState('');
  const [sent, setSent] = useState(false);

  const L = {
    ko:{title:'결과 → 환자 프로필 전송',sub:'CNS 피로도 추적 결과를 환자 바이오마커 기록으로 저장합니다.',select:'환자 선택',send:'환자 프로필로 저장',sent:'저장 완료!',none:'등록된 환자 없음'},
    ja:{title:'結果→患者プロフィール',sub:'CNS疲労度追跡結果をバイオマーカーとして保存。',select:'患者選択',send:'保存',sent:'保存完了!',none:'患者なし'},
    en:{title:'Save to Patient Profile',sub:'Store CNS fatigue tracking as a biomarker record.',select:'Select Patient',send:'Save to Patient',sent:'Saved!',none:'No patients registered'},
  }[lang];

  const scoreMap = { good: 8, warn: 5, alert: 2 };

  const migrate = () => {
    if (!selectedId || entries.length === 0) return;
    assignBiomarker(selectedId, {
      date:    new Date().toISOString().slice(0,10),
      subtype: 'cns',
      label:   `CNS 피로도 추적 (${entries.length}회 기록)`,
      score:   latest ? scoreMap[latest.overallSt] : undefined,
      data: {
        기록횟수:    entries.length,
        최근악력kg:  latest?.grip ?? '—',
        최근점프cm:  latest?.jump ?? '—',
        악력변화:    latest ? `${latest.gPct>=0?'+':''}${latest.gPct.toFixed(1)}%` : '—',
        점프변화:    latest ? `${latest.jPct>=0?'+':''}${latest.jPct.toFixed(1)}%` : '—',
        CNS상태:     latest?.overallSt ?? '—',
      },
    });
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5">
      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2"><Send size={14}/>{L.title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{L.sub}</p>
      {myPatients.length === 0 ? (
        <p className="text-xs text-slate-400">{L.none}</p>
      ) : (
        <div className="flex gap-2">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-400 focus:outline-none">
            <option value="">{L.select}</option>
            {myPatients.map(p=><option key={p.id} value={p.id}>{p.name} ({p.condition})</option>)}
          </select>
          <button onClick={migrate} disabled={!selectedId||sent}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 px-4 py-2 text-sm font-bold text-white transition-all">
            <Send size={14}/>{sent?L.sent:L.send}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export function CNSFatigueTracker({ lang='ko' }: { lang?: Language }) {
  const t = T[lang];

  // useDraft: 복원 + 400ms 디바운스 + beforeunload 즉시저장
  const [entries, setEntries] = useDraft<Entry[]>(DRAFT_KEY, []);
  const [form, setForm] = useState<Entry>({ date: new Date().toISOString().slice(0,10), grip:'', jump:'', note:'' });
  const setF = (k: keyof Entry) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p=>({...p,[k]:e.target.value}));

  const add = () => {
    if (!form.grip || !form.jump) return;
    setEntries(p => [...p, { ...form }]);
    setForm(p => ({ ...p, grip:'', jump:'', note:'' }));
  };
  const del = (i: number) => setEntries(p => p.filter((_,idx)=>idx!==i));

  const analyzed = useMemo(() => {
    if (entries.length === 0) return [];
    const baseGrip = parseFloat(entries[0].grip);
    const baseJump = parseFloat(entries[0].jump);
    return entries.map(e => {
      const g = parseFloat(e.grip); const j = parseFloat(e.jump);
      const gPct = isNaN(g)||isNaN(baseGrip) ? 0 : pctChange(baseGrip, g);
      const jPct = isNaN(j)||isNaN(baseJump) ? 0 : pctChange(baseJump, j);
      const worst = Math.min(gPct, jPct);
      return { ...e, gPct, jPct, gSt: status(gPct), jSt: status(jPct), overallSt: status(worst) };
    });
  }, [entries]);

  const latest = analyzed[analyzed.length - 1];
  const maxJump = Math.max(...entries.map(e=>parseFloat(e.jump)||0), 1);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="content-wrap">
        <h2 className="text-base font-bold text-slate-100 mb-0.5">{t.title}</h2>
        <p className="text-xs text-slate-500 mb-3">{t.sub}</p>

        {/* 입력 폼 */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500">{t.date}</label>
              <input type="date" value={form.date} onChange={setF('date')} className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500">{t.grip}</label>
              <input type="number" value={form.grip} onChange={setF('grip')} placeholder="e.g. 42" className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500">{t.jump}</label>
              <input type="number" value={form.jump} onChange={setF('jump')} placeholder="e.g. 55" className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500">{t.note}</label>
              <input type="text" value={form.note} onChange={setF('note')} placeholder="optional" className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"/>
            </div>
          </div>
          <button onClick={add} className="mt-3 rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">{t.add}</button>
        </div>

        {analyzed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-16 text-slate-600">
            <span className="text-3xl">◎</span><p className="text-xs">{t.noData}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {latest && (
              <div className={`rounded-xl border p-4 ${STATUS_BG[latest.overallSt]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${STATUS_COLOR[latest.overallSt]}`}>◎</span>
                  <span className={`text-sm font-bold ${STATUS_COLOR[latest.overallSt]}`}>{t[latest.overallSt]}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500">{t.grip}</p>
                    <p className="text-sm font-bold text-slate-200">{latest.grip} kg</p>
                    <p className={`text-xs ${STATUS_COLOR[latest.gSt]}`}>{latest.gPct>=0?'+':''}{latest.gPct.toFixed(1)}% vs baseline</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">{t.jump}</p>
                    <p className="text-sm font-bold text-slate-200">{latest.jump} cm</p>
                    <p className={`text-xs ${STATUS_COLOR[latest.jSt]}`}>{latest.jPct>=0?'+':''}{latest.jPct.toFixed(1)}% vs baseline</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{t.trend} — Vertical Jump</p>
              <div className="flex items-end gap-1 h-24">
                {analyzed.map((e,i)=>{
                  const h = ((parseFloat(e.jump)||0)/maxJump)*100;
                  const col = e.jSt==='good'?'bg-emerald-500':e.jSt==='warn'?'bg-amber-500':'bg-rose-500';
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className={`rounded-t w-full ${col} transition-all duration-500`} style={{height:`${h}%`}} title={`${e.jump} cm`}/>
                      <span className="text-[8px] text-slate-600 truncate w-full text-center">{e.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 overflow-x-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{t.table}</p>
              <table className="w-full text-xs min-w-[400px]">
                <thead><tr className="border-b border-slate-700">
                  <th className="text-left pb-1 text-slate-500">{t.date}</th>
                  <th className="text-right pb-1 text-slate-500">{t.grip}</th>
                  <th className="text-right pb-1 text-slate-500">Δ Grip</th>
                  <th className="text-right pb-1 text-slate-500">{t.jump}</th>
                  <th className="text-right pb-1 text-slate-500">Δ Jump</th>
                  <th className="text-center pb-1 text-slate-500">CNS</th>
                  <th className="pb-1"/>
                </tr></thead>
                <tbody>
                  {analyzed.map((e,i)=>(
                    <tr key={i} className="border-b border-slate-800">
                      <td className="py-1.5 text-slate-300">{e.date}</td>
                      <td className="py-1.5 text-right text-slate-300">{e.grip}</td>
                      <td className={`py-1.5 text-right ${STATUS_COLOR[e.gSt]}`}>{i===0?'—':`${e.gPct>=0?'+':''}${e.gPct.toFixed(1)}%`}</td>
                      <td className="py-1.5 text-right text-slate-300">{e.jump}</td>
                      <td className={`py-1.5 text-right ${STATUS_COLOR[e.jSt]}`}>{i===0?'—':`${e.jPct>=0?'+':''}${e.jPct.toFixed(1)}%`}</td>
                      <td className={`py-1.5 text-center text-[10px] font-bold ${STATUS_COLOR[e.overallSt]}`}>{i===0?'BASE':e.overallSt.toUpperCase()}</td>
                      <td className="py-1.5 text-right"><button onClick={()=>del(i)} className="text-slate-600 hover:text-rose-400 text-[10px]">{t.del}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 환자 프로필 전송 */}
        <div className="mt-4">
          <MigrateToPatient lang={lang} entries={entries} latest={latest}/>
        </div>
      </div>
    </div>
  );
}
export default CNSFatigueTracker;
