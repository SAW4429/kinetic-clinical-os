// ============================================================
//  ClinicalDashboard — 역할별(Role-based) 대시보드
//  Student: 교육 콘텐츠 우선 / Practitioner: 임상 실무 우선
// ============================================================

import { useState } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { usePatient, type Patient, type ClinicalSession } from '../../context/PatientContext';
import { useAuth }       from '../../context/AuthContext';
import { useUserAuth }   from '../../context/UserAuthContext';
import { PDFExportModal } from '../pdf/PDFExportModal';
import type { Language } from '../../data/clinicalDB';

// ── ExportButton — 사용자 제시 패턴 ────────────────────────────
// print:hidden = Tailwind의 인쇄 시 숨김 유틸리티
// window.print() → @media print → .sidebar/.nav 제외, .printable-area 확장
const ExportButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 print:hidden transition-colors shadow-sm"
  >
    <Printer size={18} />
    <span>{label}</span>
  </button>
);

// ── 다국어 ────────────────────────────────────────────────────

const T = {
  ko:{
    greeting:(h:number)=>h<12?'좋은 아침입니다':h<18?'안녕하세요':'수고하셨습니다',
    role_student:'학생 모드', role_practitioner:'임상가 모드', role_other:'일반 모드',
    // 학생 섹션
    studyTitle:'학습 우선 콘텐츠',
    studyCards:[
      { icon:'⚗', title:'병태생리 메커니즘', desc:'mTOR, PGC-1α, NMJ 등 8가지 분자 수준 기전 학습', tab:'mechanism' },
      { icon:'→', title:'임상 프로세스 실습', desc:'6단계 워크플로우를 화면에서 직접 따라가며 학습', tab:'flow' },
      { icon:'📋', title:'기초 SOAP 차팅', desc:'스포츠 재활 차팅 기초 템플릿 연습', tab:'soap' },
    ],
    // 임상가 섹션
    today:'오늘 예약 환자', noToday:'오늘 예약된 환자가 없습니다.',
    recent:'최근 열람 차트', noRecent:'최근 열람 차트가 없습니다.',
    draft:'미완성 차팅', noDraft:'미완성 차팅이 없습니다.',
    addPt:'환자 등록', pdfExport:'PDF 리포트 내보내기',
    // 공통
    sessions:'세션', lastVisit:'최근 방문',
    openChart:'차트 열기', addSession:'+세션',
    initial:'초진', followUp:'재진', discharge:'퇴원',
    stats_patients:'등록 환자', stats_today:'오늘 예약', stats_draft:'미완성', stats_total:'전체 세션',
    name:'이름', age:'나이', gender:'성별', condition:'주호소/진단', phone:'연락처', nextVisit:'다음 예약일',
    M:'남', F:'여', other:'기타', save:'저장', cancel:'취소',
  },
  ja:{
    greeting:(h:number)=>h<12?'おはようございます':h<18?'こんにちは':'お疲れ様です',
    role_student:'学生モード', role_practitioner:'臨床家モード', role_other:'一般モード',
    studyTitle:'学習優先コンテンツ',
    studyCards:[
      { icon:'⚗', title:'病態生理メカニズム', desc:'mTOR・PGC-1α・NMJなど8つの分子レベル機序を学習', tab:'mechanism' },
      { icon:'→', title:'臨床プロセス実習', desc:'6ステップワークフローを画面で直接追いながら学習', tab:'flow' },
      { icon:'📋', title:'基礎SOAPチャート', desc:'スポーツリハ基礎チャートテンプレートの練習', tab:'soap' },
    ],
    today:'本日予約患者', noToday:'本日の予約患者はいません。',
    recent:'最近閲覧チャート', noRecent:'最近閲覧チャートはありません。',
    draft:'未完成チャート', noDraft:'未完成チャートはありません。',
    addPt:'患者登録', pdfExport:'PDFレポートエクスポート',
    sessions:'セッション', lastVisit:'最終来院',
    openChart:'チャートを開く', addSession:'+セッション',
    initial:'初診', followUp:'再診', discharge:'退院',
    stats_patients:'登録患者', stats_today:'本日予約', stats_draft:'未完成', stats_total:'総セッション',
    name:'氏名', age:'年齢', gender:'性別', condition:'主訴/診断', phone:'連絡先', nextVisit:'次回予約日',
    M:'男', F:'女', other:'その他', save:'保存', cancel:'キャンセル',
  },
  en:{
    greeting:(h:number)=>h<12?'Good morning':h<18?'Good afternoon':'Good evening',
    role_student:'Student Mode', role_practitioner:'Practitioner Mode', role_other:'General Mode',
    studyTitle:'Learning-Priority Content',
    studyCards:[
      { icon:'⚗', title:'Pathophysiology Mechanisms', desc:'Study 8 molecular-level mechanisms: mTOR, PGC-1α, NMJ and more', tab:'mechanism' },
      { icon:'→', title:'Clinical Process Practice', desc:'Follow the 6-step clinical workflow interactively on screen', tab:'flow' },
      { icon:'📋', title:'Basic SOAP Charting', desc:'Practice the sports rehabilitation basic SOAP template', tab:'soap' },
    ],
    today:"Today's Patients", noToday:'No appointments scheduled for today.',
    recent:'Recently Viewed', noRecent:'No recently viewed charts.',
    draft:'Incomplete Charts', noDraft:'No incomplete charts.',
    addPt:'Add Patient', pdfExport:'Export PDF Report',
    sessions:'Sessions', lastVisit:'Last Visit',
    openChart:'Open Chart', addSession:'+Session',
    initial:'Initial', followUp:'Follow-up', discharge:'Discharge',
    stats_patients:'Patients', stats_today:"Today's Appts", stats_draft:'Incomplete', stats_total:'Total Sessions',
    name:'Name', age:'Age', gender:'Gender', condition:'Chief Complaint', phone:'Phone', nextVisit:'Next Visit',
    M:'Male', F:'Female', other:'Other', save:'Save', cancel:'Cancel',
  },
} as const;

