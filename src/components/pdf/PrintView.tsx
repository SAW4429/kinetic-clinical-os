// ============================================================
//  PrintView — @media print 전용 A4 출력 뷰
//  #print-portal에 포탈 렌더링 → 화면 UI 완전 분리
// ============================================================

import { createPortal } from 'react-dom';
import type { AppUser } from '../../context/AuthContext';
import type { Patient } from '../../context/PatientContext';
import type { ChartRecord } from '../../context/ChartContext';
import { ROM_JOINTS } from '../../data/clinicalDB';
import type { Language } from '../../data/clinicalDB';

export interface PrintSections {
  patientInfo: boolean;
  soapChart:   boolean;
  romAnalysis: boolean;
  cnsFatigue:  boolean;
}

const ROW = ({ label, val }: { label: string; val?: string | number }) => (
  <div style={{ display:'flex', gap:'12px', marginBottom:'7px', fontSize:'11.5px', lineHeight:'1.5' }}>
    <span style={{ minWidth:'130px', fontWeight:600, color:'#374151', flexShrink:0 }}>{label}</span>
    <span style={{ color:'#111827' }}>{val ?? '—'}</span>
  </div>
);

const SECT = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom:'22px', pageBreakInside:'avoid', breakInside:'avoid' }}>
    <div style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'7px 14px', marginBottom:'10px' }}>
      <span style={{ fontSize:'11px', fontWeight:800, color:'#111827', textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
    </div>
    <div style={{ paddingLeft:'4px' }}>{children}</div>
  </div>
);

export function PrintView({ selections, patient, chart, user, lang }: {
  selections: PrintSections;
  patient?:   Patient | null;
  chart?:     ChartRecord;
  user:       AppUser | null;
  lang:       Language;
}) {
  const portal = document.getElementById('print-portal');
  if (!portal) return null;

  const date      = new Date().toLocaleDateString(lang==='ko'?'ko-KR':lang==='ja'?'ja-JP':'en-US', { year:'numeric',month:'long',day:'numeric' });
  const clinician = user ? `${user.name}  (${user.organization||user.school})` : '';

  return createPortal(
    <div style={{ fontFamily:"'Noto Sans KR','Segoe UI',Arial,sans-serif", maxWidth:'190mm', margin:'0 auto', padding:'12mm 14mm 18mm', color:'#111827', background:'#fff', fontSize:'12px' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', borderBottom:'2.5px solid #111827', paddingBottom:'10px', marginBottom:'18px' }}>
        <div>
          <div style={{ fontSize:'17px', fontWeight:900, color:'#111827', letterSpacing:'-0.02em' }}>Kinetic Clinical OS</div>
          <div style={{ fontSize:'10px', color:'#6b7280', marginTop:'3px' }}>Sports Medicine Clinical Report</div>
        </div>
        <div style={{ textAlign:'right', fontSize:'10px', color:'#6b7280', lineHeight:'1.6' }}>
          <div style={{ fontWeight:600, color:'#374151' }}>{clinician}</div>
          <div>{date}</div>
          <div style={{ color:'#9ca3af', fontSize:'9px' }}>CONFIDENTIAL — Do not share</div>
        </div>
      </div>

      {/* ── 환자 기본 정보 ── */}
      {selections.patientInfo && patient && (
        <SECT title={lang==='ko'?'환자 기본 정보':lang==='ja'?'患者基本情報':'Patient Information'}>
          <ROW label={lang==='ko'?'이름':'Name'} val={patient.name}/>
          <ROW label={lang==='ko'?'나이':'Age'}  val={`${patient.age}${lang==='ko'?'세':'y'}`}/>
          <ROW label={lang==='ko'?'성별':'Gender'} val={patient.gender}/>
          <ROW label={lang==='ko'?'주호소':'Condition'} val={patient.condition}/>
          {patient.phone && <ROW label={lang==='ko'?'연락처':'Phone'} val={patient.phone}/>}
          {chart && <ROW label={lang==='ko'?'최근 방문':'Last Visit'} val={chart.date}/>}
        </SECT>
      )}

      {/* ── SOAP ── */}
      {selections.soapChart && chart && (
        <SECT title="SOAP Chart">
          <ROW label="Date"   val={chart.date}/>
          <ROW label="Type"   val={chart.type}/>
          <ROW label={lang==='ko'?'주호소':'Chief Complaint'} val={chart.chiefComplaint}/>
          <ROW label={lang==='ko'?'VAS 안정':'VAS Rest'}   val={chart.vasRest}/>
          <ROW label={lang==='ko'?'VAS 활동':'VAS Active'} val={chart.vasActive}/>
          <ROW label="Status" val={chart.status}/>
          {chart.notes && <ROW label="Notes" val={chart.notes}/>}
        </SECT>
      )}

      {/* ── ROM ── */}
      {selections.romAnalysis && (
        <SECT title={lang==='ko'?'ROM 관절 각도 측정':'ROM Analysis'}>
          {ROM_JOINTS.map(j => (
            <div key={j.id} style={{ marginBottom:'12px' }}>
              <div style={{ fontSize:'10.5px', fontWeight:700, color:'#374151', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{j.label[lang]}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'5px' }}>
                {j.movements.map(mv => (
                  <div key={mv.id} style={{ border:'1px solid #e5e7eb', borderRadius:'5px', padding:'6px 8px', fontSize:'10.5px' }}>
                    <div style={{ color:'#6b7280', marginBottom:'2px' }}>{mv.label[lang]}</div>
                    <div style={{ fontWeight:700 }}>____ ° <span style={{ color:'#9ca3af', fontWeight:400 }}>({mv.normalMin}–{mv.normalMax}°)</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </SECT>
      )}

      {/* ── CNS ── */}
      {selections.cnsFatigue && (
        <SECT title={lang==='ko'?'CNS 피로도 기록':'CNS Fatigue Log'}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px', fontSize:'11px' }}>
            {[lang==='ko'?'날짜':'Date', lang==='ko'?'악력(kg)':'Grip(kg)', lang==='ko'?'수직점프(cm)':'VJ(cm)'].map((h,i)=>(
              <div key={i} style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'4px', padding:'6px 8px', fontWeight:700, color:'#374151' }}>{h}</div>
            ))}
            {Array(6).fill(0).flatMap((_,i)=>[0,1,2].map(j=>(
              <div key={`${i}-${j}`} style={{ border:'1px solid #e5e7eb', borderRadius:'4px', minHeight:'26px' }}/>
            )))}
          </div>
        </SECT>
      )}

      {/* ── 서명란 ── */}
      <div style={{ marginTop:'36px', display:'flex', gap:'40px' }}>
        {[lang==='ko'?'담당 치료사 서명':lang==='ja'?'担当療法士署名':'Clinician', lang==='ko'?'환자 / 보호자 서명':lang==='ja'?'患者署名':'Patient'].map((label,i) => (
          <div key={i} style={{ flex:1, borderTop:'1px solid #111827', paddingTop:'8px', fontSize:'10px', color:'#6b7280' }}>{label}</div>
        ))}
      </div>

      {/* ── 출력 날짜 footer ── */}
      <div style={{ marginTop:'20px', fontSize:'9px', color:'#9ca3af', textAlign:'center' }}>
        Kinetic Clinical OS — Generated {date} — Confidential
      </div>
    </div>,
    portal,
  );
}
