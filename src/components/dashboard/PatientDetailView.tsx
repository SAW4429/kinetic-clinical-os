// ============================================================
//  PatientDetailView — 환자별 독립 차팅 공간
//  soapRecords / biomarkerRecords / romAnalysis 탭 지원
// ============================================================

import { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowLeft, FileText, Activity, Heart, BarChart2 } from 'lucide-react';
import { usePatient, type Patient } from '../../context/PatientContext';
import type { SOAPRecord, BiomarkerRecord, ROMRecord } from '../../store/patientStore';
import type { Language } from '../../data/clinicalDB';

type TabId = 'soap' | 'biomarker' | 'rom';

const T = {
  ko:{ back:'← 환자 목록', newSession:'새 세션 추가', noRecords:'기록이 없습니다. 새 세션을 추가하세요.', initial:'초진', followUp:'재진', discharge:'퇴원', draft:'초안', complete:'완료', vasR:'VAS 안정', vasA:'VAS 활동', save:'저장', cancel:'취소', type:'유형', cc:'주호소', date:'날짜', tabSoap:'SOAP 차팅', tabBio:'바이오마커', tabRom:'ROM 분석', lastUpd:'최근', score:'점수' },
  ja:{ back:'← 患者一覧', newSession:'新セッション', noRecords:'記録がありません。', initial:'初診', followUp:'再診', discharge:'退院', draft:'下書き', complete:'完了', vasR:'VAS安静', vasA:'VAS活動', save:'保存', cancel:'キャンセル', type:'種類', cc:'主訴', date:'日付', tabSoap:'SOAPチャート', tabBio:'バイオマーカー', tabRom:'ROM分析', lastUpd:'最新', score:'スコア' },
  en:{ back:'← Patients', newSession:'New Session', noRecords:'No records yet.', initial:'Initial', followUp:'Follow-up', discharge:'Discharge', draft:'Draft', complete:'Done', vasR:'VAS Rest', vasA:'VAS Active', save:'Save', cancel:'Cancel', type:'Type', cc:'Chief Complaint', date:'Date', tabSoap:'SOAP Chart', tabBio:'Biomarker', tabRom:'ROM Analysis', lastUpd:'Latest', score:'Score' },
} as const;

// ── SOAP 카드 ─────────────────────────────────────────────────