// ── 환자 등록 모달 ────────────────────────────────────────────

function AddPatientModal({ lang, onClose }:{ lang:Language; onClose:()=>void }) {
  const t = T[lang];
  const { addPatient } = usePatient();
  const [form, setForm] = useState({ name:'', age:'', gender:'M' as 'M'|'F'|'other', condition:'', phone:'', nextVisit:'' });
  const set = (k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value}));
  const submit=()=>{ if(!form.name||!form.age)return; addPatient({name:form.name,age:parseInt(form.age),gender:form.gender,condition:form.condition,phone:form.phone,nextVisitDate:form.nextVisit||undefined}); onClose(); };
  const fields=[{k:'name',lb:t.name,type:'text',ph:lang==='ko'?'홍길동':'John Doe'},{k:'age',lb:t.age,type:'number',ph:'25'},{k:'condition',lb:t.condition,type:'text',ph:lang==='ko'?'예: ACL 부분 파열':'e.g. ACL partial tear'},{k:'phone',lb:t.phone,type:'tel',ph:'010-0000-0000'},{k:'nextVisit',lb:t.nextVisit,type:'date',ph:''}];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">{t.addPt}</h3>
        <div className="flex flex-col gap-3">
          {fields.map(f=>(
            <div key={f.k} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{f.lb}</label>
              <input type={f.type} value={(form as any)[f.k]} onChange={set(f.k as any)} placeholder={f.ph} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none"/>
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.gender}</label>
            <select value={form.gender} onChange={set('gender')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none">
              <option value="M">{t.M}</option><option value="F">{t.F}</option><option value="other">{t.other}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">{t.cancel}</button>
          <button onClick={submit} className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-500">{t.save}</button>
        </div>
      </div>
    </div>
  );
}

// ── 세션 추가 모달 ────────────────────────────────────────────

function AddSessionModal({ patientId, lang, onClose }:{ patientId:string; lang:Language; onClose:()=>void }) {
  const t=T[lang]; const { addSession }=usePatient();
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),type:'follow-up' as ClinicalSession['type'],chiefComplaint:'',vasRest:'',vasActive:''});
  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value}));
  const submit=()=>{ addSession({patientId,date:form.date,type:form.type,chiefComplaint:form.chiefComplaint,vasRest:form.vasRest?parseFloat(form.vasRest):undefined,vasActive:form.vasActive?parseFloat(form.vasActive):undefined,status:'draft'}); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">{t.addSession}</h3>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?'날짜':'Date'}</label><input type="date" value={form.date} onChange={set('date')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"/></div>
            <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?'유형':'Type'}</label><select value={form.type} onChange={set('type')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"><option value="initial">{t.initial}</option><option value="follow-up">{t.followUp}</option><option value="discharge">{t.discharge}</option></select></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?'주호소':'Chief Complaint'}</label><textarea rows={2} value={form.chiefComplaint} onChange={set('chiefComplaint')} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none resize-none"/></div>
        </div>
        <div className="flex gap-3 mt-5"><button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">{t.cancel}</button><button onClick={submit} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">{t.save}</button></div>
      </div>
    </div>
  );
}

