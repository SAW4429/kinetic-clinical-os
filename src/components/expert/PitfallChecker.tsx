import { useState, useMemo } from 'react';
import { CLINICAL_PITFALLS, type ClinicalPitfall, type PitfallCategory, type RiskLevel, type Language } from '../../data/clinicalDB';

const CAT_META: Record<PitfallCategory, { ko:string; ja:string; en:string; icon:string; color:string }> = {
  assessment:      { ko:'평가',     ja:'評価',                    en:'Assessment',   icon:'⊙', color:'text-sky-400 border-sky-700 bg-sky-950/40' },
  prescription:    { ko:'처방',     ja:'処方',                    en:'Prescription', icon:'◈', color:'text-violet-400 border-violet-700 bg-violet-950/40' },
  monitoring:      { ko:'모니터링', ja:'モニタリング',             en:'Monitoring',   icon:'◔', color:'text-amber-400 border-amber-700 bg-amber-950/40' },
  communication:   { ko:'소통',     ja:'コミュニケーション',      en:'Communication',icon:'⬡', color:'text-emerald-400 border-emerald-700 bg-emerald-950/40' },
  documentation:   { ko:'문서화',   ja:'文書化',                  en:'Documentation',icon:'▣', color:'text-slate-400 border-slate-600 bg-slate-800/60' },
  nutrition:       { ko:'영양',     ja:'栄養',                    en:'Nutrition',    icon:'◇', color:'text-orange-400 border-orange-700 bg-orange-950/40' },
  'return-to-sport':{ ko:'복귀',   ja:'競技復帰',                 en:'Return-to-Sport',icon:'▶', color:'text-pink-400 border-pink-700 bg-pink-950/40' },
};

const SEV_STYLE: Record<RiskLevel, { dot:string; label:string; text:Record<Language,string> }> = {
  high:     { dot:'bg-rose-500',  label:'text-rose-400',   text:{ko:'고위험',ja:'高リスク',en:'High'} },
  moderate: { dot:'bg-amber-400', label:'text-amber-400',  text:{ko:'중위험',ja:'中リスク',en:'Moderate'} },
  low:      { dot:'bg-slate-500', label:'text-slate-500',  text:{ko:'저위험',ja:'低リスク',en:'Low'} },
  absolute: { dot:'bg-rose-600',  label:'text-rose-500',   text:{ko:'절대주의',ja:'要注意',en:'Critical'} },
};

