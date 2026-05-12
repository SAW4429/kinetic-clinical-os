// ============================================================
//  SOAPChart — 초진(Initial) 전용 SOAP 차팅
//  저장 시 선택된 환자의 soapRecords에 귀속 (type: 'initial')
//  이후 수정/추가는 PatientDetailView 내에서만 수행
// ============================================================

import { useState, useRef, useEffect, type TextareaHTMLAttributes } from 'react';
import { UserPlus, ExternalLink } from 'lucide-react';
import { RED_FLAGS } from '../../data/clinicalDBExtended';
import { usePatient } from '../../context/PatientContext';
import { useDraft } from '../../lib/useDraft';
import type { Language } from '../../data/clinicalDB';

const DRAFT_KEY = 'kcos_draft_soap_initial';

// ── Auto-resize Textarea ─────────────────────────────────────

function AutoTextarea({ minRows = 3, ...props }: { minRows?: number } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => { const el=ref.current; if(!el)return; el.style.height='auto'; el.style.height=`${el.scrollHeight}px`; };
  useEffect(() => { resize(); }, [props.value]);
  return (
    <textarea ref={ref} {...props} onInput={resize}
      style={{ minHeight:`${minRows*24+24}px`, overflow:'hidden', resize:'none', ...props.style }}
      className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none leading-relaxed ${props.className??''}`}/>
  );
}

// ── SOAPData ─────────────────────────────────────────────────

interface SOAPData {
  chiefComplaint:string; mechanism:string; onset:string;
  painRest:string; painActive:string; aggravating:string; easing:string;
  medHistory:string; medications:string;
  posture:string; gait:string;
  hipFlex:string; hipExt:string; kneeFlex:string; kneeExt:string; ankleDf:string; shoulderFlex:string;
  mmtGroup:string; mmtGrade:string; specialTests:string; neurology:string;
  diagnosis:string; icd10:string; redFlags:string[]; pathCategory:string; icf:string;
  shortGoal:string; longGoal:string;
  fittFreq:string; fittIntensity:string; fittTime:string; fittType:string;
  precautions:string; rtpCriteria:string; followUpDate:string;
}
const EMPTY: SOAPData = {
  chiefComplaint:'', mechanism:'', onset:'', painRest:'', painActive:'', aggravating:'', easing:'', medHistory:'', medications:'',
  posture:'', gait:'', hipFlex:'', hipExt:'', kneeFlex:'', kneeExt:'', ankleDf:'', shoulderFlex:'', mmtGroup:'', mmtGrade:'', specialTests:'', neurology:'',
  diagnosis:'', icd10:'', redFlags:[], pathCategory:'', icf:'',
  shortGoal:'', longGoal:'', fittFreq:'', fittIntensity:'', fittTime:'', fittType:'', precautions:'', rtpCriteria:'', followUpDate:'',
};

function SectionHeader({ letter, title, color }:{ letter:string; title:string; color:string }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 mb-6 ${color}`}>
      <span className="text-2xl font-black">{letter}</span>
      <span className="text-base font-bold">{title}</span>
    </div>
  );
}
function Field({ label, children }:{ label:string; children:React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const numInp  = "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none w-full";
const textInp = "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none w-full";
const URGENCY_BADGE: Record<string,string> = { immediate:'bg-red-600 text-white', '24h':'bg-amber-500 text-white', monitor:'bg-sky-600 text-white' };

const T = {
  ko:{
    title:'초진 SOAP 차팅', sub:'이 폼은 최초 기록(초진) 전용입니다. 이후 수정 및 추가 기록은 환자 상세 프로필에서 진행하세요.',
    badge:'초진 전용', selectPatient:'환자 선택 (필수)', selectPh:'환자를 선택하세요',
    s:'주관적 정보',o:'객관적 정보',a:'평가',p:'계획',
    cc:'주호소',mech:'손상 기전',onset:'발생 시기',pr:'VAS 안정 시 (0-10)',pa:'VAS 활동 시 (0-10)',
    agg:'악화 인자',ease:'완화 인자',medhx:'기저질환/과거력',meds:'복용 약물',
    posture:'자세 관찰',gait:'보행 패턴',rom:'ROM 측정 (°)',
    hipF:'고관절 굴곡',hipE:'신전',kneeF:'슬관절 굴곡',kneeE:'신전',ankleD:'족관절 배굴',shF:'견관절 굴곡',
    mmtGrp:'MMT 대상 근군',mmtGr:'MMT 등급 (0-5)',special:'특수 검사 결과',neuro:'신경학적 소견',
    dx:'진단명',icd:'ICD-10 코드',rf:'레드플래그',pathCat:'병태 분류',icf:'ICF 활동 제한',
    sg:'단기 목표 (4주)',lg:'장기 목표 (12주)',fittF:'빈도',fittI:'강도',fittT:'시간',fittTy:'유형',
    prec:'주의사항',rtp:'복귀 기준',fu:'다음 예약',
    save:'초진 기록 저장', copy:'차팅 복사', clear:'초기화',
    savedTitle:'초진 기록 저장 완료', savedSub:'이후 모든 수정 및 추가 기록은 환자 상세 프로필에서 진행하세요.',
    openProfile:'환자 프로필 열기', saveAnother:'새 초진 작성',
    noCC:'주호소를 입력해주세요.', noPatient:'환자를 먼저 선택해주세요.',
  },
  ja:{
    title:'初診SOAPチャート', sub:'このフォームは初診専用です。以降の修正・追加は患者詳細プロフィールで行ってください。',
    badge:'初診専用', selectPatient:'患者選択（必須）', selectPh:'患者を選択してください',
    s:'主観的情報',o:'客観的情報',a:'評価',p:'計画',
    cc:'主訴',mech:'受傷機転',onset:'発症時期',pr:'VAS安静時',pa:'VAS活動時',
    agg:'増悪因子',ease:'緩和因子',medhx:'既往歴',meds:'服用薬剤',
    posture:'姿勢観察',gait:'歩行',rom:'ROM測定(°)',
    hipF:'股屈曲',hipE:'股伸展',kneeF:'膝屈曲',kneeE:'膝伸展',ankleD:'足背屈',shF:'肩屈曲',
    mmtGrp:'MMT筋群',mmtGr:'MMTグレード',special:'特殊テスト',neuro:'神経所見',
    dx:'診断名',icd:'ICD-10',rf:'レッドフラグ',pathCat:'病態分類',icf:'ICF制限',
    sg:'短期目標',lg:'長期目標',fittF:'頻度',fittI:'強度',fittT:'時間',fittTy:'種類',
    prec:'注意事項',rtp:'復帰基準',fu:'次回予約',
    save:'初診記録保存', copy:'コピー', clear:'リセット',
    savedTitle:'初診記録保存完了', savedSub:'以降の修正・追加は患者詳細プロフィールで。',
    openProfile:'患者プロフィールを開く', saveAnother:'新規初診',
    noCC:'主訴を入力してください。', noPatient:'患者を選択してください。',
  },
  en:{
    title:'Initial SOAP Chart', sub:'This form is for initial assessments only. All subsequent edits and entries are made in the patient detail profile.',
    badge:'Initial Only', selectPatient:'Select Patient (required)', selectPh:'Choose a patient…',
    s:'Subjective',o:'Objective',a:'Assessment',p:'Plan',
    cc:'Chief Complaint',mech:'Mechanism of Injury',onset:'Onset',pr:'VAS Rest (0-10)',pa:'VAS Active (0-10)',
    agg:'Aggravating Factors',ease:'Easing Factors',medhx:'Medical History',meds:'Current Medications',
    posture:'Postural Observation',gait:'Gait Pattern',rom:'ROM Measurements (°)',
    hipF:'Hip Flexion',hipE:'Extension',kneeF:'Knee Flexion',kneeE:'Extension',ankleD:'Ankle DF',shF:'Shoulder Flexion',
    mmtGrp:'MMT Muscle Group',mmtGr:'MMT Grade (0–5)',special:'Special Test Results',neuro:'Neurological Findings',
    dx:'Diagnosis',icd:'ICD-10 Code',rf:'Red Flags',pathCat:'Pathological Category',icf:'ICF Activity Limitation',
    sg:'Short-term Goal (4 weeks)',lg:'Long-term Goal (12 weeks)',fittF:'Frequency',fittI:'Intensity',fittT:'Time',fittTy:'Type',
    prec:'Precautions',rtp:'Return to Play / Work Criteria',fu:'Follow-up Date',
    save:'Save Initial Record', copy:'Copy Chart', clear:'Clear',
    savedTitle:'Initial Record Saved', savedSub:'All further edits and entries must be done in the patient detail profile.',
    openProfile:'Open Patient Profile', saveAnother:'New Initial Chart',
    noCC:'Please enter a chief complaint.', noPatient:'Please select a patient first.',
  },
} as const;

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface Props { lang?: Language; onOpenChart?: (id: string) => void; }

export function SOAPChart({ lang='ko', onOpenChart }: Props) {
  const t = T[lang];
  const { myPatients, addSession, markViewed } = usePatient();

  // useDraft: 복원 + 400ms 디바운스 + beforeunload 즉시저장
  const [draftState, setDraftState, clearDraftState] = useDraft<{ patientId:string; data:SOAPData } | null>(
    DRAFT_KEY, null
  );

  const [selectedPatientId, setSelectedPatientId] = useState(draftState?.patientId ?? '');
  const [d, setD] = useState<SOAPData>(draftState?.data ?? EMPTY);
  const [errMsg, setErrMsg] = useState('');
  const [savedPatientId, setSavedPatientId] = useState<string | null>(null);

  const set = (k:keyof SOAPData) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const next = { ...d, [k]: e.target.value };
    setD(next);
    setDraftState({ patientId: selectedPatientId, data: next });
    setErrMsg('');
  };
  const toggleRF = (id:string) => {
    const next = { ...d, redFlags: d.redFlags.includes(id)?d.redFlags.filter(x=>x!==id):[...d.redFlags,id] };
    setD(next);
    setDraftState({ patientId: selectedPatientId, data: next });
  };
  const hasImmediate = d.redFlags.some(id=>RED_FLAGS.find(f=>f.id===id)?.urgency==='immediate');

  // 환자 선택 변경 시 draft 동기화
  const handlePatientSelect = (pid: string) => {
    setSelectedPatientId(pid);
    setDraftState({ patientId: pid, data: d });
  };

  const handleSave = () => {
    if (!selectedPatientId) { setErrMsg(t.noPatient); return; }
    if (!d.chiefComplaint.trim()) { setErrMsg(t.noCC); return; }

    addSession({
      patientId:      selectedPatientId,
      date:           new Date().toISOString().slice(0,10),
      type:           'initial',
      chiefComplaint: d.chiefComplaint.trim(),
      vasRest:        d.painRest  ? parseFloat(d.painRest)  : undefined,
      vasActive:      d.painActive? parseFloat(d.painActive): undefined,
      notes: [
        d.mechanism && `기전: ${d.mechanism}`,
        d.onset     && `발생: ${d.onset}`,
        d.diagnosis && `진단: ${d.diagnosis}`,
        d.icd10     && `ICD: ${d.icd10}`,
        d.shortGoal && `단기목표: ${d.shortGoal}`,
        d.followUpDate && `다음예약: ${d.followUpDate}`,
      ].filter(Boolean).join(' | ') || undefined,
      status: 'complete',
    });

    markViewed(selectedPatientId);
    clearDraftState();
    setSavedPatientId(selectedPatientId);
  };

  const handleReset = () => {
    setD(EMPTY);
    setSelectedPatientId('');
    setSavedPatientId(null);
    setErrMsg('');
    clearDraftState();
  };

  const copyText = () => {
    const lines = [
      `=== ${t.s} ===`,`${t.cc}: ${d.chiefComplaint}`,`${t.mech}: ${d.mechanism}`,
      `${t.onset}: ${d.onset}  |  ${t.pr}: ${d.painRest}  |  ${t.pa}: ${d.painActive}`,
      `\n=== ${t.o} ===`,`${t.posture}: ${d.posture}  |  ${t.gait}: ${d.gait}`,
      `ROM — Hip F:${d.hipFlex} E:${d.hipExt} | Knee F:${d.kneeFlex} E:${d.kneeExt} | Ankle DF:${d.ankleDf} | Shoulder F:${d.shoulderFlex}`,
      `\n=== ${t.a} ===`,`${t.dx}: ${d.diagnosis} (${d.icd10})`,
      `\n=== ${t.p} ===`,`${t.sg}: ${d.shortGoal}`,`${t.lg}: ${d.longGoal}`,
      `FITT: F=${d.fittFreq} | I=${d.fittIntensity} | T=${d.fittTime} | T=${d.fittType}`,
      `${t.rtp}: ${d.rtpCriteria}`,`${t.fu}: ${d.followUpDate}`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).catch(()=>{});
  };

  // ── 저장 완료 화면 ───────────────────────────────────────────
  if (savedPatientId) {
    const patient = myPatients.find(p => p.id === savedPatientId);
    return (
      <div className="p-4 md:p-6 min-h-full" style={{background:'var(--bg-app)'}}>
        <div className="content-wrap max-w-lg mx-auto mt-16 text-center flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
            <span className="text-4xl">✓</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t.savedTitle}</h2>
            {patient && <p className="text-sm text-sky-600 dark:text-sky-400 font-semibold mb-1">{patient.name} · {patient.condition}</p>}
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.savedSub}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              {t.saveAnother}
            </button>
            {onOpenChart && patient && (
              <button onClick={() => { onOpenChart(savedPatientId); setSavedPatientId(null); }}
                className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-sm font-bold text-white">
                <ExternalLink size={15}/> {t.openProfile}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 차팅 폼 ──────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="content-wrap">

        {/* 헤더 + 환자 선택 */}
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
              <span className="rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">{t.badge}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.sub}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">{t.clear}</button>
            <button onClick={copyText}    className="px-4 py-2 rounded-xl bg-slate-600 text-white text-sm font-bold hover:bg-slate-500">{t.copy}</button>
          </div>
        </div>

        {/* 환자 선택 패널 */}
        <div className={`rounded-xl border-2 p-4 mb-6 flex items-center gap-3 ${selectedPatientId?'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/30':'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20'}`}>
          <UserPlus size={18} className={selectedPatientId?'text-sky-600 dark:text-sky-400':'text-amber-600 dark:text-amber-400'}/>
          <div className="flex-1">
            <p className="text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">{t.selectPatient}</p>
            {myPatients.length === 0 ? (
              <p className="text-xs text-slate-400">{lang==='ko'?'등록된 환자가 없습니다.':'No patients registered.'}</p>
            ) : (
              <select value={selectedPatientId} onChange={e=>handlePatientSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none">
                <option value="">{t.selectPh}</option>
                {myPatients.map(p=><option key={p.id} value={p.id}>{p.name} ({p.age}{lang==='ko'?'세':'y'} · {p.condition})</option>)}
              </select>
            )}
          </div>
        </div>

        {hasImmediate&&(
          <div className="mb-6 rounded-2xl border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/50 p-5 flex items-center gap-4">
            <span className="text-3xl">🚨</span>
            <p className="font-bold text-red-700 dark:text-red-300 text-base">
              {lang==='ko'?'레드플래그 감지 — 즉각 의사 의뢰 필요':lang==='ja'?'レッドフラグ検出 — 即時医師紹介必要':'Red flag detected — immediate physician referral required'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-10">

          {/* ── S ── */}
          <section>
            <SectionHeader letter="S" title={t.s} color="bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300"/>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t.cc}><AutoTextarea minRows={3} value={d.chiefComplaint} onChange={set('chiefComplaint')}/></Field>
              <Field label={t.mech}><AutoTextarea minRows={3} value={d.mechanism} onChange={set('mechanism')}/></Field>
              <Field label={t.onset}><input value={d.onset} onChange={set('onset')} className={textInp}/></Field>
              <Field label={t.pr}><input type="number" min={0} max={10} value={d.painRest} onChange={set('painRest')} placeholder="0-10" className={numInp}/></Field>
              <Field label={t.pa}><input type="number" min={0} max={10} value={d.painActive} onChange={set('painActive')} placeholder="0-10" className={numInp}/></Field>
              <Field label={t.agg}><AutoTextarea minRows={3} value={d.aggravating} onChange={set('aggravating')}/></Field>
              <Field label={t.ease}><AutoTextarea minRows={3} value={d.easing} onChange={set('easing')}/></Field>
              <Field label={t.medhx}><AutoTextarea minRows={3} value={d.medHistory} onChange={set('medHistory')}/></Field>
              <Field label={t.meds}><AutoTextarea minRows={3} value={d.medications} onChange={set('medications')}/></Field>
            </div>
          </section>

          {/* ── O ── */}
          <section>
            <SectionHeader letter="O" title={t.o} color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"/>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
              <Field label={t.posture}><AutoTextarea minRows={3} value={d.posture} onChange={set('posture')}/></Field>
              <Field label={t.gait}><AutoTextarea minRows={3} value={d.gait} onChange={set('gait')}/></Field>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-4">{t.rom}</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 mb-6">
              {[['hipFlex',t.hipF],['hipExt',t.hipE],['kneeFlex',t.kneeF],['kneeExt',t.kneeE],['ankleDf',t.ankleD],['shoulderFlex',t.shF]].map(([k,lb])=>(
                <Field key={k} label={lb as string}><input type="number" value={(d as any)[k]} onChange={set(k as keyof SOAPData)} placeholder="°" className={numInp}/></Field>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-5">
              <Field label={t.mmtGrp}><input value={d.mmtGroup} onChange={set('mmtGroup')} className={textInp}/></Field>
              <Field label={t.mmtGr}><input type="number" min={0} max={5} step={0.5} value={d.mmtGrade} onChange={set('mmtGrade')} placeholder="0-5" className={numInp}/></Field>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={t.special}><AutoTextarea minRows={4} value={d.specialTests} onChange={set('specialTests')}/></Field>
              <Field label={t.neuro}><AutoTextarea minRows={4} value={d.neurology} onChange={set('neurology')}/></Field>
            </div>
          </section>

          {/* ── A ── */}
          <section>
            <SectionHeader letter="A" title={t.a} color="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"/>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
              <Field label={t.dx}><input value={d.diagnosis} onChange={set('diagnosis')} className={textInp}/></Field>
              <Field label={t.icd}><input value={d.icd10} onChange={set('icd10')} placeholder="M54.5 …" className={textInp}/></Field>
              <Field label={t.pathCat}><input value={d.pathCategory} onChange={set('pathCategory')} className={textInp}/></Field>
            </div>
            <Field label={t.icf}><AutoTextarea minRows={2} value={d.icf} onChange={set('icf')} className="mb-5"/></Field>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-3">🚨 {t.rf}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {RED_FLAGS.map(f=>{
                const checked=d.redFlags.includes(f.id);
                return (
                  <label key={f.id} className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${checked?'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleRF(f.id)} className="mt-0.5 h-4 w-4 accent-red-500"/>
                    <div>
                      <span className={`text-sm font-semibold ${checked?'text-red-700 dark:text-red-300':'text-slate-800 dark:text-slate-200'}`}>{f.label[lang]}</span>
                      <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${URGENCY_BADGE[f.urgency]}`}>{f.urgency.toUpperCase()}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* ── P ── */}
          <section>
            <SectionHeader letter="P" title={t.p} color="bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300"/>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
              <Field label={t.sg}><AutoTextarea minRows={3} value={d.shortGoal} onChange={set('shortGoal')}/></Field>
              <Field label={t.lg}><AutoTextarea minRows={3} value={d.longGoal} onChange={set('longGoal')}/></Field>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">FITT</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
              {[['fittFreq',t.fittF],['fittIntensity',t.fittI],['fittTime',t.fittT],['fittType',t.fittTy]].map(([k,lb])=>(
                <Field key={k} label={lb as string}><input value={(d as any)[k]} onChange={set(k as keyof SOAPData)} className={textInp}/></Field>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label={t.prec}><AutoTextarea minRows={3} value={d.precautions} onChange={set('precautions')}/></Field>
              <Field label={t.rtp}><AutoTextarea minRows={3} value={d.rtpCriteria} onChange={set('rtpCriteria')}/></Field>
              <Field label={t.fu}><input type="date" value={d.followUpDate} onChange={set('followUpDate')} className={textInp}/></Field>
            </div>
          </section>

        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 flex flex-col items-end gap-2">
          {errMsg && <p className="text-sm text-red-500 dark:text-red-400">{errMsg}</p>}
          <button onClick={handleSave} disabled={!selectedPatientId || !d.chiefComplaint.trim()}
            className="rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-8 py-3 text-sm font-bold text-white transition-all shadow-sm">
            {t.save}
          </button>
        </div>

      </div>
    </div>
  );
}
export default SOAPChart;