function SOAPCard({ record, lang, patientId, onDelete }: { record:SOAPRecord; lang:Language; patientId:string; onDelete:(rId:string)=>void }) {
  const t=T[lang];
  const { updateSession }=usePatient();
  const TYPE: Record<string,string>={'initial':t.initial,'follow-up':t.followUp,'discharge':t.discharge};
  const isDraft=record.status==='draft';
  return (
    <div className="chart-card rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 relative group hover:border-sky-300 dark:hover:border-sky-700 transition-all">
      <button onClick={()=>onDelete(record.id)} title="Move to Trash" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"><Trash2 size={14}/></button>
      <div className="flex items-start gap-3 pr-8">
        <FileText size={14} className="text-sky-500 mt-1 shrink-0"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{record.chiefComplaint||(lang==='ko'?'주호소 없음':'No CC')}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDraft?'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400':'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'}`}>{isDraft?t.draft:t.complete}</span>
            <span className="text-[10px] border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 text-slate-500">{TYPE[record.type]??record.type}</span>
          </div>
          <div className="flex gap-3 text-xs text-slate-400">
            <span>{record.date}</span>
            {record.vasRest!==undefined&&<span>{t.vasR}: {record.vasRest}/10</span>}
            {record.vasActive!==undefined&&<span>{t.vasA}: {record.vasActive}/10</span>}
          </div>
          {record.notes&&<p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{record.notes}</p>}
        </div>
      </div>
      {/* 완료 처리 버튼 */}
      {isDraft&&(
        <button onClick={()=>updateSession(patientId,record.id,{status:'complete'})} className="mt-3 w-full rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all">
          {lang==='ko'?'완료 처리':lang==='ja'?'完了にする':'Mark Complete'}
        </button>
      )}
    </div>
  );
}

// ── Biomarker 카드 ────────────────────────────────────────────

function BioCard({ record, lang, onDelete }: { record:BiomarkerRecord; lang:Language; onDelete:(rId:string)=>void }) {
  const t=T[lang];
  return (
    <div className="chart-card rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 relative group hover:border-pink-300 dark:hover:border-pink-700 transition-all">
      <button onClick={()=>onDelete(record.id)} title="Move to Trash" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"><Trash2 size={14}/></button>
      <div className="flex items-start gap-3 pr-8">
        <Heart size={14} className="text-pink-500 mt-1 shrink-0"/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{record.label}</p>
          <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
            <span>{record.date}</span>
            {record.score!==undefined&&<span className="font-semibold text-sky-600 dark:text-sky-400">{t.score}: {record.score}/10</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(record.data).filter(([,v])=>v!==undefined).map(([k,v])=>(
              <span key={k} className="rounded px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500">{k}: {v}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ROM 카드 ──────────────────────────────────────────────────

function ROMCard({ record, lang, onDelete }: { record:ROMRecord; lang:Language; onDelete:(rId:string)=>void }) {
  return (
    <div className="chart-card rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 relative group hover:border-violet-300 dark:hover:border-violet-700 transition-all">
      <button onClick={()=>onDelete(record.id)} title="Move to Trash" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"><Trash2 size={14}/></button>
      <div className="flex items-start gap-3 pr-8">
        <BarChart2 size={14} className="text-violet-500 mt-1 shrink-0"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{record.jointLabel}</p>
            <span className="text-xs text-slate-400">{record.date}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {record.values.map(v => {
              const within = v.measured >= v.normalMin * 0.9 && v.measured <= v.normalMax * 1.1;
              return (
                <div key={v.movementId} className="rounded-lg border border-slate-100 dark:border-slate-800 p-2 text-xs">
                  <p className="text-slate-500 mb-0.5">{v.movementLabel}</p>
                  <span className={`font-bold ${within?'text-emerald-600 dark:text-emerald-400':'text-red-500 dark:text-red-400'}`}>{v.measured}°</span>
                  <span className="text-slate-400 ml-1">({v.normalMin}–{v.normalMax}°)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 세션 추가 폼 (드래프트 자동저장 포함) ─────────────────────

const SOAP_INIT = { date: new Date().toISOString().slice(0,10), type: 'follow-up' as SOAPRecord['type'], chiefComplaint: '', vasRest: '', vasActive: '', notes: '' };

function AddSOAPForm({ patientId, lang, onSave, onCancel }: { patientId:string; lang:Language; onSave:(d:any)=>void; onCancel:()=>void }) {
  const t = T[lang];
  const { getDraft, saveDraft, clearDraft } = usePatient();

  // 1. 마운트 시 저장된 드래프트 복원
  const [form, setForm] = useState(() => {
    const saved = getDraft(patientId, 'soap');
    if (!saved) return SOAP_INIT;
    return {
      date:           saved.date           ?? SOAP_INIT.date,
      type:           saved.type           ?? SOAP_INIT.type,
      chiefComplaint: saved.chiefComplaint ?? '',
      vasRest:        saved.vasRest        !== undefined ? String(saved.vasRest)   : '',
      vasActive:      saved.vasActive      !== undefined ? String(saved.vasActive) : '',
      notes:          saved.notes          ?? '',
    };
  });

  // 2. 변경 시 400ms 디바운스 자동저장 (취소해도 드래프트 유지)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(patientId, 'soap', {
        date:           form.date,
        type:           form.type,
        chiefComplaint: form.chiefComplaint,
        vasRest:        form.vasRest   ? parseFloat(form.vasRest)   : undefined,
        vasActive:      form.vasActive ? parseFloat(form.vasActive) : undefined,
        notes:          form.notes,
        status:         'draft',
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [form, patientId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const inp = "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none w-full";

  // 3. 제출 시에만 드래프트 삭제
  const submit = () => {
    onSave({ patientId, date:form.date, type:form.type, chiefComplaint:form.chiefComplaint.trim(), vasRest:form.vasRest?parseFloat(form.vasRest):undefined, vasActive:form.vasActive?parseFloat(form.vasActive):undefined, notes:form.notes.trim(), status:'draft' });
    clearDraft(patientId, 'soap');
  };

  const hasDraft = getDraft(patientId, 'soap') !== null;

  return (
    <div className="rounded-xl border-2 border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/30 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">{lang==='ko'?'새 SOAP 세션':'New SOAP Session'}</p>
        {hasDraft && <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">{lang==='ko'?'임시저장됨':lang==='ja'?'下書き保存済':'Draft saved'}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.date}</label><input type="date" value={form.date} onChange={set('date')} className={inp}/></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.type}</label>
          <select value={form.type} onChange={set('type')} className={inp}>
            {(['initial','follow-up','discharge'] as SOAPRecord['type'][]).map(o=><option key={o} value={o}>{({'initial':t.initial,'follow-up':t.followUp,'discharge':t.discharge})[o]}</option>)}
          </select></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.vasR}</label><input type="number" min={0} max={10} value={form.vasRest} onChange={set('vasRest')} placeholder="0-10" className={inp}/></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.vasA}</label><input type="number" min={0} max={10} value={form.vasActive} onChange={set('vasActive')} placeholder="0-10" className={inp}/></div>
      </div>
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.cc}</label><input value={form.chiefComplaint} onChange={set('chiefComplaint')} className={inp}/></div>
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes</label><textarea rows={2} value={form.notes} onChange={set('notes')} className={`${inp} resize-none`}/></div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">{t.cancel}</button>
        <button onClick={submit} disabled={!form.chiefComplaint.trim()} className="rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-5 py-2 text-sm font-bold text-white">{t.save}</button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface Props { patientId:string; lang:Language; onBack:()=>void; }

export function PatientDetailView({ patientId, lang, onBack }: Props) {
  const t=T[lang];
  const { myPatients, addSession, recycleSession, recycleBiomarker, recycleROM, getDraft } = usePatient();
  const [tab,setTab]=useState<TabId>('soap');
  // 드래프트가 있으면 폼을 자동 복원
  const [showAddForm,setShowAddForm]=useState(() => getDraft(patientId,'soap') !== null);

  // 이 환자 데이터만 격리 로드 (독립 공간)
  const patient: Patient|undefined = myPatients.find(p=>p.id===patientId);
  if(!patient) return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{background:'var(--bg-app)'}}>
      <p className="text-slate-400">{lang==='ko'?'환자를 찾을 수 없습니다.':'Patient not found.'}</p>
      <button onClick={onBack} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-500">{t.back}</button>
    </div>
  );

  const soapList = [...patient.soapRecords].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const bioList  = [...patient.biomarkerRecords].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const romList  = [...patient.romAnalysis].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));

  const handleAddSession=(d:any)=>{ addSession(d); setShowAddForm(false); };

  const TABS: {id:TabId; icon:React.ReactNode; label:string; count:number}[] = [
    {id:'soap',    icon:<FileText size={14}/>,  label:t.tabSoap,  count:soapList.length},
    {id:'biomarker',icon:<Heart size={14}/>,    label:t.tabBio,   count:bioList.length},
    {id:'rom',     icon:<BarChart2 size={14}/>, label:t.tabRom,   count:romList.length},
  ];

  return (
    <div className="flex flex-col h-full" style={{background:'var(--bg-app)'}}>

      {/* ── 헤더 ── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft size={16}/> {t.back}
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{patient.name}</h2>
          <p className="text-xs text-slate-500">{patient.age}{lang==='ko'?'세':'y'} · {patient.condition}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <Activity size={14}/>
          <span>{soapList.length} SOAP · {bioList.length} Bio · {romList.length} ROM</span>
        </div>
        {tab==='soap'&&(
          <button onClick={()=>setShowAddForm(p=>!p)} className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-bold text-white transition-all shadow-sm">
            <Plus size={15}/> {t.newSession}
          </button>
        )}
      </div>

      {/* ── 탭 ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 shrink-0">
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${tab===tb.id?'border-sky-500 text-sky-600 dark:text-sky-400':'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tb.icon}<span>{tb.label}</span>
            {tb.count>0&&<span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-1.5 py-0.5">{tb.count}</span>}
          </button>
        ))}
      </div>

      {/* ── 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* SOAP 탭 */}
          {tab==='soap'&&(
            <>
              {showAddForm&&<AddSOAPForm patientId={patientId} lang={lang} onSave={handleAddSession} onCancel={()=>setShowAddForm(false)}/>}
              {soapList.length===0&&!showAddForm&&(
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 bg-white dark:bg-slate-900">
                  <FileText size={32} className="text-slate-300 dark:text-slate-600"/>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{t.noRecords}</p>
                  <button onClick={()=>setShowAddForm(true)} className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-bold text-white"><Plus size={15}/> {t.newSession}</button>
                </div>
              )}
              {soapList.map(r=><SOAPCard key={r.id} record={r} lang={lang} patientId={patientId} onDelete={id=>recycleSession(patientId,id)}/>)}
            </>
          )}

          {/* Biomarker 탭 */}
          {tab==='biomarker'&&(
            bioList.length===0
              ? <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 bg-white dark:bg-slate-900"><Heart size={32} className="text-slate-300 dark:text-slate-600"/><p className="text-slate-400 text-sm">{t.noRecords}</p></div>
              : <>{bioList.map(r=><BioCard key={r.id} record={r} lang={lang} onDelete={id=>recycleBiomarker(patientId,id)}/>)}</>
          )}

          {/* ROM 탭 */}
          {tab==='rom'&&(
            romList.length===0
              ? <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 bg-white dark:bg-slate-900"><BarChart2 size={32} className="text-slate-300 dark:text-slate-600"/><p className="text-slate-400 text-sm">{t.noRecords}</p></div>
              : <>{romList.map(r=><ROMCard key={r.id} record={r} lang={lang} onDelete={id=>recycleROM(patientId,id)}/>)}</>
          )}
        </div>
      </div>
    </div>
  );
}
