import { useState } from 'react';
import { CLINICAL_MECHANISMS, type ClinicalMechanism, type Language } from '../../data/clinicalDB';

const ALERT_META: Record<string, { icon: string; color: string; bg: string; alerts: Record<Language, string>[] }> = {
  'MECH-HYPOCA': {
    icon: '⚠', color: 'text-amber-400 border-amber-500', bg: 'bg-amber-950/40',
    alerts: [
      { ko: 'TnC EF-hand Ca²⁺ 결합 부전 → 액틴-마이오신 가교 차단', ja: 'TnC EF-hand Ca²⁺結合不全→架橋遮断', en: 'TnC EF-hand Ca²⁺ binding failure → actin-myosin cross-bridge blocked' },
      { ko: 'Albumin-corrected Ca²⁺ 즉시 측정 (목표 ≥2.2 mmol/L)', ja: 'アルブミン補正Ca²⁺即時測定（目標≥2.2 mmol/L）', en: 'Measure albumin-corrected Ca²⁺ immediately (target ≥2.2 mmol/L)' },
      { ko: 'Chvostek / Trousseau 징후 신체검진 시행', ja: 'Chvostek / Trousseau徴候身体診察', en: 'Perform Chvostek and Trousseau sign examination' },
    ],
  },
  'MECH-METFATIGUE': {
    icon: '☣', color: 'text-rose-400 border-rose-500', bg: 'bg-rose-950/40',
    alerts: [
      { ko: 'SERCA 기능 정지 → 세포질 Ca²⁺ 잔류 → 이완 불능 (사후강직 유사)', ja: 'SERCA停止→細胞質Ca²⁺残留→弛緩不能', en: 'SERCA failure → cytoplasmic Ca²⁺ entrapment → rigor-like contracture' },
      { ko: '미토콘드리아 산화적 인산화 저하 → ATP 재합성↓ → 리보솜 단백질 동화율 연쇄 감소', ja: 'ミトコンドリア酸化的リン酸化低下→リボソームタンパク質同化率低下', en: 'Mitochondrial OXPHOS decline → ATP resynthesis↓ → ribosomal protein anabolism chain reduction' },
      { ko: '즉각 운동 중단 + Active Recovery + PCr 재충전 대기', ja: '即時中断＋積極的回復＋PCr再充填待機', en: 'Immediate exercise cessation + Active Recovery + await PCr repletion' },
    ],
  },
  'MECH-MTOR': {
    icon: '⬢', color: 'text-violet-400 border-violet-500', bg: 'bg-violet-950/40',
    alerts: [
      { ko: '류신 <2.5 g/meal → mTORC1 활성 미달 → MPS 불충분', ja: 'ロイシン<2.5 g/meal→mTORC1活性不足→MPS不十分', en: 'Leucine <2.5 g/meal → subthreshold mTORC1 activation → insufficient MPS' },
      { ko: '운동 후 2h 초과 시 타이밍 윈도우 감소 (anabolic window)', ja: '運動後2h超でタイミングウィンドウ減少', en: 'Protein intake >2 h post-exercise narrows the anabolic window substantially' },
      { ko: '고령(≥65세): Anabolic Resistance → 1회 단백질 섭취량 0.6 g/kg으로 증량', ja: '高齢者(≥65歳): Anabolic Resistance→0.6 g/kg/mealに増量', en: 'Older adults (≥65): anabolic resistance → increase single-meal dose to 0.6 g/kg' },
    ],
  },
  'MECH-MITOBIO': {
    icon: '◎', color: 'text-emerald-400 border-emerald-500', bg: 'bg-emerald-950/40',
    alerts: [
      { ko: '비활동 2주 → PGC-1α 발현 감소 시작 → VO₂max 감소 예고', ja: '非活動2週→PGC-1α発現低下→VO₂max低下予告', en: '2 weeks of inactivity begins PGC-1α downregulation → VO₂max decline anticipated' },
      { ko: '장기 입원 환자: 저강도 HIIT로 AMPK-PGC-1α 축 조기 재활성화 권장', ja: '長期入院患者: 低強度HIITでAMPK-PGC-1α軸の早期再活性化', en: 'Prolonged bed-rest patients: low-intensity HIIT reactivates AMPK-PGC-1α axis early' },
    ],
  },
  'MECH-NMJ': {
    icon: '◔', color: 'text-sky-400 border-sky-500', bg: 'bg-sky-950/40',
    alerts: [
      { ko: 'EMG 진폭 감소 확인 시 말초 NMJ 피로 vs 중추 피로 감별 필요', ja: 'EMG振幅低下確認時: 末梢NMJ疲労vs中枢疲労の鑑別必要', en: 'Declining EMG amplitude: differentiate peripheral NMJ fatigue from central fatigue' },
      { ko: '중증 근무력증 환자: 이 기전이 병적으로 가속 → 피로 후 충분한 휴식 필수', ja: '重症筋無力症: 同機序が病的加速→十分な休息必須', en: 'Myasthenia gravis: pathological acceleration of this mechanism → ensure adequate rest intervals' },
    ],
  },
  'MECH-DOMS': {
    icon: '⊘', color: 'text-amber-400 border-amber-500', bg: 'bg-amber-950/40',
    alerts: [
      { ko: 'DOMS = 완전 휴식 금기. 저강도 Active Recovery로 혈류↑ → 염증 대사산물 제거', ja: 'DOMS=完全安静禁忌。低強度Active Recovery→炎症代謝物除去', en: 'DOMS: complete rest is contraindicated; low-intensity active recovery accelerates clearance' },
      { ko: 'NSAIDs 과용 → 위성 세포 활성화 억제 → 장기 근적응 저해', ja: 'NSAIDs過用→衛星細胞活性化抑制→長期筋適応阻害', en: 'Excessive NSAID use suppresses satellite cell activation → impairs long-term muscle adaptation' },
    ],
  },
  'MECH-DETRAIN': {
    icon: '▲', color: 'text-orange-400 border-orange-500', bg: 'bg-orange-950/40',
    alerts: [
      { ko: '수술 후 2주↑ 비활동: 재활 초기 강도 = 이전 처방의 50~60%에서 시작', ja: '術後2週以上非活動: 初期強度=以前の50〜60%から開始', en: '≥2 weeks post-surgical inactivity: begin rehab at 50–60% of prior prescription intensity' },
      { ko: 'T2DM 환자 비활동 3일부터 GLUT4 감소 → 혈당 상승 위험', ja: 'T2DM患者: 非活動3日でGLUT4低下→血糖上昇リスク', en: 'T2DM patients: GLUT4 decline begins within 3 days of inactivity → glycaemic deterioration risk' },
    ],
  },
  'MECH-INFLAM': {
    icon: '⚗', color: 'text-pink-400 border-pink-500', bg: 'bg-pink-950/40',
    alerts: [
      { ko: '만성 질환 환자 운동 초기 2~4주: 일시적 염증 악화(flare) 가능 → 저강도 내장 지방 감소 우선 전략', ja: '慢性疾患患者運動初期2〜4週: 一時的炎症悪化の可能性→低強度内臓脂肪減少優先戦略', en: 'Chronic disease patients, first 2–4 weeks: possible inflammatory flare → low-intensity visceral fat reduction strategy first' },
    ],
  },
};