// ── 환자 카드 ────────────────────────────────────────────────

function PatientCard({ patient, sessions, lang, onAddSession, onOpenChart }:{
  patient:Patient; sessions:ClinicalSession[]; lang:Language;
  onAddSession:(id:string)=>void;
  onOpenChart:(id:string)=>void;    // 환자별 독립 차팅 공간으로 이동
}) {
  const t=T[lang];
  const { markViewed, recyclePatient }=usePatient();
  const draftCount=sessions.filter(s=>s.status==='draft').length;
  const lastSession=sessions[0];

  const handleOpen=()=>{ markViewed(patient.id); onOpenChart(patient.id); };

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 hover:border-sky-300 dark:hover:border-sky-800 transition-all group">
      {/* 휴지통 아이콘 (우측 상단) */}
      <button
        onClick={()=>recyclePatient(patient.id)}
        title={lang==='ko'?'휴지통으로 이동':lang==='ja'?'ゴミ箱へ移動':'Move to Trash'}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
      >
        <Trash2 size={14}/>
      </button>

      <div className="flex items-start justify-between gap-2 pr-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">{patient.name}</span>
            <span className="text-xs text-slate-500">{patient.age}{lang==='ko'?'세':lang==='ja'?'歳':' yrs'} {t[patient.gender]}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{patient.condition}</p>
        </div>
        {draftCount>0&&<span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">Draft ×{draftCount}</span>}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
        <span>{t.sessions}: {sessions.length}</span>
        {lastSession&&<span>{t.lastVisit}: {lastSession.date}</span>}
        {patient.nextVisitDate&&<span className="text-sky-600 dark:text-sky-400 font-semibold">→ {patient.nextVisitDate}</span>}
      </div>
      <div className="flex gap-2">
        {/* 차트 열기 → onOpenChart(patient.id) 호출 */}
        <button onClick={handleOpen} className="flex-1 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 py-2 text-sm font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all">{t.openChart}</button>
        <button onClick={()=>onAddSession(patient.id)} className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all">{t.addSession}</button>
      </div>
    </div>
  );
}

// ── 메인 대시보드 ─────────────────────────────────────────────

interface Props { lang?:Language; onNavigateToTab?:(tab:string)=>void; onOpenChart?:(patientId:string)=>void; }

