// ============================================================
//  cloudAdapter.ts — Supabase 실서비스 어댑터 (활성화 버전)
//  patientStore.ts 와 동일한 함수 시그니처, async 버전
// ============================================================

import { supabase } from './supabaseClient';
import type {
  PatientRecord, BinItem, PatientDrafts,
} from '../../store/patientStore';

export type { PatientRecord, BinItem, PatientDrafts };

// ── 행 변환 헬퍼 ─────────────────────────────────────────────

function rowToPatient(row: Record<string, unknown>): PatientRecord {
  return {
    id:               row.id as string,
    ownerId:          row.owner_id as string,
    name:             row.name as string,
    age:              row.age as number,
    gender:           row.gender as 'M' | 'F' | 'other',
    condition:        row.condition as string,
    phone:            row.phone as string | undefined,
    notes:            row.notes as string | undefined,
    createdAt:        row.created_at as string,
    nextVisitDate:    row.next_visit_date as string | undefined,
    deletedAt:        row.deleted_at as number | undefined,
    soapRecords:      (row.soap_records      as PatientRecord['soapRecords'])      ?? [],
    biomarkerRecords: (row.biomarker_records as PatientRecord['biomarkerRecords']) ?? [],
    romAnalysis:      (row.rom_analysis      as PatientRecord['romAnalysis'])      ?? [],
    drafts:           (row.drafts            as PatientDrafts) ?? { soap:null, mps:null, recovery:null },
  };
}

function patientToRow(p: PatientRecord) {
  return {
    id:               p.id,
    owner_id:         p.ownerId,
    name:             p.name,
    age:              p.age,
    gender:           p.gender,
    condition:        p.condition,
    phone:            p.phone   ?? null,
    notes:            p.notes   ?? null,
    next_visit_date:  p.nextVisitDate ?? null,
    deleted_at:       p.deletedAt    ?? null,
    soap_records:     p.soapRecords,
    biomarker_records:p.biomarkerRecords,
    rom_analysis:     p.romAnalysis,
    drafts:           p.drafts,
  };
}

function rowToBinItem(row: Record<string, unknown>): BinItem {
  return {
    id:          row.id          as string,
    type:        row.type        as BinItem['type'],
    ownerId:     row.owner_id    as string,
    displayName: row.display_name as string,
    deletedAt:   row.deleted_at  as number,
    data:        row.data        as unknown,
  };
}

// ── 환자 CRUD ─────────────────────────────────────────────────

export async function cloudGetAllPatients(ownerId: string): Promise<PatientRecord[]> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => rowToPatient(r as Record<string, unknown>));
}

export async function cloudUpsertPatient(patient: PatientRecord): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { error } = await supabase
    .from('patients')
    .upsert(patientToRow(patient), { onConflict: 'id' });
  if (error) throw error;
}

export async function cloudUpsertAllPatients(patients: PatientRecord[]): Promise<void> {
  if (!supabase || patients.length === 0) return;
  const { error } = await supabase
    .from('patients')
    .upsert(patients.map(patientToRow), { onConflict: 'id' });
  if (error) throw error;
}

export async function cloudDeletePatient(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: Date.now() })
    .eq('id', id);
  if (error) throw error;
}

// ── 휴지통 ────────────────────────────────────────────────────

const RECYCLE_TTL_MS = 15 * 24 * 60 * 60 * 1000;

export async function cloudGetRecycleBin(ownerId: string): Promise<BinItem[]> {
  if (!supabase) throw new Error('Supabase not initialised');
  const cutoff = Date.now() - RECYCLE_TTL_MS;
  const { data, error } = await supabase
    .from('recycle_bin')
    .select('*')
    .eq('owner_id', ownerId)
    .gt('deleted_at', cutoff);
  if (error) throw error;
  return (data ?? []).map(r => rowToBinItem(r as Record<string, unknown>));
}

export async function cloudAddBinItem(item: BinItem): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { error } = await supabase.from('recycle_bin').insert({
    id:           item.id,
    type:         item.type,
    owner_id:     item.ownerId,
    display_name: item.displayName,
    deleted_at:   item.deletedAt,
    data:         item.data,
  });
  if (error) throw error;
}

export async function cloudDeleteBinItem(binId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { error } = await supabase.from('recycle_bin').delete().eq('id', binId);
  if (error) throw error;
}

// ── 프로필 ────────────────────────────────────────────────────

export async function cloudGetProfile(userId: string): Promise<Record<string, unknown> | null> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Record<string, unknown>;
}

export async function cloudUpsertProfile(profile: Record<string, unknown>): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialised');
  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });
  if (error) throw error;
}
