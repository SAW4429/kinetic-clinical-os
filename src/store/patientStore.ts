// ============================================================
//  patientStore.ts — 사용자 제시 스키마 구현
//  storage key: 'kinetic_patients' (사용자 제시 패턴)
//  모든 기록을 환자 객체 내부 배열로 귀속 관리
// ============================================================

// ── 레코드 타입 ───────────────────────────────────────────────

export interface SOAPRecord {
  id:             string;
  createdAt:      string;   // ISO string
  date:           string;   // YYYY-MM-DD
  type:           'initial' | 'follow-up' | 'discharge';
  chiefComplaint: string;
  vasRest?:       number;
  vasActive?:     number;
  notes?:         string;
  status:         'draft' | 'complete';
}

export interface BiomarkerRecord {
  id:        string;
  createdAt: string;
  date:      string;
  subtype:   'recovery' | 'mps' | 'cns' | 'general';
  label:     string;       // 표시명 (예: "회복 바이오마커 분석 (점수: 7/10)")
  score?:    number;
  data:      Record<string, string | number | undefined>;
}

export interface ROMRecord {
  id:         string;
  createdAt:  string;
  date:       string;
  jointId:    string;
  jointLabel: string;
  values:     { movementId: string; movementLabel: string; measured: number; normalMin: number; normalMax: number }[];
}

export interface PatientDrafts {
  soap:     Partial<Omit<SOAPRecord,'id'|'createdAt'>> | null;
  mps:      Record<string, string | number> | null;
  recovery: Record<string, string | number> | null;
}

// ── 환자 객체 (사용자 제시 스키마) ───────────────────────────

export interface PatientRecord {
  id:            string;
  ownerId:       string;
  name:          string;
  age:           number;
  gender:        'M' | 'F' | 'other';
  condition:     string;
  phone?:        string;
  notes?:        string;
  createdAt:     string;
  nextVisitDate?: string;
  deletedAt?:    number;   // RecycleBin: 소프트 삭제 타임스탬프

  // 모든 기록을 환자 객체 내부에 귀속 (사용자 제시 패턴)
  soapRecords:      SOAPRecord[];
  biomarkerRecords: BiomarkerRecord[];
  romAnalysis:      ROMRecord[];
  drafts:           PatientDrafts;
}

// ── RecycleBin 아이템 ─────────────────────────────────────────

export interface BinItem {
  id:          string;
  type:        'patient' | 'soap' | 'biomarker' | 'rom';
  ownerId:     string;
  displayName: string;
  deletedAt:   number;
  data:        unknown;
}

// ── 스토리지 키 ───────────────────────────────────────────────

export const STORAGE_KEY     = 'kinetic_patients';     // 사용자 제시 키
export const RECYCLE_KEY     = 'kinetic_recycle_bin';
export const RECYCLE_TTL_MS  = 15 * 24 * 60 * 60 * 1000; // 15일

// ── 원시 I/O ─────────────────────────────────────────────────

// ── Self-Healing 레코드 검증 ──────────────────────────────────

function healPatient(p: unknown): PatientRecord | null {
  if (!p || typeof p !== 'object') return null;
  const r = p as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.ownerId !== 'string') return null;
  // 필수 배열 누락 시 기본값으로 복구 (Self-Healing)
  return {
    ...r,
    soapRecords:      Array.isArray(r.soapRecords)      ? r.soapRecords      : [],
    biomarkerRecords: Array.isArray(r.biomarkerRecords) ? r.biomarkerRecords : [],
    romAnalysis:      Array.isArray(r.romAnalysis)      ? r.romAnalysis      : [],
    drafts:           (r.drafts && typeof r.drafts === 'object')
                        ? r.drafts as PatientRecord['drafts']
                        : { soap: null, mps: null, recovery: null },
  } as PatientRecord;
}

export function getAllPatients(): PatientRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // 배열이 아니면 Self-Healing: 저장소 초기화 후 빈 배열 반환
    if (!Array.isArray(parsed)) {
      console.warn('[patientStore] Corrupted data detected — resetting patients store');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    // 레코드별 유효성 검사 + 필드 복구
    const healed = parsed.map(healPatient).filter(Boolean) as PatientRecord[];
    // 복구 결과가 원본과 다르면 즉시 저장 (데이터 정상화)
    if (healed.length !== parsed.length) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(healed)); } catch {}
    }
    return healed;
  } catch {
    console.warn('[patientStore] Parse error — resetting patients store');
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return [];
  }
}