export function ClinicalDashboard({ lang='ko', onNavigateToTab, onOpenChart }:Props) {
  const t = T[lang];
  const { myPatients, mySessions, todayPatients, recentPatients, draftSessions,
          getPatientSessions, updateSession } = usePatient();
  const { user, isExpert } = useAuth();  // isExpert: 전문가 코드 보유 여부
  const [showAddPt, setShowAddPt] = useState(false);
  const [addSessionFor, setAddSessionFor] = useState<string|null>(null);
  const [showPDF, setShowPDF] = useState(false);

  const hour    = new Date().getHours();
  const nowStr  = new Date().toLocaleDateString(lang==='ko'?'ko-KR':lang==='ja'?'ja-JP':'en-US',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const role    = user?.role ?? 'other';
  const roleLabel = t[`role_${role}` as keyof typeof t] as string;
  // PDF 버튼: 전문가 코드 보유자 OR practitioner 역할 모두에게 표시
  const showPDFBtn = isExpert || role === 'practitioner';

  const STATS=[
    { lb:t.stats_patients, val:myPatients.length, color:'text-sky-600 dark:text-sky-400', bg:'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
    { lb:t.stats_today,    val:todayPatients.length, color:'text-violet-600 dark:text-violet-400', bg:'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
    { lb:t.stats_draft,    val:draftSessions.length, color:'text-amber-600 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    { lb:t.stats_total,    val:mySessions.length, color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  ];

  return (
    <div className="p-4 md:p-6 min-h-full printable-area" style={{ background: 'var(--bg-app)' }}>
      <div className="content-wrap flex flex-col gap-8">

        {/* ── 헤더 ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{nowStr}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t.greeting(hour)}{user && `, ${user.name}`}
            </h1>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${role==='student'?'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700':role==='practitioner'?'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700':'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
              {roleLabel}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            {showPDFBtn && (
              <ExportButton
                onClick={() => setShowPDF(true)}
                label={t.pdfExport}
              />
            )}
            <button onClick={()=>setShowAddPt(true)} className="flex items-center gap-1.5 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-500 shadow-lg shadow-sky-200 dark:shadow-sky-900/40 transition-all">
              + {t.addPt}
            </button>
          </div>
        </div>

        {/* ── 통계 ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s,i)=>(
            <div key={i} className={`rounded-2xl border p-5 ${s.bg}`}>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{s.lb}</p>
              <p className={`mt-2 text-3xl font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* ══ STUDENT: 학습 콘텐츠 최우선 ════════════════════════ */}
        {role === 'student' && (
          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              🎓 {t.studyTitle}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {t.studyCards.map((c,i)=>(
                <button key={i} onClick={()=>onNavigateToTab?.(c.tab)}
                  className="group text-left rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all">
                  <span className="text-2xl mb-3 block">{c.icon}</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{c.desc}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══ PRACTITIONER: 오늘 예약 최우선 ══════════════════════ */}
        {role === 'practitioner' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                📅 {t.today}
                {todayPatients.length>0&&<span className="rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-400 text-xs font-bold px-2 py-0.5">{todayPatients.length}</span>}
              </h2>
            </div>
            {todayPatients.length===0?(
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-10 text-center">
                <p className="text-slate-400 dark:text-slate-500 text-sm">{t.noToday}</p>
              </div>
            ):(
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {todayPatients.map(p=><PatientCard key={p.id} patient={p} sessions={getPatientSessions(p.id)} lang={lang} onAddSession={setAddSessionFor} onOpenChart={id=>onOpenChart?.(id)}/>)}
              </div>
            )}
          </section>
        )}

        {/* ── 미완성 차팅 ── */}
        {draftSessions.length>0&&(
          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              ⚠️ {t.draft}
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5">{draftSessions.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {draftSessions.slice(0,5).map(s=>{
                const pt=myPatients.find(p=>p.id===s.patientId);
                return (
                  <div key={s.id} className="flex items-start gap-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{pt?.name??'—'}</span>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300">{s.type}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{s.chiefComplaint||'—'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{s.date}</p>
                    </div>
                    <button onClick={()=>{ updateSession(s.id,{status:'complete'}); }} className="shrink-0 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50">
                      {lang==='ko'?'완료':lang==='ja'?'完了':'Done'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 최근 열람 차트 ── */}
        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            🕐 {t.recent}
          </h2>
          {recentPatients.length===0?(
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-10 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm">{t.noRecent}</p>
            </div>
          ):(
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPatients.map(p=><PatientCard key={p.id} patient={p} sessions={getPatientSessions(p.id)} lang={lang} onAddSession={setAddSessionFor} onOpenChart={id=>onOpenChart?.(id)}/>)}
            </div>
          )}
        </section>

        {/* ── 전체 환자 ── */}
        {myPatients.length>0&&myPatients.some(p=>!recentPatients.find(r=>r.id===p.id))&&(
          <section>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{lang==='ko'?'전체 환자 목록':lang==='ja'?'全患者リスト':'All Patients'}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myPatients.filter(p=>!recentPatients.find(r=>r.id===p.id)).map(p=><PatientCard key={p.id} patient={p} sessions={getPatientSessions(p.id)} lang={lang} onAddSession={setAddSessionFor} onOpenChart={id=>onOpenChart?.(id)}/>)}
            </div>
          </section>
        )}

      </div>

      {showAddPt&&<AddPatientModal lang={lang} onClose={()=>setShowAddPt(false)}/>}
      {addSessionFor&&<AddSessionModal patientId={addSessionFor} lang={lang} onClose={()=>setAddSessionFor(null)}/>}
      {showPDF&&<PDFExportModal lang={lang} onClose={()=>setShowPDF(false)}/>}
    </div>
  );
}

export default ClinicalDashboard;
