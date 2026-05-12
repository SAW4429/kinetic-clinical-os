// ============================================================
//  PrintLayout — 전용 인쇄 레이아웃 (헤더 반복 · 페이지 번호 · 작성자)
//  이 컴포넌트는 #print-portal에 포탈로 렌더링되며
//  @media print 시에만 표시됨
// ============================================================
import { createPortal } from 'react-dom';
import type { RegisteredUser } from '../../context/UserAuthContext';
import type { Patient } from '../../context/PatientContext';
import type { SOAPRecord } from '../../store/patientStore';
import { ROM_JOINTS, type Language } from '../../data/clinicalDB';

// ── 인쇄용 스타일 상수 ────────────────────────────────────────

const S = {
  page:    { fontFamily:'ui-sans-serif,system-ui,sans-serif', maxWidth:'210mm', margin:'0 auto', padding:'15mm 15mm 20mm', color:'#0f172a', background:'white', fontSize:'12px' },
  header:  { display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'2px solid #0f172a', paddingBottom:'10px', marginBottom:'16px', pageBreakAfter:'avoid' as const },
  logo:    { fontSize:'16px', fontWeight:900, color:'#0f172a' },
  meta:    { fontSize:'10px', color:'#64748b', textAlign:'right' as const },
  section: { marginBottom:'20px', pageBreakInside:'avoid' as const },
  sectHdr: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'8px 12px', marginBottom:'10px', fontSize:'11px', fontWeight:800, color:'#0f172a', textTransform:'uppercase' as const, letterSpacing:'0.05em' },
  row:     { display:'flex', gap:'10px', marginBottom:'6px', fontSize:'11px' },
  label:   { minWidth:'110px', fontWeight:600, color:'#475569', flexShrink:0 },
  value:   { color:'#0f172a' },
  grid:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' },
  cell:    { border:'1px solid #e2e8f0', borderRadius:'5px', padding:'5px 7px', fontSize:'11px' },
  footer:  { position:'fixed' as const, bottom:'12mm', left:'15mm', right:'15mm', display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#94a3b8', borderTop:'1px solid #e2e8f0', paddingTop:'6px' },
};

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={S.section}>
      <div style={S.sectHdr}>{title}</div>
      {children}
    </div>
  );
}

function PageHeader({ clinician, date }: { clinician: string; date: string }) {
  return (
    <div style={S.header}>
      <div style={S.logo}>Kinetic Clinical OS<br/><span style={{ fontSize:'9px', fontWeight:400, color:'#64748b' }}>Sports Medicine Clinical Platform</span></div>
      <div style={S.meta}>
        <div>{clinician}</div>
        <div>{date}</div>
        <div style={{ color:'#94a3b8' }}>Confidential — Clinical Record</div>
      </div>
    </div>
  );
}

// ── 섹션 컴포넌트 ─────────────────────────────────────────────

function PatientInfoSection({ patient, chart, lang }: { patient: Patient; chart?: SOAPRecord; lang: Language }) {
  return (
    <Section title={lang==='ko'?'환자 기본 정보':lang==='ja'?'患者基本情報':'Patient Information'}>
      <Row label={lang==='ko'?'이름':'Name'} value={patient.name}/>
      <Row label={lang==='ko'?'나이':'Age'} value={`${patient.age}${lang==='ko'?'세':'y'}`}/>
      <Row label={lang==='ko'?'성별':'Gender'} value={patient.gender}/>
      <Row label={lang==='ko'?'주호소':'Condition'} value={patient.condition}/>
      {patient.phone && <Row label={lang==='ko'?'연락처':'Phone'} value={patient.phone}/>}
      {chart && <Row label={lang==='ko'?'최근 방문':'Last Visit'} value={chart.date}/>}
    </Section>
  );
}

function SOAPSection({ chart, lang }: { chart: SOAPRecord; lang: Language }) {
  return (
    <Section title="SOAP Chart">
      <Row label="Date" value={chart.date}/>
      <Row label="Type" value={chart.type}/>
      <Row label={lang==='ko'?'주호소':'Chief Complaint'} value={chart.chiefComplaint}/>
      <Row label={lang==='ko'?'VAS 안정':'VAS Rest'} value={chart.vasRest}/>
      <Row label={lang==='ko'?'VAS 활동':'VAS Active'} value={chart.vasActive}/>
      <Row label="Status" value={chart.status}/>
      {chart.notes && <Row label="Notes" value={chart.notes}/>}
    </Section>
  );
}