function PitfallItem({ pitfall, isChecked, onToggle, lang }: { pitfall:ClinicalPitfall; isChecked:boolean; onToggle:()=>void; lang:Language }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_STYLE[pitfall.severity];
  return (
    <li className={`group rounded-lg border transition-all duration-200 ${isChecked?'border-slate-700 bg-slate-900/40 opacity-55':'border-slate-700 bg-slate-800'}`}>
      <div className="flex items-start gap-3 p-3">
        <button onClick={onToggle} aria-checked={isChecked} role="checkbox"
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${isChecked?'border-sky-600 bg-sky-600 text-white':'border-slate-600 hover:border-sky-500'}`}>
          {isChecked && <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sev.dot}`}/>
            <span className={`text-xs font-semibold text-slate-200 transition-all ${isChecked?'line-through text-slate-500':''}`}>{pitfall.title[lang]}</span>
            <span className={`text-[10px] font-bold ${sev.label}`}>[{sev.text[lang]}]</span>
          </div>
          {!isChecked && <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{pitfall.description[lang]}</p>}
        </div>
        {!isChecked && (
          <button onClick={()=>setExpanded(p=>!p)} className="shrink-0 rounded p-0.5 text-slate-600 hover:text-slate-300">
            <svg className={`h-4 w-4 transition-transform ${expanded?'rotate-180':''}`} viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      {expanded && !isChecked && (
        <div className="mx-3 mb-3 rounded-md border border-sky-900 bg-sky-950/40 p-2.5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-sky-500">
            {lang==='ko'?'예방 팁':lang==='ja'?'予防ヒント':'Prevention Tip'}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-300">{pitfall.preventionTip[lang]}</p>
        </div>
      )}
    </li>
  );
}

function CategorySection({ category, pitfalls, checkedIds, onToggle, lang }: { category:PitfallCategory; pitfalls:ClinicalPitfall[]; checkedIds:Set<string>; onToggle:(id:string)=>void; lang:Language }) {
  const [collapsed, setCollapsed] = useState(false);
  const meta  = CAT_META[category];
  const done  = pitfalls.filter(p => checkedIds.has(p.id)).length;
  const total = pitfalls.length;
  return (
    <div className={`rounded-xl border overflow-hidden ${meta.color.split(' ').slice(1).join(' ')}`}>
      <button onClick={()=>setCollapsed(p=>!p)} className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <span className={meta.color.split(' ')[0]}>{meta.icon}</span>
          <span className="text-xs font-bold text-slate-200">{(meta as any)[lang]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">{done}/{total}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-sky-600 transition-all duration-300" style={{width:`${(done/total)*100}%`}}/>
          </div>
          <svg className={`h-3.5 w-3.5 text-slate-500 transition-transform ${collapsed?'-rotate-90':''}`} viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      {!collapsed && (
        <ul className="flex flex-col gap-2 px-3 pb-3">
          {pitfalls.map(p => <PitfallItem key={p.id} pitfall={p} isChecked={checkedIds.has(p.id)} onToggle={()=>onToggle(p.id)} lang={lang}/>)}
        </ul>
      )}
    </div>
  );
}

export function PitfallChecker({ lang='ko' }: { lang?: Language }) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [filterSev, setFilterSev] = useState<RiskLevel|'all'>('all');
  const toggle = (id: string) => setCheckedIds(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const done = checkedIds.size; const total = CLINICAL_PITFALLS.length;
  const pct  = Math.round((done/total)*100);

  const grouped = useMemo<Partial<Record<PitfallCategory,ClinicalPitfall[]>>>(() => {
    const filtered = CLINICAL_PITFALLS.filter(p => filterSev==='all'||p.severity===filterSev);
    return filtered.reduce<Partial<Record<PitfallCategory,ClinicalPitfall[]>>>((acc,p)=>{ (acc[p.category]??=[]).push(p); return acc; },{});
  }, [filterSev]);

  const sevFilters: {v:RiskLevel|'all'; ko:string; ja:string; en:string}[] = [
    {v:'all',ko:'전체',ja:'全て',en:'All'},
    {v:'high',ko:'고위험',ja:'高リスク',en:'High'},
    {v:'moderate',ko:'중위험',ja:'中リスク',en:'Moderate'},
    {v:'low',ko:'저위험',ja:'低リスク',en:'Low'},
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="content-wrap w-full flex flex-col gap-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {lang==='ko'?'Clinical Pitfall 체크리스트':lang==='ja'?'Clinical Pitfall チェックリスト':'Clinical Pitfall Checklist'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {lang==='ko'?`총 ${total}개 항목 | 재활 현장 임상 실수 점검`:lang==='ja'?`全${total}項目 | 臨床ミス点検`:`${total} items | Clinical error prevention checklist`}
            </p>
          </div>
          {done>0 && (
            <button onClick={()=>setCheckedIds(new Set())} className="shrink-0 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] text-slate-400 hover:text-rose-400 hover:border-rose-700 transition-colors">
              {lang==='ko'?'전체 초기화':lang==='ja'?'全リセット':'Reset All'}
            </button>
          )}
        </div>

        {/* 진행률 바 */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {lang==='ko'?'전체 완료율':lang==='ja'?'全体完了率':'Overall Completion'}
            </span>
            <span className="font-mono text-sm font-bold text-sky-400">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
            <div className={`h-full rounded-full transition-all duration-500 ${pct===100?'bg-emerald-500':pct>=60?'bg-sky-500':'bg-amber-500'}`} style={{width:`${pct}%`}}/>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-[10px] text-slate-600">{done}/{total}</span>
            {pct===100 && <span className="text-[10px] font-bold text-emerald-400">✓ {lang==='ko'?'모든 항목 확인 완료':lang==='ja'?'全項目確認完了':'All items verified'}</span>}
          </div>
        </div>

        {/* 심각도 필터 */}
        <div className="flex flex-wrap gap-1.5">
          {sevFilters.map(f => (
            <button key={f.v} onClick={()=>setFilterSev(f.v)}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition-all ${filterSev===f.v?'border-sky-500 bg-sky-950/60 text-sky-300':'border-slate-700 bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
              {(f as any)[lang]}
            </button>
          ))}
        </div>

        {/* 카테고리별 체크리스트 */}
        <div className="flex flex-col gap-3">
          {(Object.entries(grouped) as [PitfallCategory,ClinicalPitfall[]][]).map(([cat,pitfalls]) => (
            <CategorySection key={cat} category={cat} pitfalls={pitfalls} checkedIds={checkedIds} onToggle={toggle} lang={lang}/>
          ))}
          {Object.keys(grouped).length===0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-12">
              <span className="text-2xl text-slate-700">⊘</span>
              <p className="text-xs text-slate-600">{lang==='ko'?'해당 항목 없음':lang==='ja'?'該当項目なし':'No items found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default PitfallChecker;
