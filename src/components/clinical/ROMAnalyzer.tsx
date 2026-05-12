import { useState } from 'react';
import { Send } from 'lucide-react';
import { ROM_JOINTS, type Language } from '../../data/clinicalDB';
import { usePatient } from '../../context/PatientContext';
import { useDraft } from '../../lib/useDraft';

const DRAFT_KEY = 'kcos_draft_rom';

const T = {
  ko:{title:'ROM / 관절 각도 분석 도구',sub:'주요 관절의 가동 범위를 입력하고 표준치와 비교합니다.',select:'관절 선택',input:'현재 ROM 입력 (°)',normal:'정상 범위',your:'측정값',diff:'차이',status:'상태',within:'정상',reduced:'제한됨',reset:'초기화',note:'※ AAOS 기준 표준 범위. 임상 판단 시 환자 연령·측정 방법 고려 필수.'},
  ja:{title:'ROM / 関節角度分析ツール',sub:'主要関節の可動域を入力して標準値と比較します。',select:'関節選択',input:'現在のROM入力(°)',normal:'正常範囲',your:'測定値',diff:'差異',status:'状態',within:'正常',reduced:'制限あり',reset:'リセット',note:'※AAOS基準。臨床判断時は年齢・測定方法を考慮。'},
  en:{title:'ROM / Joint Angle Analysis Tool',sub:'Enter measured range of motion and compare against normative values.',select:'Select joint',input:'Enter current ROM (°)',normal:'Normal range',your:'Measured',diff:'Diff',status:'Status',within:'Within normal',reduced:'Restricted',reset:'Reset',note:'※ Based on AAOS normative values. Always consider patient age and measurement technique in clinical context.'},
} as const;

// ── 환자 프로필로 전송 ────────────────────────────────────────

