// ============================================================
//  ChartContext — 정규화된 차트 단일 소스
//  모든 컴포넌트는 chartId로 참조 → 원본 수정 시 즉시 반영
// ============================================================

import {
  createContext, useContext, useReducer, useCallback,
  useEffect, useMemo, type ReactNode,
} from 'react';
import { setLS, getLS, writeAudit } from '../lib/storage';
import { useAuth } from './AuthContext';

// ── 타입 ─────────────────────────────────────────────────────

export interface ChartRecord {
  id:             string;
  version:        number;       // 낙관적 동시성 제어
  lastModifiedAt: number;
  ownerId:        string;
  patientId:      string;
  date:           string;       // YYYY-MM-DD
  type:           'initial' | 'follow-up' | 'discharge';
  chiefComplaint: string;
  vasRest?:       number;
  vasActive?:     number;
  notes?:         string;
  status:         'draft' | 'complete';
  createdAt:      number;
  updatedAt:      number;
}

// ── Reducer ───────────────────────────────────────────────────

type ChartMap = Record<string, ChartRecord>;

type Action =
  | { type: 'LOAD';   charts: ChartMap }
  | { type: 'PUT';    chart: ChartRecord }
  | { type: 'DELETE'; id: string };

function reducer(state: ChartMap, a: Action): ChartMap {
  switch (a.type) {
    case 'LOAD':   return a.charts;
    case 'PUT':    return { ...state, [a.chart.id]: a.chart };
    case 'DELETE': { const s = { ...state }; delete s[a.id]; return s; }
    default: return state;
  }
}

const LS_KEY = 'kcos_charts_v4';
function uid() { return `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`; }
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Context ───────────────────────────────────────────────────

interface ChartCtx {
  charts:            ChartMap;
  getChart:          (id: string) => ChartRecord | undefined;
  getByPatient:      (patientId: string) => ChartRecord[];
  getDrafts:         () => ChartRecord[];
  getTodayCharts:    () => ChartRecord[];

  addChart:     (data: Omit<ChartRecord,'id'|'version'|'lastModifiedAt'|'updatedAt'>) => ChartRecord;
  updateChart:  (id: string, data: Partial<ChartRecord>, expectedVer?: number) => { ok: boolean; conflict: boolean };
  deleteChart:  (id: string) => void;
}

const Ctx = createContext<ChartCtx | null>(null);

export function ChartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ownerId  = user?.id ?? '';
  const [charts, dispatch] = useReducer(reducer, {} as ChartMap);

  useEffect(() => {
    const saved = getLS<ChartMap>(LS_KEY);
    if (saved) dispatch({ type: 'LOAD', charts: saved });
  }, []);

  useEffect(() => {
    if (Object.keys(charts).length > 0) setLS(LS_KEY, charts);
  }, [charts]);

  const td = todayStr();

  const getChart     = useCallback((id: string) => charts[id], [charts]);
  const getByPatient = useCallback((pid: string) =>
    Object.values(charts).filter(c => c.patientId === pid && c.ownerId === ownerId)
      .sort((a,b) => b.createdAt - a.createdAt), [charts, ownerId]);
  const getDrafts = useCallback(() =>
    Object.values(charts).filter(c => c.ownerId === ownerId && c.status === 'draft')
      .sort((a,b) => b.updatedAt - a.updatedAt), [charts, ownerId]);
  const getTodayCharts = useCallback(() =>
    Object.values(charts).filter(c => c.ownerId === ownerId && c.date === td),
    [charts, ownerId, td]);

  const addChart = useCallback((data: Omit<ChartRecord,'id'|'version'|'lastModifiedAt'|'updatedAt'>): ChartRecord => {
    const chart: ChartRecord = { ...data, id: uid(), version: 1, lastModifiedAt: Date.now(), updatedAt: Date.now() };
    dispatch({ type: 'PUT', chart });
    writeAudit(ownerId, 'CREATE_CHART', chart.id);
    return chart;
  }, [ownerId]);

  const updateChart = useCallback((id: string, data: Partial<ChartRecord>, expectedVer?: number): { ok: boolean; conflict: boolean } => {
    const existing = charts[id];
    if (!existing || existing.ownerId !== ownerId) return { ok: false, conflict: false };
    if (expectedVer !== undefined && existing.version !== expectedVer) return { ok: false, conflict: true };
    const updated: ChartRecord = { ...existing, ...data, version: existing.version + 1, lastModifiedAt: Date.now(), updatedAt: Date.now() };
    dispatch({ type: 'PUT', chart: updated });
    writeAudit(ownerId, 'UPDATE_CHART', id);
    return { ok: true, conflict: false };
  }, [charts, ownerId]);

  const deleteChart = useCallback((id: string) => {
    if (!charts[id] || charts[id].ownerId !== ownerId) return;
    dispatch({ type: 'DELETE', id });
    writeAudit(ownerId, 'DELETE_CHART', id);
  }, [charts, ownerId]);

  const drafts      = useMemo(getDrafts,       [getDrafts]);
  const todayCharts = useMemo(getTodayCharts,  [getTodayCharts]);

  return (
    <Ctx.Provider value={{
      charts, getChart, getByPatient,
      getDrafts: () => drafts,
      getTodayCharts: () => todayCharts,
      addChart, updateChart, deleteChart,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCharts(): ChartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCharts must be inside ChartProvider');
  return ctx;
}
