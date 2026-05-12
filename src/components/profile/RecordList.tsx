// ============================================================
//  RecordList — 환자별 전체 기록 목록 (소프트 삭제 지원)
//  SOAP / Biomarker / ROM 기록을 환자 단위로 그룹화하여 표시
//  window.confirm 미사용 — DeleteConfirmModal 사용
// ============================================================

import { useState } from 'react';
import { Trash2, FileText, Heart, BarChart2, ChevronDown, ChevronRight } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import type { SOAPRecord, BiomarkerRecord, ROMRecord } from '../../store/patientStore';
import type { Language } from '../../data/clinicalDB';

// ── 삭제 대상 식별자 ──────────────────────────────────────────

interface PendingDelete {
  patientId:  string;
  recordType: 'soapRecords' | 'biomarkerRecords' | 'romAnalysis';
  recordId:   string;
  label:      string;
}

// ── 레코드 행 ────────────────────────────────────────────────

function RecordRow({
  icon, label, sub, onDelete,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 group hover:border-slate-200 dark:hover:border-slate-700 transition-all">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>
      </div>
      <button
        onClick={onDelete}
        title="휴지통으로 이동 (15일 후 자동 영구 삭제)"
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
      >
        <Trash2 size={13}/>
      </button>
    </div>
  );
}

// ── 환자별 그룹 ──────────────────────────────────────────────

function PatientGroup({
  patientId, patientName, condition,
  soapRecords, biomarkerRecords, romAnalysis,
  lang, onRequestDelete,
}: {
  patientId:        string;
  patientName:      string;
  condition:        string;
  soapRecords:      SOAPRecord[];
  biomarkerRecords: BiomarkerRecord[];
  romAnalysis:      ROMRecord[];
  lang:             Language;
  onRequestDelete:  (p: PendingDelete) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = soapRecords.length + biomarkerRecords.length + romAnalysis.length;

  const TYPE: Record<string, string> = { 'initial': lang==='ko'?'초진':lang==='ja'?'初診':'Initial', 'follow-up': lang==='ko'?'재진':lang==='ja'?'再診':'Follow-up', 'discharge': lang==='ko'?'퇴원':lang==='ja'?'退院':'Discharge' };

  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
      >
        {open ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>}
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1 text-left">{patientName}</span>
        <span className="text-xs text-slate-400 mr-2">{condition}</span>
        <span className="rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5">{total}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-1.5">
          {soapRecords.map(r => (
            <RecordRow
              key={r.id}
              icon={<FileText size={13}/>}
              label={r.chiefComplaint || (lang==='ko'?'주호소 없음':'No CC')}
              sub={`${r.date} · ${TYPE[r.type]??r.type} · ${r.status==='draft'?(lang==='ko'?'초안':'Draft'):(lang==='ko'?'완료':'Done')}`}
              onDelete={() => onRequestDelete({ patientId, recordType:'soapRecords', recordId:r.id, label:`SOAP — ${r.chiefComplaint||r.date}` })}
            />
          ))}
          {biomarkerRecords.map(r => (
            <RecordRow
              key={r.id}
              icon={<Heart size={13} className="text-pink-400"/>}
              label={r.label}
              sub={`${r.date}${r.score!==undefined?` · ${r.score}/10`:''}`}
              onDelete={() => onRequestDelete({ patientId, recordType:'biomarkerRecords', recordId:r.id, label:`Bio — ${r.label}` })}
            />
          ))}
          {romAnalysis.map(r => (
            <RecordRow
              key={r.id}
              icon={<BarChart2 size={13} className="text-violet-400"/>}
              label={r.jointLabel}
              sub={`${r.date} · ROM`}
              onDelete={() => onRequestDelete({ patientId, recordType:'romAnalysis', recordId:r.id, label:`ROM — ${r.jointLabel} (${r.date})` })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 RecordList ───────────────────────────────────────────

const L = {
  ko: { title:'전체 임상 기록', sub:'환자별로 묶인 SOAP·바이오마커·ROM 기록입니다.', empty:'기록이 없습니다.', trashHint:'휴지통으로 이동 (15일 후 자동 영구 삭제)', delConfirmLabel:(l:string)=>`"${l}" 기록을 휴지통으로 이동합니다.` },
  ja: { title:'全臨床記録', sub:'患者別にまとめたSOAP·バイオマーカー·ROM記録です。', empty:'記録がありません。', trashHint:'ゴミ箱へ移動（15日後自動完全削除）', delConfirmLabel:(l:string)=>`「${l}」をゴミ箱へ移動します。` },
  en: { title:'All Clinical Records', sub:'SOAP, Biomarker, and ROM records grouped by patient.', empty:'No records found.', trashHint:'Move to Trash (auto-deleted after 15 days)', delConfirmLabel:(l:string)=>`Move "${l}" to Trash.` },
} as const;

export function RecordList({ lang }: { lang: Language }) {
  const { myPatients, recycleSession, recycleBiomarker, recycleROM } = usePatient();
  const t = L[lang];

  const [pending, setPending] = useState<PendingDelete | null>(null);

  const totalRecords = myPatients.reduce((s, p) =>
    s + p.soapRecords.length + p.biomarkerRecords.length + p.romAnalysis.length, 0);

  const handleConfirmDelete = () => {
    if (!pending) return;
    const { patientId, recordType, recordId } = pending;
    if (recordType === 'soapRecords')      recycleSession(patientId, recordId);
    else if (recordType === 'biomarkerRecords') recycleBiomarker(patientId, recordId);
    else if (recordType === 'romAnalysis') recycleROM(patientId, recordId);
    setPending(null);
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">📋 {t.title}</h3>
        {totalRecords > 0 && (
          <span className="rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 text-xs font-bold px-2 py-0.5">{totalRecords}</span>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500">{t.sub}</span>
      </div>

      {totalRecords === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center bg-white dark:bg-slate-900">
          <p className="text-slate-400 dark:text-slate-500 text-sm">{t.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myPatients.map(p => (
            <PatientGroup
              key={p.id}
              patientId={p.id}
              patientName={p.name}
              condition={p.condition}
              soapRecords={[...p.soapRecords].sort((a,b) => b.createdAt.localeCompare(a.createdAt))}
              biomarkerRecords={[...p.biomarkerRecords].sort((a,b) => b.createdAt.localeCompare(a.createdAt))}
              romAnalysis={[...p.romAnalysis].sort((a,b) => b.createdAt.localeCompare(a.createdAt))}
              lang={lang}
              onRequestDelete={setPending}
            />
          ))}
        </div>
      )}

      {pending && (
        <DeleteConfirmModal
          lang={lang}
          itemLabel={t.delConfirmLabel(pending.label)}
          onClose={() => setPending(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}

export default RecordList;
