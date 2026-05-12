// ============================================================
//  PatientContext v6 — patientStore 기반 (kinetic_patients 스키마)
//  모든 기록이 환자 객체에 귀속, assignRecordToPatient 패턴 사용
// ============================================================

import {
  createContext, useContext, useState, useCallback,
  useEffect, useMemo, type ReactNode,
} from 'react';
import {
  getAllPatients, saveAllPatients, assignRecordToPatient,
  saveDraft, getDraft, clearDraft,
  softDeletePatient, softDeleteSOAP, softDeleteBiomarker, softDeleteROM,
  restoreBinItem, permanentDeleteBinItem,
  createPatient, updatePatient as storeUpdatePatient,
  getMyPatients, getMyRecycleBin, daysLeftInBin,
  type PatientRecord, type SOAPRecord, type BiomarkerRecord,
  type ROMRecord, type BinItem, type PatientDrafts,
} from '../store/patientStore';
import { USE_CLOUD_DB } from '../lib/db/supabaseClient';
import {
  cloudUpsertPatient, cloudGetAllPatients,
  cloudUpsertAllPatients,
} from '../lib/db/cloudAdapter';
import { useAuth } from './AuthContext';
import { writeAudit } from '../lib/storage';
import { emitGlobalError } from '../lib/errorBus';

// ── Supabase 백그라운드 싱크 헬퍼 ─────────────────────────────
async function syncPatient(patient: PatientRecord) {
  if (!USE_CLOUD_DB) return;
  try { await cloudUpsertPatient(patient); }
  catch (e) {
    console.error('[PatientContext] Supabase sync error:', e);
    emitGlobalError('데이터 동기화 오류가 발생했습니다. 로컬에는 저장되었습니다.');
  }
}

async function syncAllPatients(patients: PatientRecord[]) {
  if (!USE_CLOUD_DB) return;
  try { await cloudUpsertAllPatients(patients); }
  catch (e) { console.error('[PatientContext] Supabase batch sync error:', e); }
}

// ── ChartContext 호환 타입 export (기존 컴포넌트 호환) ──────────
export type Patient = PatientRecord;
export type ClinicalSession = SOAPRecord;
export type { BinItem } from '../store/patientStore';

// ── Context Value ─────────────────────────────────────────────

interface PatientCtx {
  // 현재 사용자 소유 데이터
  myPatients:      PatientRecord[];
  currentPatient:  PatientRecord | null;
  recentPatients:  PatientRecord[];
  todayPatients:   PatientRecord[];
  // 파생 — SOAP 기준
  mySessions:      SOAPRecord[];
  draftSessions:   SOAPRecord[];
  todaySessions:   SOAPRecord[];
  // RecycleBin
  myRecycleBin:    BinItem[];
  daysLeft:        (item: BinItem) => number;

  // 환자 CRUD
  addPatient:         (d: Omit<PatientRecord,'id'|'ownerId'|'createdAt'|'soapRecords'|'biomarkerRecords'|'romAnalysis'|'drafts'>) => PatientRecord;
  updatePatient:      (id: string, d: Partial<PatientRecord>) => void;
  recyclePatient:     (id: string) => void;
  setCurrentPatient:  (id: string | null) => void;
  markViewed:         (id: string) => void;

  // SOAP 세션 CRUD (soapRecords에 귀속)
  addSession:         (d: Omit<SOAPRecord,'id'|'createdAt'> & { patientId:string }) => SOAPRecord | null;
  updateSession:      (patientId: string, recordId: string, d: Partial<SOAPRecord>) => void;
  recycleSession:     (patientId: string, recordId: string) => void;
  recycleBiomarker:   (patientId: string, recordId: string) => void;
  recycleROM:         (patientId: string, recordId: string) => void;
  getPatientSessions: (patientId: string) => SOAPRecord[];

  // Biomarker 귀속 (assignRecordToPatient 패턴)
  assignBiomarker:   (patientId: string, data: Omit<BiomarkerRecord,'id'|'createdAt'>) => void;
  assignROM:         (patientId: string, data: Omit<ROMRecord,'id'|'createdAt'>) => void;

  // Draft
  saveDraft:   (patientId: string, key: keyof PatientDrafts, data: PatientDrafts[keyof PatientDrafts]) => void;
  getDraft:    <K extends keyof PatientDrafts>(patientId: string, key: K) => PatientDrafts[K] | null;
  clearDraft:  (patientId: string, key: keyof PatientDrafts) => void;

  // RecycleBin
  restoreItem:      (binId: string) => void;
  permanentDelete:  (binId: string) => void;

  // 강제 리렌더 (patientStore 직접 수정 후 동기화)
  refresh: () => void;
}

const Ctx = createContext<PatientCtx | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

// ── Provider ─────────────────────────────────────────────────

