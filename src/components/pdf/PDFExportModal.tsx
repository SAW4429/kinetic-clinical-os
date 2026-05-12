import { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { useUserAuth } from '../../context/UserAuthContext';
import { PrintLayout, type PrintSelections } from './PrintLayout';
import { writeSecureAudit } from '../../hooks/useSecureAudit';
import type { Language } from '../../data/clinicalDB';

const DEFAULT: PrintSelections = { patientInfo:true, soapChart:true, romAnalysis:true, cnsFatigue:false };
const KEYS: (keyof PrintSelections)[] = ['patientInfo','soapChart','romAnalysis','cnsFatigue'];

const L = {
  ko:{ title:'PDF 리포트 내보내기', sub:'출력할 항목을 선택하세요.', labels:{ patientInfo:'환자 기본 정보', soapChart:'SOAP 차팅', romAnalysis:'ROM 관절 분석', cnsFatigue:'CNS 피로도 추적' }, consent:'개인정보 포함 사실을 확인하였으며, 데이터 보안에 대한 책임을 이해하고 동의합니다.', print:'출력하기', cancel:'취소', hint:'동의 체크 후 출력이 가능합니다.', noPatient:'출력할 환자를 선택해 주세요.', selectPlaceholder:'환자 선택…' },
  ja:{ title:'PDFレポートエクスポート', sub:'印刷する項目を選択してください。', labels:{ patientInfo:'患者基本情報', soapChart:'SOAPチャート', romAnalysis:'ROM関節分析', cnsFatigue:'CNS疲労度' }, consent:'個人情報の含有を確認し、データセキュリティの責任を理解し同意します。', print:'印刷する', cancel:'キャンセル', hint:'同意チェック後に印刷可能です。', noPatient:'患者を選択してください。', selectPlaceholder:'患者を選択…' },
  en:{ title:'Export PDF Report', sub:'Select sections to include.', labels:{ patientInfo:'Patient Info', soapChart:'SOAP Chart', romAnalysis:'ROM Analysis', cnsFatigue:'CNS Fatigue' }, consent:'I confirm this document contains personal data and accept responsibility for its security.', print:'Print', cancel:'Cancel', hint:'Consent required before printing.', noPatient:'Please select a patient to export.', selectPlaceholder:'Select patient…' },
} as const;

export function PDFExportModal({ lang, onClose }: { lang: Language; onClose: () => void }) {
  const t = L[lang];
  const [sels,    setSels]    = useState<PrintSelections>(DEFAULT);
  const [consent, setConsent] = useState(false);
  const [printing,setPrinting]= useState(false);

  // currentPatient가 null일 수 있음 → myPatients + setCurrentPatient로 인라인 선택 UI 제공
  const { currentPatient, myPatients, setCurrentPatient } = usePatient();
  const { user } = useUserAuth();

  // patientStore 스키마: soapRecords 배열에서 최신 기록 직접 참조
  const chart = currentPatient
    ? [...currentPatient.soapRecords].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
    : undefined;

  const anySelected = Object.values(sels).some(Boolean);
  const canPrint    = !!currentPatient && anySelected && consent;

  const handlePrint = () => {
    if (!canPrint) return;
    setPrinting(true);
    if (user) writeSecureAudit(user.id, 'EXPORT_PDF', currentPatient!.id, 'chart', `sections: ${Object.entries(sels).filter(([,v])=>v).map(([k])=>k).join(',')}`);
    setTimeout(() => { window.print(); setTimeout(()=>setPrinting(false),1000); }, 200);
  };

  const chk = (k: keyof PrintSelections) => (
    <label key={k} className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${sels[k]?'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'}`}>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${sels[k]?'border-sky-500 bg-sky-500':'border-slate-300 dark:border-slate-600'}`}
        onClick={()=>setSels(p=>({...p,[k]:!p[k]}))}>
        {sels[k]&&<svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{(t.labels as any)[k]}</span>
    </label>
  );

  return (
    <>
      {/* 모달 UI — 인쇄 시 .no-print 로 숨겨짐 */}
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-5">
            <div><h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.title}</h2><p className="text-sm text-slate-500 mt-1">{t.sub}</p></div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl ml-4">✕</button>
          </div>

          {/* 환자 선택 — null이면 인라인 드롭다운으로 직접 선택 */}
          {currentPatient ? (
            <div className="rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-4 py-2.5 mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                📋 {currentPatient.name} · {currentPatient.age}{lang==='ko'?'세':'y'} · {currentPatient.condition}
              </span>
              <button onClick={()=>setCurrentPatient(null)} className="text-xs text-slate-400 hover:text-slate-600 ml-2">✕</button>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 mb-4">
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">⚠ {t.noPatient}</p>
              {myPatients.length > 0 ? (
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) setCurrentPatient(e.target.value); }}
                  className="w-full rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none"
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {myPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.condition})</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400">{lang==='ko'?'등록된 환자가 없습니다.':lang==='ja'?'患者がいません。':'No patients registered.'}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-5">{KEYS.map(chk)}</div>

          {/* 개인정보 동의 */}
          <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer mb-5 transition-all ${consent?'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 mt-0.5 ${consent?'border-amber-500 bg-amber-500':'border-slate-300 dark:border-slate-600'}`}
              onClick={()=>setConsent(p=>!p)}>
              {consent&&<svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{t.consent}</span>
          </label>

          {!consent && <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">⚠ {t.hint}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">{t.cancel}</button>
            <button onClick={handlePrint} disabled={!canPrint||printing}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-40 flex items-center justify-center gap-2">
              🖨 {printing?'…':t.print}
            </button>
          </div>
        </div>
      </div>

      {/* PrintLayout — #print-portal 포탈 (전용 인쇄 레이아웃) */}
      <PrintLayout
        selections={sels}
        patient={currentPatient}
        chart={chart}
        clinician={user ?? null}
        lang={lang}
      />
    </>
  );
}
export default PDFExportModal;