export function saveAllPatients(patients: PatientRecord[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(patients)); } catch {}
}

export function getRecycleBin(): BinItem[] {
  try {
    const raw = localStorage.getItem(RECYCLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(RECYCLE_KEY);
      return [];
    }
    // 15일 초과 자동 제거 + 필드 누락 항목 Self-Healing
    return parsed
      .filter(i => i && typeof i.id === 'string' && typeof i.deletedAt === 'number')
      .filter(i => Date.now() - i.deletedAt < RECYCLE_TTL_MS);
  } catch {
    try { localStorage.removeItem(RECYCLE_KEY); } catch {}
    return [];
  }
}

export function saveRecycleBin(bin: BinItem[]): void {
  try { localStorage.setItem(RECYCLE_KEY, JSON.stringify(bin)); } catch {}
}

// ── 환자 CRUD ─────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
}

export function createPatient(data: Omit<PatientRecord,'id'|'createdAt'|'soapRecords'|'biomarkerRecords'|'romAnalysis'|'drafts'>): PatientRecord {
  const patient: PatientRecord = {
    ...data,
    id:               makeId('p'),
    createdAt:        new Date().toISOString(),
    soapRecords:      [],
    biomarkerRecords: [],
    romAnalysis:      [],
    drafts:           { soap: null, mps: null, recovery: null },
  };
  const patients = getAllPatients();
  saveAllPatients([...patients, patient]);
  return patient;
}

export function updatePatient(id: string, data: Partial<PatientRecord>): PatientRecord | null {
  const patients = getAllPatients();
  const idx = patients.findIndex(p => p.id === id);
  if (idx === -1) return null;
  patients[idx] = { ...patients[idx], ...data };
  saveAllPatients(patients);
  return patients[idx];
}

// ── 특정 환자의 프로필로 기록을 이동시키는 함수 (사용자 제시 패턴) ──

export function assignRecordToPatient(
  patientId:  string,
  recordType: 'soapRecords' | 'biomarkerRecords' | 'romAnalysis',
  data:       Omit<SOAPRecord | BiomarkerRecord | ROMRecord, 'id' | 'createdAt'>
): PatientRecord | null {
  const patients = getAllPatients();
  const targetIndex = patients.findIndex(p => p.id === patientId);

  if (targetIndex !== -1) {
    // timestamp를 추가하여 고유성 확보 (사용자 제시 패턴)
    const newRecord = {
      ...data,
      createdAt: new Date().toISOString(),
      id:        (typeof crypto !== 'undefined' && crypto.randomUUID)
                 ? crypto.randomUUID()
                 : makeId('r'),
    };
    (patients[targetIndex][recordType] as unknown[]).push(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }

  return targetIndex !== -1 ? patients[targetIndex] : null;
}

// ── Draft 저장 / 불러오기 / 삭제 ─────────────────────────────

export function saveDraft(
  patientId: string,
  draftType: keyof PatientDrafts,
  data:      PatientDrafts[keyof PatientDrafts]
): void {
  const patients = getAllPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) return;
  patients[idx].drafts = { ...patients[idx].drafts, [draftType]: data };
  saveAllPatients(patients);
}

export function getDraft<K extends keyof PatientDrafts>(patientId: string, draftType: K): PatientDrafts[K] | null {
  const patient = getAllPatients().find(p => p.id === patientId);
  return patient?.drafts[draftType] ?? null;
}

export function clearDraft(patientId: string, draftType: keyof PatientDrafts): void {
  saveDraft(patientId, draftType, null);
}

// ── 소프트 삭제 (RecycleBin) ──────────────────────────────────

export function softDeletePatient(patientId: string, ownerId: string): void {
  const patients = getAllPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) return;

  const bin = getRecycleBin();
  const item: BinItem = {
    id:          `bin-${patientId}-${Date.now()}`,
    type:        'patient',
    ownerId,
    displayName: patients[idx].name,
    deletedAt:   Date.now(),
    data:        patients[idx],
  };
  saveRecycleBin([...bin, item]);
  saveAllPatients(patients.filter(p => p.id !== patientId));
}