function AlertBanner({ id, lang }: { id: string; lang: Language }) {
  const meta = ALERT_META[id];
  if (!meta) return null;
  return (
    <div className={`mt-4 rounded-lg border ${meta.color} ${meta.bg} p-3`}>
      <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${meta.color.split(' ')[0]}`}>
        <span>{meta.icon}</span><span>Clinical Alert</span>
      </p>
      <ul className="space-y-1.5">
        {meta.alerts.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
            <span className={`mt-0.5 shrink-0 ${meta.color.split(' ')[0]}`}>›</span>
            <span>{a[lang]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepTimeline({ mech, lang }: { mech: ClinicalMechanism; lang: Language }) {
  return (
    <ol className="relative ml-3 mt-4 space-y-0">
      {mech.steps.map((step, idx) => {
        const isLast = idx === mech.steps.length - 1;
        return (
          <li key={step.order} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-500 bg-slate-700 text-xs font-bold text-slate-200">
                {step.order}
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-600" />}
            </div>
            <div className="pb-5">
              <p className="text-sm font-semibold text-slate-100">{step.label[lang]}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{step.detail[lang]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function MechanismPanel({ lang = 'ko' }: { lang?: Language }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CLINICAL_MECHANISMS.find(m => m.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="content-wrap w-full flex flex-col gap-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-100">
              {lang==='ko'?'병태생리 메커니즘 분석':lang==='ja'?'病態生理メカニズム分析':'Pathophysiology Mechanism Analysis'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {lang==='ko'?'카드를 선택하면 단계별 내부 기전과 임상 경고가 표시됩니다.':lang==='ja'?'カードを選択するとステップごとの機序と臨床警告が表示されます。':'Select a card to view stepwise mechanism and clinical alerts.'}
            </p>
          </div>
          <span className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            {CLINICAL_MECHANISMS.length} mechanisms
          </span>
        </div>

        {/* 선택 카드 그리드 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CLINICAL_MECHANISMS.map(m => {
            const isActive = selectedId === m.id;
            const alertMeta = ALERT_META[m.id];
            return (
              <button key={m.id} onClick={() => setSelectedId(prev => prev === m.id ? null : m.id)}
                className={['group relative rounded-xl border p-3 text-left transition-all duration-200', isActive ? 'border-sky-500 bg-sky-950/50 shadow-lg' : 'border-slate-700 bg-slate-800 hover:border-slate-500'].join(' ')}>
                {alertMeta && (
                  <span className={`absolute right-2 top-2 text-sm ${isActive ? alertMeta.color.split(' ')[0] : 'text-slate-600'}`}>
                    {alertMeta.icon}
                  </span>
                )}
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{m.category[lang]}</p>
                <p className={`mt-1 text-xs font-bold leading-tight ${isActive ? 'text-sky-300' : 'text-slate-200'}`}>{m.title[lang]}</p>
                <p className="mt-1 font-mono text-[9px] text-slate-600">{m.keyMolecule}</p>
                <div className={`mt-2 h-0.5 w-6 rounded-full transition-all ${isActive ? 'bg-sky-500' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
              </button>
            );
          })}
        </div>

        {/* 상세 패널 */}
        {selected && (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-500">{selected.category[lang]}</p>
                <h3 className="mt-0.5 text-sm font-bold text-slate-100">{selected.title[lang]}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="shrink-0 rounded p-1 text-slate-600 hover:text-slate-300">✕</button>
            </div>
            <StepTimeline mech={selected} lang={lang} />
            <AlertBanner id={selected.id} lang={lang} />
            <div className="mt-4 rounded-lg bg-slate-800 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {lang==='ko'?'임상적 함의':lang==='ja'?'臨床的含意':'Clinical Implication'}
              </p>
              <p className="text-xs leading-relaxed text-slate-300">{selected.clinicalImplication[lang]}</p>
            </div>
          </div>
        )}

        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 py-12">
            <span className="text-2xl text-slate-700">⚗</span>
            <p className="text-xs text-slate-600">
              {lang==='ko'?'위 카드를 선택하면 메커니즘 분석이 시작됩니다.':lang==='ja'?'上のカードを選択するとメカニズム分析が開始されます。':'Select a card above to begin mechanism analysis.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default MechanismPanel;