export function PatientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ownerId = user?.id ?? '';

  // useState 초기값: patientStore에서 동기 로드
  const [patients, setPatients] = useState<PatientRecord[]>(() => getAllPatients());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [binItems,  setBinItems]  = useState<BinItem[]>(() => getMyRecycleBin(ownerId));

  // 주기적 bin 자동정리 + 리프레시
  const refresh = useCallback(() => {
    setPatients(getAllPatients());
    setBinItems(getMyRecycleBin(ownerId));
  }, [ownerId]);

  useEffect(() => { refresh(); }, [ownerId]);

  // Supabase 모드: 로그인 후 클라우드에서 환자 데이터 로드
  useEffect(() => {
    if (!USE_CLOUD_DB || !ownerId) return;
    (async () => {
      try {
        const cloudPatients = await cloudGetAllPatients(ownerId);
        if (cloudPatients.length > 0) {
          // 클라우드 데이터를 localStorage 에 병합 저장 (오프라인 대비)
          saveAllPatients(cloudPatients);
          setPatients(cloudPatients);
        }
      } catch (e) {
        console.error('[PatientContext] Supabase load error:', e);
        // 실패해도 localStorage 데이터로 계속 작동
      }
    })();
  }, [ownerId]);

  const td = today();

  // ── 소유 필터 ────────────────────────────────────────────────
  const myPatients    = useMemo(() => patients.filter(p => p.ownerId === ownerId), [patients, ownerId]);
  const todayPatients = useMemo(() => myPatients.filter(p => p.nextVisitDate === td), [myPatients, td]);
  const currentPatient = useMemo(() => myPatients.find(p => p.id === currentId) ?? null, [myPatients, currentId]);
  const recentPatients = useMemo(() => recentIds.flatMap(id => myPatients.filter(p => p.id === id)), [recentIds, myPatients]);
  const myRecycleBin  = useMemo(() => binItems, [binItems]);

  // SOAP 기반 파생
  const mySessions = useMemo(() =>
    myPatients.flatMap(p => p.soapRecords).sort((a,b) => b.createdAt.localeCompare(a.createdAt)),
    [myPatients]);
  const draftSessions = useMemo(() => mySessions.filter(s => s.status === 'draft'), [mySessions]);
  const todaySessions = useMemo(() => mySessions.filter(s => s.date === td), [mySessions, td]);

  // ── 환자 추가 ─────────────────────────────────────────────────
  const addPatient = useCallback((d: Omit<PatientRecord,'id'|'ownerId'|'createdAt'|'soapRecords'|'biomarkerRecords'|'romAnalysis'|'drafts'>): PatientRecord => {
    if (!ownerId) throw new Error('Not authenticated');
    const p = createPatient({ ...d, ownerId });
    setPatients(getAllPatients());
    writeAudit(ownerId, 'CREATE_PATIENT', p.id);
    syncPatient(p);
    return p;
  }, [ownerId]);

  // ── 환자 수정 ─────────────────────────────────────────────────
  const updatePatient = useCallback((id: string, d: Partial<PatientRecord>) => {
    const p = patients.find(x => x.id === id);
    if (!p || p.ownerId !== ownerId) return;
    storeUpdatePatient(id, d);
    setPatients(getAllPatients());
    writeAudit(ownerId, 'UPDATE_PATIENT', id);
    const updated = getAllPatients().find(x => x.id === id);
    if (updated) syncPatient(updated);
  }, [patients, ownerId]);

  // ── 환자 소프트 삭제 ──────────────────────────────────────────
  const recyclePatient = useCallback((id: string) => {
    const p = patients.find(x => x.id === id);
    if (!p || p.ownerId !== ownerId) return;
    softDeletePatient(id, ownerId);
    setPatients(getAllPatients());
    setBinItems(getMyRecycleBin(ownerId));
    writeAudit(ownerId, 'DELETE_PATIENT', id);
  }, [patients, ownerId]);

  const setCurrentPatient = useCallback((id: string | null) => setCurrentId(id), []);
  const markViewed = useCallback((id: string) =>
    setRecentIds(prev => [id, ...prev.filter(x => x !== id)].slice(0, 8)), []);

  // ── SOAP 세션 추가 (soapRecords에 귀속) ──────────────────────
  const addSession = useCallback((d: Omit<SOAPRecord,'id'|'createdAt'> & { patientId:string }): SOAPRecord | null => {
    const { patientId, ...rest } = d;
    const result = assignRecordToPatient(patientId, 'soapRecords', rest as Omit<SOAPRecord,'id'|'createdAt'>);
    if (!result) return null;
    setPatients(getAllPatients());
    writeAudit(ownerId, 'CREATE_CHART', patientId);
    const updated = getAllPatients().find(p => p.id === patientId);
    return updated?.soapRecords[updated.soapRecords.length - 1] ?? null;
  }, [ownerId]);

  // ── SOAP 세션 수정 ────────────────────────────────────────────
  const updateSession = useCallback((patientId: string, recordId: string, d: Partial<SOAPRecord>) => {
    const all = getAllPatients();
    const idx = all.findIndex(p => p.id === patientId && p.ownerId === ownerId);
    if (idx === -1) return;
    all[idx].soapRecords = all[idx].soapRecords.map(r => r.id === recordId ? { ...r, ...d } : r);
    saveAllPatients(all);
    setPatients(getAllPatients());
    writeAudit(ownerId, 'UPDATE_CHART', recordId);
  }, [ownerId]);

  // ── SOAP 세션 소프트 삭제 ─────────────────────────────────────
  const recycleSession = useCallback((patientId: string, recordId: string) => {
    const p = patients.find(x => x.id === patientId);
    if (!p || p.ownerId !== ownerId) return;
    softDeleteSOAP(patientId, recordId, ownerId);
    setPatients(getAllPatients());
    setBinItems(getMyRecycleBin(ownerId));
  }, [patients, ownerId]);

  const recycleBiomarker = useCallback((patientId: string, recordId: string) => {
    const p = patients.find(x => x.id === patientId);
    if (!p || p.ownerId !== ownerId) return;
    softDeleteBiomarker(patientId, recordId, ownerId);
    setPatients(getAllPatients());
    setBinItems(getMyRecycleBin(ownerId));
  }, [patients, ownerId]);

  const recycleROM = useCallback((patientId: string, recordId: string) => {
    const p = patients.find(x => x.id === patientId);
    if (!p || p.ownerId !== ownerId) return;
    softDeleteROM(patientId, recordId, ownerId);
    setPatients(getAllPatients());
    setBinItems(getMyRecycleBin(ownerId));
  }, [patients, ownerId]);

  // ── 환자별 세션 조회 (독립 공간) ─────────────────────────────
  const getPatientSessions = useCallback((patientId: string): SOAPRecord[] => {
    const p = patients.find(x => x.id === patientId);
    return (p?.soapRecords ?? []).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [patients]);

  // ── Biomarker / ROM 귀속 (assignRecordToPatient 패턴) ────────
  const assignBiomarker = useCallback((patientId: string, data: Omit<BiomarkerRecord,'id'|'createdAt'>) => {
    assignRecordToPatient(patientId, 'biomarkerRecords', data as Omit<SOAPRecord|BiomarkerRecord|ROMRecord,'id'|'createdAt'>);
    setPatients(getAllPatients());
    writeAudit(ownerId, 'UPDATE_PATIENT', patientId);
  }, [ownerId]);

  const assignROM = useCallback((patientId: string, data: Omit<ROMRecord,'id'|'createdAt'>) => {
    assignRecordToPatient(patientId, 'romAnalysis', data as Omit<SOAPRecord|BiomarkerRecord|ROMRecord,'id'|'createdAt'>);
    setPatients(getAllPatients());
    writeAudit(ownerId, 'UPDATE_PATIENT', patientId);
  }, [ownerId]);

  // ── Draft ────────────────────────────────────────────────────
  const saveDraftCb = useCallback((patientId: string, key: keyof PatientDrafts, data: PatientDrafts[keyof PatientDrafts]) => {
    saveDraft(patientId, key, data);
    setPatients(getAllPatients());
  }, []);

  const getDraftCb = useCallback(<K extends keyof PatientDrafts>(patientId: string, key: K): PatientDrafts[K] | null => {
    return getDraft<K>(patientId, key);
  }, []);

  const clearDraftCb = useCallback((patientId: string, key: keyof PatientDrafts) => {
    clearDraft(patientId, key);
    setPatients(getAllPatients());
  }, []);

  // ── RecycleBin ────────────────────────────────────────────────
  const restoreItem = useCallback((binId: string) => {
    restoreBinItem(binId);
    setPatients(getAllPatients());
    setBinItems(getMyRecycleBin(ownerId));
  }, [ownerId]);

  const permanentDelete = useCallback((binId: string) => {
    permanentDeleteBinItem(binId);
    setBinItems(getMyRecycleBin(ownerId));
  }, [ownerId]);

  return (
    <Ctx.Provider value={{
      myPatients, currentPatient, recentPatients, todayPatients,
      mySessions, draftSessions, todaySessions,
      myRecycleBin, daysLeft: daysLeftInBin,
      addPatient, updatePatient, recyclePatient, setCurrentPatient, markViewed,
      addSession, updateSession, recycleSession, recycleBiomarker, recycleROM, getPatientSessions,
      assignBiomarker, assignROM,
      saveDraft: saveDraftCb, getDraft: getDraftCb, clearDraft: clearDraftCb,
      restoreItem, permanentDelete, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePatient(): PatientCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePatient must be inside PatientProvider');
  return ctx;
}