function MigrateToPatient({ lang, jointId, values }: {
  lang:    Language;
  jointId: string;
  values:  Record<string, string>;
}) {
  const { myPatients, assignROM } = usePatient();
  const [selectedId, setSelectedId] = useState('');
  const [sent, setSent] = useState(false);

  const joint = ROM_JOINTS.find(j => j.id === jointId)!;
  const hasAny = joint.movements.some(mv => !isNaN(parseFloat(values[mv.id] ?? '')));

  const L = {
    ko:{title:'결과 → 환자 프로필 전송',sub:'ROM 측정값을 환자 기록으로 저장합니다.',select:'환자 선택',send:'환자 프로필로 저장',sent:'저장 완료!',none:'등록된 환자 없음'},
    ja:{title:'結果→患者プロフィール',sub:'ROM測定値を患者記録として保存。',select:'患者選択',send:'保存',sent:'保存完了!',none:'患者なし'},
    en:{title:'Save to Patient Profile',sub:'Store ROM measurements as a patient record.',select:'Select Patient',send:'Save to Patient',sent:'Saved!',none:'No patients registered'},
  }[lang];

  const migrate = () => {
    if (!selectedId || !hasAny) return;
    const romValues = joint.movements
      .filter(mv => !isNaN(parseFloat(values[mv.id] ?? '')))
      .map(mv => ({
        movementId:    mv.id,
        movementLabel: mv.label[lang],
        measured:      parseFloat(values[mv.id]),
        normalMin:     mv.normalMin,
        normalMax:     mv.normalMax,
      }));
    assignROM(selectedId, {
      date:       new Date().toISOString().slice(0,10),
      jointId:    joint.id,
      jointLabel: joint.label[lang],
      values:     romValues,
    });
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  if (!hasAny) return null;

  return (
    <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-5 mt-4">
      <p className="text-sm font-bold text-sky-700 dark:text-sky-400 mb-1 flex items-center gap-2"><Send size={14}/>{L.title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{L.sub}</p>
      {myPatients.length === 0 ? (
        <p className="text-xs text-slate-400">{L.none}</p>
      ) : (
        <div className="flex gap-2">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none">
            <option value="">{L.select}</option>
            {myPatients.map(p=><option key={p.id} value={p.id}>{p.name} ({p.condition})</option>)}
          </select>
          <button onClick={migrate} disabled={!selectedId||sent}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-2 text-sm font-bold text-white transition-all">
            <Send size={14}/>{sent?L.sent:L.send}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export function ROMAnalyzer({ lang='ko' }: { lang?: Language }) {
  const t = T[lang];

  const [jointId, setJointId] = useState(ROM_JOINTS[0].id);

  // useDraft: 복원 + 400ms 디바운스 + beforeunload 즉시저장
  const [values, setValues, clearValues] = useDraft<Record<string, string>>(DRAFT_KEY, {});

  const joint = ROM_JOINTS.find(j => j.id === jointId)!;
  const reset = () => clearValues();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="content-wrap">
        <h2 className="text-base font-bold text-slate-100 mb-0.5">{t.title}</h2>
        <p className="text-xs text-slate-500 mb-3">{t.sub}</p>

        {/* 관절 탭 선택 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ROM_JOINTS.map(j => (
            <button key={j.id} onClick={() => setJointId(j.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${jointId===j.id?'border-sky-500 bg-sky-950/60 text-sky-300':'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>
              {j.label[lang]}
            </button>
          ))}
          <button onClick={reset} className="ml-auto rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300">{t.reset}</button>
        </div>

        {/* 관절 ROM 입력 + 비교 */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h3 className="text-sm font-bold text-slate-200 mb-4">{joint.label[lang]}</h3>
          <div className="flex flex-col gap-3">
            {joint.movements.map(mv => {
              const val   = parseFloat(values[mv.id] ?? '');
              const mid   = (mv.normalMin + mv.normalMax) / 2;
              const hasV  = !isNaN(val);
              const within = hasV && val >= mv.normalMin * 0.9 && val <= mv.normalMax * 1.1;
              const diff   = hasV ? val - mid : null;
              const barPct = hasV ? Math.min(100, Math.max(0, (val / (mv.normalMax * 1.3)) * 100)) : 0;
              const normL  = (mv.normalMin / (mv.normalMax * 1.3)) * 100;
              const normH  = (mv.normalMax / (mv.normalMax * 1.3)) * 100;

              return (
                <div key={mv.id} className={`rounded-lg border p-3 transition-all ${hasV ? (within ? 'border-emerald-800 bg-emerald-950/20' : 'border-rose-800 bg-rose-950/20') : 'border-slate-700 bg-slate-800'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-slate-300 w-28 shrink-0">{mv.label[lang]}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" value={values[mv.id] ?? ''} placeholder="—"
                        onChange={e => setValues(p => ({ ...p, [mv.id]: e.target.value }))}
                        className="w-16 rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-xs text-slate-200 text-center focus:border-sky-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-600">{mv.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 ml-1">{t.normal}: {mv.normalMin}–{mv.normalMax}{mv.unit}</span>
                    {hasV && (
                      <>
                        <span className={`ml-auto text-xs font-bold ${within ? 'text-emerald-400' : 'text-rose-400'}`}>{within ? t.within : t.reduced}</span>
                        {diff !== null && <span className={`text-[10px] ${diff >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(0)}{mv.unit}</span>}
                      </>
                    )}
                  </div>
                  <div className="relative h-2 rounded-full bg-slate-700 overflow-visible">
                    <div className="absolute h-full rounded-full bg-emerald-900/60" style={{left:`${normL}%`, width:`${normH-normL}%`}}/>
                    {hasV && (
                      <div className={`absolute h-full w-1 rounded-full -translate-x-0.5 ${within?'bg-emerald-400':'bg-rose-400'}`} style={{left:`${barPct}%`}}/>
                    )}
                  </div>
                  <div className="flex justify-between mt-0.5 text-[8px] text-slate-700">
                    <span>0{mv.unit}</span>
                    <span>{Math.round(mv.normalMax * 1.3)}{mv.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-[10px] text-slate-600 italic">{t.note}</p>

        {/* 환자 프로필 전송 */}
        <MigrateToPatient lang={lang} jointId={jointId} values={values}/>
      </div>
    </div>
  );
}
export default ROMAnalyzer;