export function softDeleteSOAP(patientId: string, recordId: string, ownerId: string): void {
  const patients = getAllPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) return;
  const rec = patients[idx].soapRecords.find(r => r.id === recordId);
  if (!rec) return;

  const bin = getRecycleBin();
  saveRecycleBin([...bin, { id:`bin-soap-${recordId}`, type:'soap', ownerId, displayName:rec.chiefComplaint||rec.date, deletedAt:Date.now(), data:{patientId, record:rec} }]);
  patients[idx].soapRecords = patients[idx].soapRecords.filter(r => r.id !== recordId);
  saveAllPatients(patients);
}

export function softDeleteBiomarker(patientId: string, recordId: string, ownerId: string): void {
  const patients = getAllPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) return;
  const rec = patients[idx].biomarkerRecords.find(r => r.id === recordId);
  if (!rec) return;

  const bin = getRecycleBin();
  saveRecycleBin([...bin, { id:`bin-bio-${recordId}`, type:'biomarker', ownerId, displayName:rec.label, deletedAt:Date.now(), data:{patientId, record:rec} }]);
  patients[idx].biomarkerRecords = patients[idx].biomarkerRecords.filter(r => r.id !== recordId);
  saveAllPatients(patients);
}

export function softDeleteROM(patientId: string, recordId: string, ownerId: string): void {
  const patients = getAllPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) return;
  const rec = patients[idx].romAnalysis.find(r => r.id === recordId);
  if (!rec) return;

  const bin = getRecycleBin();
  saveRecycleBin([...bin, { id:`bin-rom-${recordId}`, type:'rom', ownerId, displayName:`${rec.jointLabel} ROM (${rec.date})`, deletedAt:Date.now(), data:{patientId, record:rec} }]);
  patients[idx].romAnalysis = patients[idx].romAnalysis.filter(r => r.id !== recordId);
  saveAllPatients(patients);
}

export function restoreBinItem(binId: string): void {
  const bin = getRecycleBin();
  const item = bin.find(i => i.id === binId);
  if (!item) return;

  const patients = getAllPatients();

  if (item.type === 'patient') {
    const restored = item.data as PatientRecord;
    if (!patients.find(p => p.id === restored.id)) {
      saveAllPatients([...patients, restored]);
    }
  } else if (item.type === 'soap') {
    const { patientId, record } = item.data as { patientId: string; record: SOAPRecord };
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx !== -1 && !patients[idx].soapRecords.find(r => r.id === record.id)) {
      patients[idx].soapRecords.push(record);
      saveAllPatients(patients);
    }
  } else if (item.type === 'biomarker') {
    const { patientId, record } = item.data as { patientId: string; record: BiomarkerRecord };
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx !== -1 && !patients[idx].biomarkerRecords.find(r => r.id === record.id)) {
      patients[idx].biomarkerRecords.push(record);
      saveAllPatients(patients);
    }
  } else if (item.type === 'rom') {
    const { patientId, record } = item.data as { patientId: string; record: ROMRecord };
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx !== -1 && !patients[idx].romAnalysis.find(r => r.id === record.id)) {
      patients[idx].romAnalysis.push(record);
      saveAllPatients(patients);
    }
  }

  saveRecycleBin(bin.filter(i => i.id !== binId));
}

export function permanentDeleteBinItem(binId: string): void {
  saveRecycleBin(getRecycleBin().filter(i => i.id !== binId));
}

// ── 편의 함수 ─────────────────────────────────────────────────

export function getPatientById(id: string): PatientRecord | undefined {
  return getAllPatients().find(p => p.id === id);
}

export function getMyPatients(ownerId: string): PatientRecord[] {
  return getAllPatients().filter(p => p.ownerId === ownerId);
}

export function getMyRecycleBin(ownerId: string): BinItem[] {
  return getRecycleBin().filter(i => i.ownerId === ownerId);
}

export function daysLeftInBin(item: BinItem): number {
  return Math.max(0, Math.ceil((item.deletedAt + RECYCLE_TTL_MS - Date.now()) / 86400000));
}