function ROMSection({ lang }: { lang: Language }) {
  return (
    <Section title={lang==='ko'?'ROM 관절 각도 측정':'ROM Measurement'}>
      {ROM_JOINTS.map(joint => (
        <div key={joint.id} style={{ marginBottom:'12px' }}>
          <div style={{ fontSize:'10px', fontWeight:700, color:'#475569', marginBottom:'6px', textTransform:'uppercase' }}>
            {joint.label[lang]}
          </div>
          <div style={S.grid}>
            {joint.movements.map(mv => (
              <div key={mv.id} style={S.cell}>
                <div style={{ color:'#64748b', marginBottom:'2px', fontSize:'10px' }}>{mv.label[lang]}</div>
                <div style={{ fontWeight:700 }}>
                  ____ ° <span style={{ color:'#94a3b8', fontWeight:400 }}>({mv.normalMin}–{mv.normalMax}°)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

function CNSSection({ lang }: { lang: Language }) {
  return (
    <Section title={lang==='ko'?'CNS 피로도 추적':'CNS Fatigue Log'}>
      <div style={S.grid}>
        {[lang==='ko'?'날짜':'Date', lang==='ko'?'악력 (kg)':'Grip (kg)', lang==='ko'?'수직 점프 (cm)':'V. Jump (cm)'].map((h, i) => (
          <div key={i} style={{ ...S.cell, fontWeight:700, color:'#475569', background:'#f8fafc' }}>{h}</div>
        ))}
        {Array(5).fill(0).flatMap((_, i) =>
          [0,1,2].map(j => <div key={`${i}-${j}`} style={{ ...S.cell, minHeight:'24px' }}/>)
        )}
      </div>
    </Section>
  );
}

// ── 서명란 ───────────────────────────────────────────────────

function SignatureRow({ lang }: { lang: Language }) {
  return (
    <div style={{ marginTop:'32px', display:'flex', gap:'40px' }}>
      <div style={{ flex:1, borderTop:'1px solid #0f172a', paddingTop:'8px', fontSize:'10px', color:'#64748b' }}>
        {lang==='ko'?'담당 치료사 서명':lang==='ja'?'担当療法士署名':'Clinician Signature'}
      </div>
      <div style={{ flex:1, borderTop:'1px solid #0f172a', paddingTop:'8px', fontSize:'10px', color:'#64748b' }}>
        {lang==='ko'?'환자 / 보호자 서명':lang==='ja'?'患者/保護者署名':'Patient / Guardian Signature'}
      </div>
    </div>
  );
}

// ── 메인 PrintLayout ─────────────────────────────────────────

export interface PrintSelections {
  patientInfo: boolean;
  soapChart:   boolean;
  romAnalysis: boolean;
  cnsFatigue:  boolean;
}

interface Props {
  selections: PrintSelections;
  patient?:   Patient | null;
  chart?:     SOAPRecord;
  clinician:  RegisteredUser | null;
  lang:       Language;
}

export function PrintLayout({ selections, patient, chart, clinician, lang }: Props) {
  const portal = document.getElementById('print-portal');
  if (!portal) return null;

  const dateStr    = new Date().toLocaleDateString(lang==='ko'?'ko-KR':lang==='ja'?'ja-JP':'en-US', { year:'numeric', month:'long', day:'numeric' });
  const clinicianStr = clinician ? `${clinician.name} (${clinician.organization || clinician.school})` : '';

  return createPortal(
    <div style={S.page}>
      {/* 페이지 헤더 (인쇄 시 반복) */}
      <PageHeader clinician={clinicianStr} date={dateStr}/>

      {/* 선택된 섹션 */}
      {selections.patientInfo && patient && (
        <PatientInfoSection patient={patient} chart={chart} lang={lang}/>
      )}
      {selections.soapChart && chart && (
        <SOAPSection chart={chart} lang={lang}/>
      )}
      {selections.romAnalysis && (
        <ROMSection lang={lang}/>
      )}
      {selections.cnsFatigue && (
        <CNSSection lang={lang}/>
      )}

      {/* 서명란 */}
      <SignatureRow lang={lang}/>

      {/* 푸터 (페이지 번호 영역) */}
      <div style={S.footer}>
        <span>Kinetic Clinical OS — Confidential</span>
        <span>Page <span className="page-number">1</span></span>
      </div>
    </div>,
    portal,
  );
}
