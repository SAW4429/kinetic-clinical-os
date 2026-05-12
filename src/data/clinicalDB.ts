export type Language  = 'ko' | 'ja' | 'en';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'absolute';

export interface LocalizedText { ko: string; ja: string; en: string; }

// ── FITT-VP ─────────────────────────────────────────────────

export interface FITTVPParameter {
  frequency: LocalizedText; intensity: LocalizedText; time: LocalizedText;
  type: LocalizedText; volume: LocalizedText; progression: LocalizedText;
}
export interface Contraindication {
  id: string; label: LocalizedText; level: RiskLevel; mechanism: LocalizedText;
}
export interface FITTVPProtocol {
  condition: string; conditionLabel: LocalizedText;
  parameters: FITTVPParameter; contraindications: Contraindication[];
  clinicalNote: LocalizedText;
}

export const FITT_VP_PROTOCOLS: FITTVPProtocol[] = [
  {
    condition: 'T2DM', conditionLabel: { ko: '제2형 당뇨병', ja: '2型糖尿病', en: 'Type 2 Diabetes Mellitus' },
    parameters: {
      frequency:   { ko: '주 3~5회', ja: '週3〜5回', en: '3–5 days/week' },
      intensity:   { ko: '중강도 40~60% HRR / RPE 11~13', ja: '中強度 40〜60% HRR', en: 'Moderate 40–60% HRR / RPE 11–13' },
      time:        { ko: '1회 30~60분', ja: '1回30〜60分', en: '30–60 min/session' },
      type:        { ko: '유산소 + 저항 운동 복합', ja: '有酸素＋抵抗運動', en: 'Aerobic + Resistance combined' },
      volume:      { ko: '≥150분/주 중강도 또는 ≥75분/주 고강도', ja: '週≥150分中強度', en: '≥150 min/wk moderate or ≥75 min/wk vigorous' },
      progression: { ko: '4주마다 5% 강도 증가, 혈당 모니터링 필수', ja: '4週毎に5%増加', en: 'Increase 5% every 4 weeks; mandatory glucose monitoring' },
    },
    contraindications: [
      { id: 'T2DM-CI-1', level: 'absolute', label: { ko: '혈당 >300 mg/dL (공복)', ja: '空腹時血糖>300', en: 'Fasting glucose >300 mg/dL' }, mechanism: { ko: '케톤산증 가속화', ja: 'ケトアシドーシス促進', en: 'Risk of ketoacidosis acceleration' } },
      { id: 'T2DM-CI-2', level: 'high',     label: { ko: '운동 전 혈당 <100 mg/dL', ja: '運動前血糖<100', en: 'Pre-exercise glucose <100 mg/dL' }, mechanism: { ko: '운동 중 심각한 저혈당 위험', ja: '重篤な低血糖リスク', en: 'Risk of severe hypoglycemia during exercise' } },
      { id: 'T2DM-CI-3', level: 'high',     label: { ko: '증식성 당뇨망막병증', ja: '増殖性糖尿病網膜症', en: 'Proliferative diabetic retinopathy' }, mechanism: { ko: '고강도 시 안압 상승 → 망막 출혈', ja: '眼圧上昇→網膜出血', en: 'Raised IOP during vigorous exercise → retinal hemorrhage' } },
    ],
    clinicalNote: { ko: '인슐린/설폰요소제 복용 시 운동 30분 전 혈당 확인. 야간 지연성 저혈당 주의.', ja: 'インスリン/SU薬服用時は運動30分前に血糖確認。夜間遅発性低血糖に注意。', en: 'Check glucose 30 min before exercise if on insulin/SU agents. Monitor for nocturnal delayed hypoglycemia.' },
  },
  {
    condition: 'HF-stable', conditionLabel: { ko: '안정형 심부전 (NYHA I-II)', ja: '安定型心不全 NYHA I-II', en: 'Stable Heart Failure (NYHA I-II)' },
    parameters: {
      frequency:   { ko: '주 3~5회', ja: '週3〜5回', en: '3–5 days/week' },
      intensity:   { ko: '40~60% HRR / RPE 11~13, Borg 병행', ja: '40〜60% HRR / Borg併用', en: '40–60% HRR / RPE 11–13; use Borg scale concurrently' },
      time:        { ko: '초기 10~15분 → 점진 30~45분', ja: '初期10〜15分→30〜45分', en: 'Start 10–15 min, progress to 30–45 min' },
      type:        { ko: '보행, 자전거 에르고미터 (충격 최소화)', ja: '歩行・自転車エルゴ', en: 'Walking, cycle ergometer (low impact)' },
      volume:      { ko: '≥900 MET-min/주', ja: '≥900 MET-min/週', en: '≥900 MET-min/week target' },
      progression: { ko: '2주마다 재평가, LVEF·BNP 추적 후 결정', ja: '2週ごとにLVEF·BNP追跡', en: 'Re-evaluate every 2 weeks; guided by LVEF and BNP trends' },
    },
    contraindications: [
      { id: 'HF-CI-1', level: 'absolute', label: { ko: '최근 4주 내 비대상성 악화', ja: '4週内の非代償性増悪', en: 'Decompensated HF within 4 weeks' }, mechanism: { ko: '폐부종 악화 위험', ja: '肺水腫増悪リスク', en: 'Risk of acute pulmonary oedema' } },
      { id: 'HF-CI-2', level: 'absolute', label: { ko: '안정 시 SBP >180 또는 <90 mmHg', ja: 'SBP>180/<90 mmHg', en: 'Resting SBP >180 or <90 mmHg' }, mechanism: { ko: '심장 후부하 급변으로 허탈', ja: '後負荷急変で虚脱', en: 'Acute afterload fluctuation → cardiovascular collapse' } },
    ],
    clinicalNote: { ko: '베타차단제 복용 시 HRmax 기반 처방 신뢰도 저하 → RPE 또는 HRV 기반 처방 권장.', ja: 'β遮断薬服用時はRPEまたはHRVベース処方を推奨。', en: 'β-blockers blunt HR response; switch to RPE or HRV-based intensity prescription.' },
  },
  {
    condition: 'COPD', conditionLabel: { ko: '만성 폐쇄성 폐질환 (GOLD II-III)', ja: 'COPD GOLD II-III', en: 'COPD (GOLD Grade II-III)' },
    parameters: {
      frequency:   { ko: '주 3~5회 (초기 3회부터)', ja: '週3〜5回', en: '3–5 days/week (start with 3)' },
      intensity:   { ko: 'RPE 12~14 / SpO₂ ≥88% 유지', ja: 'RPE 12〜14 / SpO₂≥88%維持', en: 'RPE 12–14; maintain SpO₂ ≥88%' },
      time:        { ko: '20~30분 (간헐적도 허용: 10분×3)', ja: '20〜30分（間欠も可）', en: '20–30 min (interval: 10 min ×3 acceptable)' },
      type:        { ko: '보행 + 상지 에르고미터 + 호흡 재훈련', ja: '歩行＋上肢エルゴ＋呼吸再訓練', en: 'Walking + upper-limb ergometer + breathing retraining' },
      volume:      { ko: '≥600 MET-min/주 (초기 목표)', ja: '≥600 MET-min/週', en: '≥600 MET-min/week (initial target)' },
      progression: { ko: '4~6주마다 Borg dyspnea 점수 확인 후 진행', ja: '4〜6週毎にBorg息切れ確認', en: 'Advance every 4–6 weeks based on Borg dyspnoea score' },
    },
    contraindications: [
      { id: 'COPD-CI-1', level: 'absolute', label: { ko: '운동 중 SpO₂ <88%', ja: '運動中SpO₂<88%', en: 'SpO₂ <88% during exercise' }, mechanism: { ko: '심각한 저산소혈증 → 조직 손상', ja: '重篤な低酸素血症→組織損傷', en: 'Severe hypoxaemia → tissue injury; supplemental O₂ required' } },
      { id: 'COPD-CI-2', level: 'high',     label: { ko: '급성 악화 후 4주 이내', ja: '急性増悪後4週以内', en: 'Within 4 weeks of acute exacerbation' }, mechanism: { ko: '기도 염증 잔존으로 과부하 시 악화', ja: '気道炎症残存で過負荷時増悪', en: 'Residual airway inflammation; exercise load may trigger exacerbation' } },
    ],
    clinicalNote: { ko: '지속 SpO₂ 모니터링 필수. 운동 전 SABA 흡입제 준비. 호흡 패턴 재훈련(횡격막 호흡, 입술 오므리기 호흡)을 운동과 병행.', ja: 'SpO₂継続モニタリング必須。運動前SABA吸入準備。横隔膜呼吸・口すぼめ呼吸を運動と併用。', en: 'Continuous SpO₂ monitoring essential. Have rescue SABA inhaler available. Incorporate diaphragmatic and pursed-lip breathing retraining.' },
  },
  {
    condition: 'Osteoporosis', conditionLabel: { ko: '골다공증 / 골감소증', ja: '骨粗鬆症/骨減少症', en: 'Osteoporosis / Osteopenia' },
    parameters: {
      frequency:   { ko: '주 3~4회 (저항 운동 격일)', ja: '週3〜4回', en: '3–4 days/week (resistance on alternate days)' },
      intensity:   { ko: '중강도 저항 (60~80% 1RM) + 충격 운동 (걷기/계단)', ja: '60〜80% 1RM＋衝撃運動', en: 'Moderate resistance 60–80% 1RM + weight-bearing impact (walking/stair climbing)' },
      time:        { ko: '저항 20~30분 + 유산소 30분', ja: '抵抗20〜30分＋有酸素30分', en: '20–30 min resistance + 30 min aerobic' },
      type:        { ko: '중력 부하 운동, 저항 운동, 균형 훈련', ja: '重力負荷・抵抗・バランス訓練', en: 'Weight-bearing, resistance, and balance training' },
      volume:      { ko: '주 2~3세트 × 8~12회 (주요 근군)', ja: '週2〜3×8〜12回', en: '2–3 sets × 8–12 reps for major muscle groups' },
      progression: { ko: '3개월마다 DXA 추적, FRAX 점수 모니터링', ja: '3ヶ月毎にDXA追跡', en: 'Track DXA every 3–6 months; monitor FRAX fracture risk score' },
    },
    contraindications: [
      { id: 'OSTEO-CI-1', level: 'absolute', label: { ko: '최근 6주 이내 골절', ja: '6週以内の骨折', en: 'Fracture within last 6 weeks' }, mechanism: { ko: '미완성 골 가골 형성 중 부하 → 재골절', ja: '仮骨形成中の負荷→再骨折', en: 'Loading on immature callus → re-fracture' } },
      { id: 'OSTEO-CI-2', level: 'high',     label: { ko: 'T-score ≤ -3.5 + 척추 압박골절 기왕력', ja: 'T-score≤-3.5＋椎体骨折歴', en: 'T-score ≤ −3.5 with prior vertebral compression fracture' }, mechanism: { ko: '고충격 운동 시 추가 척추 압박 위험', ja: '高衝撃運動で追加椎体圧迫リスク', en: 'High-impact activity risks additional vertebral compression' } },
    ],
    clinicalNote: { ko: '낙상 예방 균형 훈련 필수 병행. 비스포스포네이트 복용 환자는 식도 자극 최소화를 위해 운동 전 30분 공복 유지. 충격 운동은 피부질환, 통증이 없는 범위에서 시행.', ja: '転倒予防バランス訓練必須。ビスホスホネート服用患者は服薬30分後に運動開始。', en: 'Balance/fall prevention training is mandatory. For bisphosphonate users, allow 30 min post-dose before exercise. Avoid high-impact if spinal fracture risk is elevated.' },
  },
  {
    condition: 'CLBP', conditionLabel: { ko: '만성 요통 (Non-specific CLBP)', ja: '非特異的慢性腰痛', en: 'Chronic Low Back Pain (Non-specific)' },
    parameters: {
      frequency:   { ko: '주 3~5회', ja: '週3〜5回', en: '3–5 days/week' },
      intensity:   { ko: 'VAS ≤4 범위 내 중강도 / RPE 10~13', ja: 'VAS≤4範囲内中強度', en: 'Moderate intensity within VAS ≤4; RPE 10–13' },
      time:        { ko: '30~45분 (코어 안정화 10분 포함)', ja: '30〜45分（コア安定化10分含む）', en: '30–45 min including 10 min core stabilisation' },
      type:        { ko: '코어 안정화, 수중 운동, McKenzie 운동, 보행', ja: 'コア安定化・水中運動・マッケンジー', en: 'Core stabilisation, aquatic exercise, McKenzie method, walking' },
      volume:      { ko: '코어 세트: 2~3세트 × 10~15초 등척성 유지', ja: 'コア: 2〜3×10〜15秒等尺性', en: '2–3 sets × 10–15 s isometric holds for core' },
      progression: { ko: '2주마다 VAS 재평가. 6주 후 동적 부하 운동 도입 검토.', ja: '2週ごとにVAS再評価。6週後に動的負荷運動導入検討。', en: 'Re-assess VAS every 2 weeks. Consider dynamic loading at 6 weeks if pain controlled.' },
    },
    contraindications: [
      { id: 'CLBP-CI-1', level: 'absolute', label: { ko: 'Red flag 증상 (마미총 증후군 의심)', ja: 'Red flag（馬尾症候群疑い）', en: 'Red flag signs (suspected cauda equina syndrome)' }, mechanism: { ko: '대소변 장애, 안장 마취 → 즉각 신경외과 의뢰', ja: '膀胱直腸障害→即時神経外科紹介', en: 'Bladder/bowel dysfunction + saddle anaesthesia → emergency neurosurgical referral' } },
      { id: 'CLBP-CI-2', level: 'high',     label: { ko: '운동 중 방사통 악화', ja: '運動中放散痛増悪', en: 'Radicular pain worsening during exercise' }, mechanism: { ko: '신경근 자극 악화 → 부하 즉시 중단', ja: '神経根刺激増悪→即時中止', en: 'Worsening nerve root irritation; stop loading immediately' } },
    ],
    clinicalNote: { ko: '두려움-회피 신념(Fear-Avoidance Beliefs)이 있는 환자는 통증 교육(Pain Neuroscience Education) 병행 필수. 과도한 안정은 오히려 만성화를 촉진함.', ja: 'Fear-Avoidance信念がある患者はPNE（疼痛神経科学教育）を必須併用。過度な安静は慢性化を促進。', en: 'Patients with Fear-Avoidance Beliefs require concurrent Pain Neuroscience Education. Prolonged rest accelerates chronification.' },
  },
];

// ── 병태생리 메커니즘 ────────────────────────────────────────

export interface MechanismStep {
  order: number; label: LocalizedText; detail: LocalizedText;
}
export interface ClinicalMechanism {
  id: string; title: LocalizedText; category: LocalizedText;
  steps: MechanismStep[]; clinicalImplication: LocalizedText; keyMolecule: string;
}

export const CLINICAL_MECHANISMS: ClinicalMechanism[] = [
  {
    id: 'MECH-HYPOCA',
    title:    { ko: '저칼슘혈증 유발 근육 수축 장애', ja: '低Ca²⁺血症による筋収縮障害', en: 'Hypocalcaemia-Induced Contractile Failure' },
    category: { ko: '전해질 병태생리', ja: '電解質病態生理', en: 'Electrolyte Pathophysiology' },
    keyMolecule: 'TroponinC_Ca2+',
    steps: [
      { order: 1, label: { ko: '혈청 Ca²⁺ 감소', ja: '血清Ca²⁺低下', en: 'Serum Ca²⁺ drop' }, detail: { ko: '칼슘 섭취 부족(노인, 비타민D 결핍) → 이온화 Ca²⁺ <1.1 mmol/L', ja: 'Ca²⁺摂取不足→イオン化Ca²⁺<1.1 mmol/L', en: 'Dietary Ca²⁺ deficiency / vitamin D insufficiency → ionised Ca²⁺ <1.1 mmol/L' } },
      { order: 2, label: { ko: '트로포닌 C 결합 부전', ja: 'TnC結合不全', en: 'Troponin C binding failure' }, detail: { ko: 'Ca²⁺이 TnC의 EF-hand 도메인에 결합 불능 → 트로포마이오신이 액틴의 미오신 결합부위 차단 지속', ja: 'Ca²⁺がTnC EF-handに結合できずトロポミオシンが遮蔽継続', en: 'Ca²⁺ fails to bind TnC EF-hand → tropomyosin remains blocking actin-myosin binding site' } },
      { order: 3, label: { ko: '가교 형성 불가', ja: 'クロスブリッジ形成不能', en: 'Cross-bridge cycle arrest' }, detail: { ko: '크로스브리지 사이클 개시 불가 → 수축력 생성 실패', ja: 'クロスブリッジサイクル開始不能', en: 'Cross-bridge cycle cannot initiate; force generation fails' } },
      { order: 4, label: { ko: '역설적 과흥분 (테타니)', ja: 'テタニー', en: 'Paradoxical tetany' }, detail: { ko: '막전위 불안정 → 말초 신경 과흥분 → 불수의 강직 수축, Chvostek 징후', ja: '膜電位不安定→末梢神経過興奮→Chvostek徴候', en: 'Membrane depolarisation instability → peripheral nerve hyperexcitability → involuntary tetanic contraction, Chvostek/Trousseau signs' } },
    ],
    clinicalImplication: { ko: '재활 중 근력 저하가 예상보다 심하거나 불수의 경련 시 albumin-corrected Ca²⁺ 즉시 측정. 비타민D(25-OH-D) 동시 확인 필수.', ja: 'リハビリ中の筋力低下が著しい場合、アルブミン補正Ca²⁺を即時測定。25-OH-D値を同時確認。', en: 'If strength deficit exceeds expectation or involuntary cramps occur, check albumin-corrected Ca²⁺ immediately. Always co-measure 25-OH-D.' },
  },
  {
    id: 'MECH-METFATIGUE',
    title:    { ko: 'ATP 고갈로 인한 근육 이완 불능', ja: 'ATP枯渇による筋弛緩不能', en: 'ATP Depletion and Contracture (Rigor-like State)' },
    category: { ko: '대사성 피로 병태생리', ja: '代謝性疲労病態生理', en: 'Metabolic Fatigue Pathophysiology' },
    keyMolecule: 'SERCA_ATP',
    steps: [
      { order: 1, label: { ko: 'PCr·ATP 고갈', ja: 'PCr·ATP枯渇', en: 'PCr and ATP depletion' }, detail: { ko: '고강도 운동 지속 → 해당계 가속, Pi 축적, pH 저하 → 세포 내 ATP 임계치 이하', ja: '高強度運動継続→Pi蓄積・pH低下→ATP臨界値以下', en: 'Sustained high-intensity exercise → accelerated glycolysis, Pi accumulation, pH fall → intracellular ATP below critical threshold' } },
      { order: 2, label: { ko: 'SERCA 기능 정지', ja: 'SERCAポンプ停止', en: 'SERCA pump failure' }, detail: { ko: 'SR의 Ca²⁺-ATPase(SERCA)는 ATP 의존적 → 고갈 시 Ca²⁺ SR 재흡수 불능', ja: 'ATP依存のSERCA停止→SR内へのCa²⁺再取込み不能', en: 'SERCA (SR Ca²⁺-ATPase) is ATP-dependent; depletion prevents Ca²⁺ re-uptake into SR' } },
      { order: 3, label: { ko: '세포질 Ca²⁺ 잔류', ja: '細胞質Ca²⁺残留', en: 'Cytoplasmic Ca²⁺ entrapment' }, detail: { ko: 'Ca²⁺ TnC 결합 지속 + 크로스브리지 분리용 ATP 부재 → 이완 불능', ja: 'Ca²⁺がTnCに結合し続ける→クロスブリッジ解離不能', en: 'Persistent Ca²⁺-TnC binding; no ATP available for cross-bridge detachment → contracture' } },
      { order: 4, label: { ko: '사후강직 유사 수축 지속', ja: '死後硬直類似収縮', en: 'Rigor-like contracture' }, detail: { ko: '생체 내 경량 사후강직 → 회복 시 가역적이나 반복 시 EIMD', ja: '生体内軽症死後硬直→繰り返しでEIMD', en: 'In-vivo rigor-like state; reversible on ATP restoration, but repeated episodes risk EIMD' } },
    ],
    clinicalImplication: { ko: '갑작스러운 경직 호소 시 단순 젖산 피로가 아닌 ATP-Ca²⁺ 연계 기전 점검. 능동 회복 프로토콜 + 크레아틴 재충전 고려.', ja: '突然の硬直訴えはATP-Ca²⁺機序を確認。積極的回復＋クレアチン再充填を検討。', en: 'Sudden muscle stiffness suggests ATP-Ca²⁺ mechanism; rule out simple lactate fatigue. Apply active recovery + creatine phosphate repletion.' },
  },
  {
    id: 'MECH-MTOR',
    title:    { ko: 'mTORC1-리보솜 경유 근단백질 합성 기전', ja: 'mTORC1を介した筋タンパク質合成機序', en: 'mTORC1-Ribosomal Pathway of Muscle Protein Synthesis' },
    category: { ko: '분자 근생리학', ja: '分子筋生理学', en: 'Molecular Muscle Physiology' },
    keyMolecule: 'mTORC1_S6K1_4EBP1',
    steps: [
      { order: 1, label: { ko: '류신 문턱값 도달', ja: 'ロイシン閾値到達', en: 'Leucine threshold reached' }, detail: { ko: '근세포 내 류신 ≥2.5 g 섭취 → Sestrin2 해리 → GATOR2 활성화', ja: '細胞内ロイシン≥2.5g→Sestrin2解離→GATOR2活性化', en: 'Intracellular leucine ≥2.5 g → Sestrin2 dissociates from GATOR complex → GATOR2 activation' } },
      { order: 2, label: { ko: 'mTORC1 Lysosome 이동 및 활성화', ja: 'mTORC1リソソーム移行・活性化', en: 'mTORC1 lysosomal recruitment and activation' }, detail: { ko: 'Rag GTPase 활성화 → mTORC1이 lysosome 표면으로 이동 → Rheb에 의해 활성화', ja: 'Rag GTPase活性化→mTORC1がリソソーム表面へ移行→Rhebにより活性化', en: 'Rag GTPase activation → mTORC1 recruited to lysosomal surface → activated by Rheb GTPase' } },
      { order: 3, label: { ko: 'S6K1 인산화 → 리보솜 S6 단백질 활성화', ja: 'S6K1リン酸化→リボソームS6活性化', en: 'S6K1 phosphorylation → ribosomal S6 protein activation' }, detail: { ko: 'mTORC1 → S6K1(Thr389) 인산화 → RPS6 인산화 → 리보솜 mRNA 번역 용량 증가', ja: 'mTORC1→S6K1 Thr389リン酸化→RPS6活性化→mRNA翻訳容量増大', en: 'mTORC1 phosphorylates S6K1 at Thr389 → S6K1 activates ribosomal protein S6 → increased ribosomal translational capacity' } },
      { order: 4, label: { ko: '4E-BP1 탈인산화 해제 → eIF4E 활성화', ja: '4E-BP1脱リン酸化解除→eIF4E活性化', en: '4E-BP1 phosphorylation releases eIF4E' }, detail: { ko: 'mTORC1이 4E-BP1을 인산화 → eIF4E 해방 → eIF4F 복합체 형성 → 5′-cap 의존 번역 개시', ja: '4E-BP1リン酸化→eIF4E解放→5′-cap依存翻訳開始', en: 'mTORC1 phosphorylates 4E-BP1 → releases eIF4E → assembles eIF4F cap-binding complex → initiates cap-dependent translation' } },
      { order: 5, label: { ko: '근원섬유 단백질 합성 증가', ja: '筋原線維タンパク質合成増加', en: 'Myofibrillar protein synthesis upregulation' }, detail: { ko: '마이오신 중쇄(MHC), 액틴, 트로포닌 등 구조 단백질 번역 증가 → 근비대', ja: 'MHC・アクチン等の構造タンパク質翻訳増加→筋肥大', en: 'Increased translation of myosin heavy chain, actin, troponin → myofibrillar hypertrophy over 24–72 h post-exercise' } },
    ],
    clinicalImplication: { ko: '운동 후 1~2시간 내 류신 풍부 단백질(유청: 류신 10~11%) 섭취 시 mTORC1 최대 활성화. 65세 이상에서는 mTORC1 반응 둔화(Anabolic Resistance) → 1회 단백질 섭취량 증량 필요(0.4→0.6 g/kg).', ja: '運動後1〜2時間内にロイシン豊富タンパク質摂取でmTORC1最大活性化。65歳以上はAnabolic Resistance→摂取量増量が必要。', en: 'Ingest leucine-rich protein (whey: ~10–11% leucine) within 1–2 h post-exercise for maximal mTORC1 activation. In adults ≥65, anabolic resistance necessitates higher single-meal dose (0.6 g/kg vs. 0.4 g/kg).' },
  },
  {
    id: 'MECH-MITOBIO',
    title:    { ko: 'PGC-1α 경유 미토콘드리아 생합성', ja: 'PGC-1αを介したミトコンドリア生合成', en: 'PGC-1α-Mediated Mitochondrial Biogenesis' },
    category: { ko: '분자 근생리학', ja: '分子筋生理学', en: 'Molecular Muscle Physiology' },
    keyMolecule: 'PGC1α_AMPK_TFAM',
    steps: [
      { order: 1, label: { ko: 'AMPK 활성화', ja: 'AMPK活性化', en: 'AMPK activation' }, detail: { ko: 'AMP/ATP 비율 상승(운동 시) → AMPK(AMP-activated protein kinase) Thr172 인산화 → 세포 에너지 센서 ON', ja: 'AMP/ATP比上昇→AMPKがThr172リン酸化→細胞エネルギーセンサーON', en: 'Rising AMP:ATP ratio during exercise → AMPK phosphorylation at Thr172 → cellular energy sensor activated' } },
      { order: 2, label: { ko: 'PGC-1α 발현 및 핵 이동', ja: 'PGC-1α発現・核移行', en: 'PGC-1α induction and nuclear translocation' }, detail: { ko: 'AMPK → PGC-1α 전사 활성화 + 탈아세틸화(SIRT1) → 핵 내 이동 → NRF1/NRF2 전사인자 결합', ja: 'AMPK→PGC-1α転写活性化・脱アセチル化(SIRT1)→核内移行→NRF1/NRF2結合', en: 'AMPK activates PGC-1α transcription; SIRT1 deacetylates PGC-1α → nuclear translocation → co-activates NRF1 and NRF2 transcription factors' } },
      { order: 3, label: { ko: 'TFAM 발현 → mtDNA 전사', ja: 'TFAM発現→mtDNA転写', en: 'TFAM induction → mtDNA transcription' }, detail: { ko: 'NRF1/2 → TFAM(미토콘드리아 전사인자 A) 발현 증가 → mtDNA 복제 및 전사 활성화 → ETC 복합체 서브유닛 합성', ja: 'NRF→TFAM発現増加→mtDNA複製・転写→ETCサブユニット合成', en: 'NRF1/2 drive TFAM expression → TFAM binds D-loop, initiating mtDNA replication and transcription → synthesis of ETC complex subunits' } },
      { order: 4, label: { ko: '미토콘드리아 융합·분열 균형 최적화', ja: 'ミトコンドリア融合・分裂均衡最適化', en: 'Mitochondrial fusion-fission dynamics optimised' }, detail: { ko: 'Mfn1/Mfn2 융합 단백질 증가 → 네트워크 형성 → 산화적 인산화 효율 향상. 손상 미토콘드리아는 Drp1-의존 분열 후 미토파지(Mitophagy)로 제거.', ja: 'Mfn1/2融合タンパク質増加→ネットワーク形成→酸化的リン酸化効率向上。損傷分はDrp1依存分裂後ミトファジーで除去。', en: 'Mfn1/Mfn2 fusion proteins upregulated → mitochondrial network formation → enhanced OXPHOS efficiency. Damaged mitochondria removed via Drp1-driven fission + mitophagy.' } },
      { order: 5, label: { ko: '미토콘드리아 밀도 증가 → VO₂max 향상', ja: 'ミトコンドリア密度増加→VO₂max向上', en: 'Increased mitochondrial density → improved VO₂max' }, detail: { ko: '지속 유산소 운동 6~12주: 미토콘드리아 용적 밀도 25~40% 증가, 사이토크롬 c 산화효소 활성 증가 → 최대 산소 섭취량 향상', ja: '有酸素運動6〜12週でミトコンドリア容積密度25〜40%増加→VO₂max向上', en: '6–12 weeks of endurance training: mitochondrial volume density increases 25–40%; cytochrome c oxidase activity rises → measurable VO₂max improvement' } },
    ],
    clinicalImplication: { ko: '비활동 기간 2주만으로도 PGC-1α 발현 감소 시작. 장기 입원 환자의 재활은 저강도 인터벌(HIIT)로 AMPK-PGC-1α 축을 조기 활성화하는 것이 효과적.', ja: '非活動2週間でPGC-1α発現減少開始。長期入院患者は低強度HIITでAMPK-PGC-1α軸を早期活性化。', en: 'As little as 2 weeks of inactivity begins reducing PGC-1α expression. For prolonged-bed-rest patients, low-intensity HIIT effectively reactivates the AMPK-PGC-1α axis early in rehabilitation.' },
  },
  {
    id: 'MECH-NMJ',
    title:    { ko: '신경근 접합부 피로 기전', ja: '神経筋接合部疲労機序', en: 'Neuromuscular Junction Fatigue' },
    category: { ko: '신경근 생리학', ja: '神経筋生理学', en: 'Neuromuscular Physiology' },
    keyMolecule: 'ACh_AChE_nAChR',
    steps: [
      { order: 1, label: { ko: 'ACh 소포 고갈', ja: 'ACh小胞枯渇', en: 'ACh vesicle depletion' }, detail: { ko: '지속적 신경 자극 → 운동신경 말단의 ACh 소포(Synaptic vesicle) 방출 속도 > 재합성 속도 → 가용 ACh 감소', ja: '持続的神経刺激→ACh小胞放出>再合成→利用可能ACh減少', en: 'Sustained motor nerve firing → vesicle exocytosis rate exceeds resynthesis rate → available ACh pool depleted' } },
      { order: 2, label: { ko: 'EPP(종판전위) 감소', ja: 'EPP低下', en: 'End-plate potential (EPP) reduction' }, detail: { ko: '방출되는 ACh 양자(Quanta) 감소 → 종판전위(EPP) 크기 감소 → 근섬유 활동전위 역치 도달 실패', ja: '放出量子減少→EPP低下→活動電位閾値未達', en: 'Reduced ACh quanta release → smaller EPP amplitude → fails to reach muscle fibre action potential threshold → transmission block' } },
      { order: 3, label: { ko: 'AChE 축적 및 콜린 재흡수 경쟁', ja: 'AChE蓄積・コリン再取込み競合', en: 'AChE accumulation and choline re-uptake competition' }, detail: { ko: 'acetylcholinesterase(AChE)는 정상 작동하나 ACh 감소로 시냅스 간격 내 비효율적 신호 전달 → EMG 진폭 감소', ja: 'AChEは正常動作するがACh減少で非効率な信号伝達→EMG振幅減少', en: 'AChE continues hydrolysing ACh, but reduced substrate leads to inefficient synaptic transmission → measurable EMG amplitude decline' } },
      { order: 4, label: { ko: 'EMG 진폭 감소 + 운동 단위 동원 변화', ja: 'EMG振幅減少＋運動単位動員変化', en: 'EMG amplitude decline + motor unit recruitment shifts' }, detail: { ko: '피로 시 고역치 운동 단위(Fast-twitch) 동원 감소 → 저역치 단위(Slow-twitch)로 보상 → 힘 생성 한계', ja: '疲労時に高閾値MU動員減少→低閾値MUで代償→力生成限界', en: 'High-threshold (fast-twitch) motor unit recruitment declines; low-threshold units compensate → force production ceiling reached' } },
    ],
    clinicalImplication: { ko: '신경근 접합부 피로는 중추 피로와 달리 말초성. EMG 기반 근전도 바이오피드백으로 임상 모니터링 가능. 중증 근무력증(MG) 환자에서 이 기전이 병적으로 가속됨 → 피로 후 충분한 휴식 보장.', ja: 'NMJ疲労は末梢性。EMGバイオフィードバックで臨床モニタリング可能。重症筋無力症ではこの機序が病的加速。', en: 'NMJ fatigue is peripheral, distinct from central fatigue. Monitored clinically via EMG-based biofeedback. Pathologically accelerated in myasthenia gravis → ensure adequate post-exercise rest intervals.' },
  },
  {
    id: 'MECH-DOMS',
    title:    { ko: 'DOMS (지연성 근육통) 세포 기전', ja: 'DOMS細胞機序', en: 'DOMS — Cellular Mechanism of Delayed-Onset Muscle Soreness' },
    category: { ko: '근손상 병태생리', ja: '筋損傷病態生理', en: 'Muscle Injury Pathophysiology' },
    keyMolecule: 'Z-disc_Titin_IL6',
    steps: [
      { order: 1, label: { ko: '편심성 수축 시 Z-disc 구조 손상', ja: '離心性収縮でZ-disc損傷', en: 'Z-disc disruption during eccentric contraction' }, detail: { ko: '편심성 수축 시 근절이 과신장 → titin 분자 스프링 초과 부하 → Z-disc 구조 불연속(Z-streaming)', ja: '筋節が過伸張→titinスプリング過負荷→Z-disc不連続（Z-streaming）', en: 'Sarcomere overstretching during eccentric contraction → titin spring overloaded → Z-disc structural discontinuity (Z-streaming observed on electron microscopy)' } },
      { order: 2, label: { ko: '세포 내 Ca²⁺ 유출 및 프로테아제 활성화', ja: '細胞内Ca²⁺流出・プロテアーゼ活性化', en: 'Ca²⁺ leakage and protease activation' }, detail: { ko: 'SR 손상 → 세포질 Ca²⁺ 과부하 → 칼페인(Calpain) 활성화 → 세포골격 단백질 분해(desmin, α-actinin)', ja: 'SR損傷→細胞質Ca²⁺過負荷→Calpain活性化→細胞骨格タンパク質分解', en: 'Damaged SR → cytoplasmic Ca²⁺ overload → calpain activation → proteolysis of desmin and α-actinin (structural proteins)' } },
      { order: 3, label: { ko: '염증 캐스케이드 개시 (IL-6, TNF-α)', ja: '炎症カスケード開始', en: 'Inflammatory cascade initiation' }, detail: { ko: '손상된 근섬유 → IL-6, TNF-α 방출 → 호중구 먼저 침윤(0~24h) → 대식세포 후속 침윤(24~72h) → PGE2, 브래디키닌 방출 → 통각수용체(Nociceptor) 감작', ja: '損傷筋→IL-6・TNF-α放出→好中球→マクロファージ浸潤→PGE2・ブラジキニン→侵害受容器感作', en: 'Damaged myofibres release IL-6 and TNF-α → neutrophil infiltration (0–24 h) → macrophage influx (24–72 h) → PGE2 and bradykinin release → nociceptor sensitisation' } },
      { order: 4, label: { ko: '위성 세포 활성화 → 재생', ja: '衛星細胞活性化→再生', en: 'Satellite cell activation → repair' }, detail: { ko: 'HGF, MGF 신호 → Pax7⁺ 위성 세포 증식 → MyoD 발현 → 근관(Myotube) 형성 → 근섬유 재생 완성 (48~168h)', ja: 'HGF・MGF→Pax7⁺衛星細胞増殖→MyoD発現→筋管形成→再生完成', en: 'HGF and MGF signals activate Pax7⁺ satellite cells → MyoD expression → myotube formation → fibre repair completed 48–168 h post-injury' } },
    ],
    clinicalImplication: { ko: 'DOMS를 손상 신호로 오인해 완전 휴식 처방 시 회복 지연. 저강도 능동 회복(Active Recovery)이 혈류 증가를 통해 염증 대사산물 제거를 촉진. NSAIDs 과용 시 위성 세포 활성화 억제 → 장기 근적응 저해 가능.', ja: 'DOMSを損傷と誤判断し安静処方すると回復遅延。低強度Active Recoveryが炎症代謝物除去を促進。NSAIDs過剰使用は衛星細胞活性化を抑制する可能性あり。', en: 'Prescribing full rest for DOMS delays recovery. Low-intensity active recovery accelerates inflammatory metabolite clearance via increased blood flow. Excessive NSAID use may suppress satellite cell activation → impaired long-term muscle adaptation.' },
  },
  {
    id: 'MECH-DETRAIN',
    title:    { ko: '훈련 중단(Detraining) 생리학적 변화', ja: 'デトレーニングの生理学的変化', en: 'Detraining: Physiological Reversals' },
    category: { ko: '적응 역전 생리학', ja: '適応逆転生理学', en: 'Adaptive Reversal Physiology' },
    keyMolecule: 'VO2max_MHC_GLUT4',
    steps: [
      { order: 1, label: { ko: 'VO₂max 감소 시작 (1~2주)', ja: 'VO₂max低下開始（1〜2週）', en: 'VO₂max decline begins (Week 1–2)' }, detail: { ko: '훈련 중단 1~2주: 혈장량 감소(7~12%) → 일회박출량 감소 → 심박출량 감소 → VO₂max 4~7% 감소', ja: '中断1〜2週：血漿量減少7〜12%→一回拍出量減少→VO₂max 4〜7%低下', en: 'Week 1–2: Plasma volume falls 7–12% → stroke volume decreases → cardiac output drops → VO₂max declines 4–7%' } },
      { order: 2, label: { ko: '근섬유 유형 전환 시작 (3~4주)', ja: '筋線維タイプ転換開始（3〜4週）', en: 'Muscle fibre type shift begins (Week 3–4)' }, detail: { ko: 'Type I → Type IIa 전환 개시. MHC I 감소, MHC IIa 증가. 지근 섬유 효율 감소, 당원 의존성 증가', ja: 'Type I→IIa転換開始。MHC I減少・IIa増加。解糖依存性増大。', en: 'Type I → Type IIa fibre shift begins. MHC-I content decreases; MHC-IIa rises. Increased glycolytic reliance; oxidative capacity declines' } },
      { order: 3, label: { ko: '미토콘드리아 밀도 감소 (2~4주)', ja: 'ミトコンドリア密度低下（2〜4週）', en: 'Mitochondrial density loss (Week 2–4)' }, detail: { ko: 'PGC-1α 발현 감소 → 미토콘드리아 용적 최대 25~35% 감소 (4주). SDH, CS 효소 활성 저하', ja: 'PGC-1α発現低下→ミトコンドリア容積25〜35%減少。SDH・CS酵素活性低下。', en: 'PGC-1α downregulation → mitochondrial volume density decreases up to 25–35% by week 4; SDH and CS enzyme activities decline' } },
      { order: 4, label: { ko: 'GLUT4 발현 감소 → 인슐린 감수성 저하', ja: 'GLUT4発現低下→インスリン感受性低下', en: 'GLUT4 downregulation → impaired insulin sensitivity' }, detail: { ko: '운동 자극 감소 → 근육 내 GLUT4 단백질 발현 감소 → 포도당 흡수 감소 → 혈당 조절 악화 (당뇨 환자에서 특히 위험)', ja: 'GLUT4発現低下→グルコース取込み低下→血糖調節悪化（糖尿患者で特に危険）', en: 'Loss of exercise stimulus → muscle GLUT4 protein expression falls → reduced glucose uptake → worsening glycaemic control (critical in T2DM patients)' } },
    ],
    clinicalImplication: { ko: '수술 후 또는 부상으로 인한 2주 이상 비활동 시 심폐 기능 저하를 예상하고 재활 초기 강도를 이전 처방의 50~60%에서 시작. 당뇨 환자는 비활동 3일부터 GLUT4 감소로 혈당 상승 위험.', ja: '術後・受傷で2週以上非活動の場合、心肺機能低下を予想し初期強度は以前の50〜60%から。糖尿患者は非活動3日でGLUT4減少・血糖上昇リスク。', en: 'After ≥2 weeks of inactivity (post-surgery or injury), expect cardiopulmonary deconditioning; begin rehabilitation at 50–60% of prior prescription intensity. T2DM patients face GLUT4 decline and rising glycaemia within 3 days of inactivity.' },
  },
  {
    id: 'MECH-INFLAM',
    title:    { ko: '운동-염증 상호작용 및 IL-6 이중 역할', ja: '運動-炎症相互作用とIL-6の二重役割', en: 'Exercise-Inflammation Crosstalk and the Dual Role of IL-6' },
    category: { ko: '면역-근육 생리학', ja: '免疫-筋生理学', en: 'Immuno-Muscle Physiology' },
    keyMolecule: 'IL6_TNFα_IL10_Myokine',
    steps: [
      { order: 1, label: { ko: '운동 시 근육 유래 IL-6 급증 (Myokine)', ja: '運動時筋由来IL-6急増（Myokine）', en: 'Exercise-induced muscle IL-6 surge (myokine role)' }, detail: { ko: '수축 중인 근육 → IL-6 대량 방출(안정 시 대비 최대 100배) → 지방 분해(Lipolysis) 촉진, 간 포도당 신생합성 자극 → 에너지 공급 유지', ja: '収縮筋からIL-6大量放出（安静時比最大100倍）→脂肪分解促進・肝糖新生刺激', en: 'Contracting muscle releases IL-6 up to 100× resting levels → promotes lipolysis and hepatic gluconeogenesis → sustains energy supply during prolonged exercise' } },
      { order: 2, label: { ko: 'IL-6의 항염증 신호 → IL-10, IL-1ra 유도', ja: 'IL-6の抗炎症シグナル→IL-10・IL-1ra誘導', en: 'IL-6 drives anti-inflammatory cascade: IL-10 and IL-1ra induction' }, detail: { ko: '운동 유래 IL-6 → IL-10 및 IL-1 수용체 길항제(IL-1ra) 분비 촉진 → TNF-α, IL-1β 등 전염증성 사이토카인 억제', ja: '運動由来IL-6→IL-10・IL-1ra分泌促進→TNF-α・IL-1β等の前炎症性サイトカイン抑制', en: 'Exercise-derived IL-6 induces IL-10 and IL-1ra → suppresses pro-inflammatory cytokines (TNF-α, IL-1β) → net anti-inflammatory effect of regular exercise' } },
      { order: 3, label: { ko: '만성 질환 시 TNF-α 선행 → 친염증 IL-6 경로', ja: '慢性疾患時TNF-α先行→親炎症IL-6経路', en: 'Disease state: TNF-α precedes IL-6 → pro-inflammatory pathway' }, detail: { ko: '비만, 당뇨, 심부전 등 만성 질환: 지방조직·면역세포가 TNF-α 먼저 방출 → IL-6가 친염증성 역할로 전환 → 인슐린 저항성 악화 루프', ja: '肥満・糖尿等慢性疾患：脂肪組織・免疫細胞からTNF-α先行放出→IL-6が親炎症に転換→インスリン抵抗性悪化ループ', en: 'In obesity/T2DM/HF: adipose tissue and immune cells release TNF-α first → IL-6 switches to pro-inflammatory mode → creates vicious cycle worsening insulin resistance' } },
      { order: 4, label: { ko: '규칙적 운동의 염증 방어 메커니즘', ja: '規則的運動の炎症防御機序', en: 'How regular exercise confers anti-inflammatory protection' }, detail: { ko: '운동 반복 → 내장 지방 감소 → TNF-α 기저 수준 감소 → 운동 시 IL-6의 항염증 경로 우세 → 대사증후군 개선', ja: '運動反復→内臓脂肪減少→TNF-α基礎レベル低下→IL-6の抗炎症経路が優勢→代謝症候群改善', en: 'Repeated exercise → visceral fat reduction → lower baseline TNF-α → exercise-induced IL-6 remains in anti-inflammatory mode → metabolic syndrome improvement' } },
    ],
    clinicalImplication: { ko: '만성 질환 환자에서 초기 운동 시 일시적 염증 악화(Inflammatory flare)가 가능. 첫 2~4주는 저강도로 내장 지방 감소 유도 후 강도 점진 증가가 안전한 전략.', ja: '慢性疾患患者の初期運動時は一時的炎症悪化（flare）の可能性あり。最初2〜4週は低強度で内臓脂肪減少後に強度漸増が安全。', en: 'In chronic disease patients, initial exercise may transiently worsen inflammation. Strategy: 2–4 weeks of low-intensity exercise to reduce visceral fat first, then progressively increase intensity.' },
  },
];

// ── Clinical Pitfalls ────────────────────────────────────────

export type PitfallCategory = 'assessment' | 'prescription' | 'monitoring' | 'communication' | 'documentation' | 'nutrition' | 'return-to-sport';

export interface ClinicalPitfall {
  id: string; category: PitfallCategory; title: LocalizedText;
  description: LocalizedText; preventionTip: LocalizedText;
  severity: RiskLevel; checked: boolean;
}

export const CLINICAL_PITFALLS: ClinicalPitfall[] = [
  { id: 'PF-001', category: 'assessment', severity: 'high', checked: false,
    title:         { ko: 'Albumin-corrected Ca²⁺ 미확인', ja: 'アルブミン補正Ca²⁺未確認', en: 'Failing to correct Ca²⁺ for albumin' },
    description:   { ko: '총 칼슘만 확인하고 albumin 보정 미실시 시 저알부민혈증 환자에서 저칼슘혈증을 놓침', ja: '総カルシウムのみ確認→低アルブミン患者の低Ca²⁺見落とし', en: 'Checking only total Ca²⁺ without albumin correction misses hypocalcaemia in hypoalbuminaemic patients' },
    preventionTip: { ko: '보정 Ca = 혈청 Ca + 0.8 × (4.0 − albumin g/dL)', ja: '補正Ca=血清Ca+0.8×(4.0−アルブミン)', en: 'Corrected Ca = serum Ca + 0.8 × (4.0 − albumin g/dL)' } },
  { id: 'PF-002', category: 'prescription', severity: 'high', checked: false,
    title:         { ko: '베타차단제 복용 환자 HR 기반 처방 오류', ja: 'β遮断薬服用患者へのHR基準処方誤り', en: 'HR-based prescription error in β-blocker patients' },
    description:   { ko: '베타차단제는 운동 중 HR 반응을 둔화시켜 %HRmax 기반 강도가 실제보다 낮게 설정됨', ja: 'β遮断薬はHR反応を鈍化させ強度が低く設定される', en: 'β-blockers blunt HR response; %HRmax-based prescription underestimates actual exercise intensity' },
    preventionTip: { ko: 'RPE(Borg 6-20) 또는 VO₂ 기반 강도 설정으로 전환', ja: 'RPE（Borg 6-20）またはVO₂基準に切替', en: 'Switch to RPE (Borg 6-20 scale) or VO₂-based intensity prescription' } },
  { id: 'PF-003', category: 'monitoring', severity: 'high', checked: false,
    title:         { ko: '지연성 저혈당(야간) 모니터링 누락', ja: '遅発性低血糖（夜間）モニタリング見落とし', en: 'Missing nocturnal delayed hypoglycaemia' },
    description:   { ko: '인슐린 당뇨 환자에서 운동 후 6~12시간 후 저혈당 발생 가능. 운동 직후 혈당이 정상이어도 야간에 발생 사례 보고', ja: 'インスリン使用糖尿患者で運動6〜12時間後に低血糖発生の可能性', en: 'In insulin-treated T2DM, hypoglycaemia can occur 6–12 h post-exercise. Normal immediate post-exercise glucose does not exclude nocturnal events.' },
    preventionTip: { ko: '취침 전 혈당 측정 및 CGM 사용 권고', ja: '就寝前血糖測定・CGM使用推奨', en: 'Pre-bedtime glucose check; recommend CGM for high-risk patients' } },
  { id: 'PF-004', category: 'prescription', severity: 'moderate', checked: false,
    title:         { ko: 'DOMS를 운동 금기로 오판', ja: 'DOMSを運動禁忌と誤判断', en: 'Misclassifying DOMS as a contraindication to exercise' },
    description:   { ko: '지연성 근육통을 급성 손상으로 오해해 완전 휴식 처방 시 회복 지연', ja: 'DOMSを急性損傷と誤解し安静処方→回復遅延', en: 'Prescribing complete rest for DOMS (mistaken for acute injury) delays recovery and adaptation' },
    preventionTip: { ko: '저강도 Active Recovery 처방으로 혈류 증진 → 염증 대사산물 제거', ja: '低強度Active Recoveryで血流増進→炎症代謝物除去', en: 'Prescribe low-intensity active recovery to enhance blood flow and accelerate inflammatory metabolite clearance' } },
  { id: 'PF-005', category: 'assessment', severity: 'moderate', checked: false,
    title:         { ko: '근감소증 스크리닝 누락', ja: 'サルコペニアスクリーニング見落とし', en: 'Omitting sarcopenia screening in older adults' },
    description:   { ko: '65세 이상 환자에서 근력 평가 없이 운동 처방 시 과부하 위험. SARC-F 또는 악력 미실시', ja: '65歳以上で筋力評価なしに運動処方→過負荷リスク', en: 'Prescribing exercise to patients ≥65 without strength assessment risks overloading; SARC-F questionnaire or grip strength measurement often omitted' },
    preventionTip: { ko: 'EWGSOP2: 악력 <27 kg(남) / <16 kg(여) → 근감소증 의심 → 저항 운동 우선', ja: 'EWGSOP2: 握力<27/<16 kg→サルコペニア疑い→抵抗運動優先', en: 'EWGSOP2: Grip strength <27 kg (M) / <16 kg (F) → suspect sarcopenia → prioritise resistance training' } },
  { id: 'PF-006', category: 'communication', severity: 'moderate', checked: false,
    title:         { ko: '다학제 소통 없이 운동 강도 변경', ja: '多職種連携なしに運動強度変更', en: 'Altering exercise intensity without multidisciplinary communication' },
    description:   { ko: '협진과 공유 없이 강도 임의 조정 시 약물 조정 타이밍과 충돌 가능', ja: '協診共有なしに強度を独断変更→薬物調整タイミングと衝突', en: 'Unilateral intensity changes without notifying cardiology/endocrinology may conflict with medication titration timing' },
    preventionTip: { ko: '주요 강도 변경 전 EMR 협진 기록 또는 팀 회의 문서화', ja: '主要変更前にEMR協診記録またはチーム会議文書化', en: 'Document intensity changes in EMR and notify all relevant clinicians before implementation' } },
  { id: 'PF-007', category: 'documentation', severity: 'low', checked: false,
    title:         { ko: 'MET 값 기반 운동량 미기록', ja: 'MET値ベース運動量未記録', en: 'Failure to record exercise dose in MET-min' },
    description:   { ko: '"걷기 30분" 등 서술적 기록만으로는 강도 추적 불가. 보험 심사 및 과학적 비교에서 문제', ja: '記述的記録のみでは強度追跡不可。保険審査・科学的比較で問題', en: 'Narrative records ("walked 30 min") are insufficient for intensity tracking, insurance audits, and scientific comparison' },
    preventionTip: { ko: '표준 기록: 종류 + MET + 지속시간 = MET-min (예: 속보 4.0 × 30 = 120 MET-min)', ja: '標準: 種類+MET+時間=MET-min（例: 速歩4.0×30=120）', en: 'Standard record: modality + MET value + duration = MET-min (e.g., brisk walk 4.0 MET × 30 min = 120 MET-min)' } },
  { id: 'PF-008', category: 'monitoring', severity: 'high', checked: false,
    title:         { ko: '과훈련증후군(Overtraining)을 단순 피로로 오판', ja: '過訓練症候群を単純疲労と誤判断', en: 'Misidentifying overtraining syndrome as simple fatigue' },
    description:   { ko: '2주 이상 수행 능력 저하, 기분 장애, 안정 시 HR 상승이 동반될 때 과훈련 의심해야 함. 단순 휴식 지시만으로 관리 불충분', ja: '2週以上のパフォーマンス低下・気分障害・安静時HR上昇→過訓練疑い。単純休息のみでは不十分。', en: 'Performance decline >2 weeks combined with mood disturbance and elevated resting HR warrants overtraining syndrome workup; simple rest prescription is insufficient' },
    preventionTip: { ko: 'RESTQ-Sport 설문 + 안정 시 HRV 모니터링 + 2~6주 감량 훈련(Deload) 계획 수립', ja: 'RESTQ-Sport問診＋安静時HRVモニタリング＋2〜6週デロード計画', en: 'Administer RESTQ-Sport questionnaire; monitor resting HRV; plan 2–6 week deload period; consider hormonal workup (testosterone/cortisol ratio)' } },
  { id: 'PF-009', category: 'return-to-sport', severity: 'high', checked: false,
    title:         { ko: '복귀 시기 조기 허가 (근력 대칭성 미확인)', ja: '復帰時期の早期許可（筋力対称性未確認）', en: 'Premature return-to-sport clearance without symmetry testing' },
    description:   { ko: 'ACL 재건 후 Limb Symmetry Index <90% 상태에서 복귀 허가 시 재파열 위험 2.5~3배 증가', ja: 'ACL再建後LSI<90%での復帰許可→再断裂リスク2.5〜3倍増加', en: 'ACL reconstruction patients cleared for return with Limb Symmetry Index <90% face 2.5–3× higher re-rupture risk' },
    preventionTip: { ko: 'Isokinetic strength testing (LSI ≥90%), Hop test series 통과 후 복귀 허가. 심리적 준비도(ACL-RSI) 병행 평가', ja: 'Isokinetic LSI≥90%＋Hop testシリーズ通過後に復帰許可。ACL-RSI心理的準備度も評価。', en: 'Gate return-to-sport on: isokinetic LSI ≥90%, full hop test battery passed, and psychological readiness (ACL-RSI score ≥65)' } },
  { id: 'PF-010', category: 'assessment', severity: 'moderate', checked: false,
    title:         { ko: '성장판 골절 위험 무시 (소아·청소년 환자)', ja: '成長板骨折リスク無視（小児・青少年患者）', en: 'Overlooking physeal (growth plate) fracture risk in paediatric patients' },
    description:   { ko: '성장 중 소아·청소년에서 과도한 반복 부하 시 성장판이 인대보다 약해 견열 골절 위험. 성인과 동일한 프로토콜 적용 금지', ja: '成長中の小児・青少年では成長板が靭帯より弱く牽引骨折リスク。成人プロトコルそのまま適用禁止。', en: 'In growing athletes, the physis is weaker than ligaments → avulsion fracture risk under excessive repetitive loading. Adult protocols must not be applied without modification.' },
    preventionTip: { ko: 'Risser stage 확인(골성숙도). 고강도 충격 운동은 Risser 2 이상에서만 허가. Sever병/Osgood-Schlatter 선별 검사 포함', ja: 'Risser stage確認（骨成熟度）。高強度衝撃はRisser 2以上で許可。Sever病・Osgood-Schlatter選別検査実施。', en: 'Assess skeletal maturity via Risser stage; restrict high-impact loading until Risser ≥2; screen for Sever disease (calcaneal apophysitis) and Osgood-Schlatter lesion' } },
  { id: 'PF-011', category: 'nutrition', severity: 'moderate', checked: false,
    title:         { ko: '단백질 섭취 타이밍 무시 (재활 중)', ja: 'タンパク質摂取タイミング無視', en: 'Ignoring protein intake timing during rehabilitation' },
    description:   { ko: '운동 후 2시간 이상 경과 후 단백질 섭취 시 mTORC1 활성 감소로 근합성 기회 손실. 입원 재활 식이 관리에서 자주 발생', ja: '運動後2時間以上経過後のタンパク質摂取でmTORC1活性低下。入院リハビリ食事管理で頻発。', en: 'Protein intake >2 h post-exercise substantially reduces mTORC1 activation; missed MPS opportunity commonly occurs in inpatient rehabilitation diet scheduling' },
    preventionTip: { ko: '운동 후 30~60분 내 류신 풍부 단백질 20~40g 섭취. 입원 환자는 재활 스케줄에 맞춘 식이 처방 조정 요청', ja: '運動後30〜60分以内にロイシン豊富タンパク質20〜40g摂取。入院患者はリハスケジュールに合わせた食事処方調整を要請。', en: 'Ingest 20–40 g leucine-rich protein within 30–60 min post-exercise. For inpatients, coordinate with dietitian to adjust meal timing around rehabilitation schedule.' } },
  { id: 'PF-012', category: 'monitoring', severity: 'moderate', checked: false,
    title:         { ko: 'Post-COVID 운동 불내성 과소평가', ja: 'Post-COVID運動不耐性の過小評価', en: 'Underestimating post-COVID exercise intolerance' },
    description:   { ko: 'COVID-19 이후 지속적 피로, 운동 후 증상 악화(PEM: Post-Exertional Malaise)가 있는 환자에서 표준 재활 강도 적용 시 증상 급격히 악화', ja: 'COVID後のPEM患者に標準リハ強度適用→症状急悪化', en: 'Patients with post-COVID condition and PEM (Post-Exertional Malaise) experience symptom flares when standard exercise intensity is applied; common in Long COVID' },
    preventionTip: { ko: 'PEM 스크리닝 먼저 실시. PEM 양성 시 심박수 혐기성 역치(AT HR) 10 bpm 이하의 극초저강도부터 시작. 페이싱(Pacing) 전략 교육 필수', ja: 'PEMスクリーニング実施後、AT HR-10bpm以下の超低強度から開始。ペーシング戦略教育必須。', en: 'Screen for PEM first. If positive: start at intensity ≤10 bpm below anaerobic threshold HR; teach pacing strategy; avoid "push through" approach' } },
  { id: 'PF-013', category: 'prescription', severity: 'moderate', checked: false,
    title:         { ko: '과도한 냉치료(Icing) 적용', ja: '過度なアイシング適用', en: 'Excessive or prolonged cryotherapy application' },
    description:   { ko: '급성 손상 후 48시간 이상 지속적 냉치료는 위성 세포 활성화와 염증 해소 과정을 방해. RICE → PEACE&LOVE 패러다임 전환 필요', ja: '48時間以上の持続的アイシングは衛星細胞活性化と炎症解消を阻害。RICE→PEACE&LOVE転換が必要。', en: 'Continuous cryotherapy >48 h impairs satellite cell activation and inflammatory resolution; paradigm shift from RICE to PEACE&LOVE is evidence-based' },
    preventionTip: { ko: '급성기 통증 조절 목적으로만 단기(20분 × 3~5회/일) 냉치료 허용. 이후 능동 회복으로 전환', ja: '疼痛調節目的のみで短期（20分×3〜5回/日）許可。その後は能動回復へ転換。', en: 'Permit short-duration cryotherapy (20 min × 3–5/day) only for acute pain management; transition to active recovery modalities thereafter' } },
  { id: 'PF-014', category: 'prescription', severity: 'low', checked: false,
    title:         { ko: '근력 운동 전 정적 스트레칭 과도 적용', ja: '筋力運動前の静的ストレッチ過度適用', en: 'Excessive static stretching immediately before strength training' },
    description:   { ko: '근력 운동 직전 10분 이상 정적 스트레칭 시 근력 최대 8~12% 일시 감소 (신경 억제 및 근 방추 감도 저하 기전)', ja: '筋力運動直前の10分以上静的ストレッチで筋力8〜12%一時低下', en: 'Static stretching >10 min immediately pre-strength training temporarily reduces maximal force output 8–12% via neural inhibition and reduced muscle spindle sensitivity' },
    preventionTip: { ko: '근력 운동 전 동적 워밍업(Dynamic warm-up) 5~10분 권장. 정적 스트레칭은 운동 후 쿨다운 시 배치', ja: '筋力運動前は動的ウォームアップ5〜10分推奨。静的ストレッチはクールダウン後に配置。', en: 'Replace pre-strength static stretching with 5–10 min dynamic warm-up; reserve static stretching for cool-down phase' } },
  { id: 'PF-015', category: 'monitoring', severity: 'moderate', checked: false,
    title:         { ko: '안정 시 HRV 모니터링 미시행', ja: '安静時HRVモニタリング未実施', en: 'Neglecting resting heart rate variability (HRV) monitoring' },
    description:   { ko: 'HRV는 자율신경계 회복 상태의 객관적 지표. 모니터링 없이 훈련 부하 조절 시 과훈련 및 회복 불량을 조기 감지 불가', ja: 'HRVは自律神経回復の客観的指標。モニタリングなしでは過訓練・回復不良の早期発見不可。', en: 'HRV is an objective autonomic recovery marker; without monitoring, early detection of overtraining and under-recovery is missed' },
    preventionTip: { ko: '매일 기상 후 안정 시 HRV 1분 측정(손가락 PPG 앱 허용). 7일 평균 대비 10% 이상 감소 시 훈련 부하 경감', ja: '毎朝安静時HRV1分測定。7日平均比10%以上低下で訓練負荷軽減。', en: 'Measure resting HRV daily upon waking (1-min fingertip PPG apps acceptable). Reduce training load if HRV drops >10% below 7-day rolling average' } },
  { id: 'PF-016', category: 'assessment', severity: 'moderate', checked: false,
    title:         { ko: 'FMS(기능적 움직임 스크린) 생략', ja: 'FMSスクリーニング省略', en: 'Skipping Functional Movement Screen (FMS) prior to training' },
    description:   { ko: '기능적 움직임 패턴의 제한 및 비대칭을 사전 확인하지 않고 부하 운동 처방 시 부상 위험 증가', ja: '機能的動作パターンの制限・非対称を確認せず負荷運動処方→受傷リスク増加', en: 'Prescribing loaded exercise without assessing movement pattern limitations and asymmetries increases injury risk' },
    preventionTip: { ko: 'FMS 7개 동작 평가 (≤14점 또는 비대칭 시 교정 운동 우선). SFMA(Selective FMS)로 통증 동반 시 추가 평가', ja: 'FMS 7動作評価（≤14点または非対称で矯正運動優先）。疼痛時はSFMA追加評価。', en: 'Administer 7-movement FMS battery; score ≤14 or any asymmetry triggers corrective exercise priority before loaded training; use SFMA for painful patterns' } },
  { id: 'PF-017', category: 'monitoring', severity: 'high', checked: false,
    title:         { ko: '수면 부족이 회복에 미치는 영향 과소평가', ja: '睡眠不足が回復に与える影響の過小評価', en: 'Underestimating the impact of sleep deprivation on recovery' },
    description:   { ko: '수면 6시간 미만 시 GH(성장 호르몬) 분비 60% 감소, 코르티솔 상승, 근단백질 합성 저하, 운동 수행 능력 최대 11% 저하', ja: '睡眠6時間未満でGH分泌60%減少・コルチゾール上昇・MPS低下・パフォーマンス最大11%低下', en: 'Sleep <6 h: GH secretion decreases 60%, cortisol rises, MPS declines, and exercise performance drops up to 11%' },
    preventionTip: { ko: '7~9시간 수면 목표. 수면 위생 교육(스크린 타임 제한, 취침 전 루틴) 재활 프로그램에 공식 포함', ja: '7〜9時間睡眠目標。睡眠衛生教育をリハプログラムに公式組込み。', en: 'Target 7–9 h sleep. Formally integrate sleep hygiene education (screen time restriction, bedtime routine) into rehabilitation programme' } },
  { id: 'PF-018', category: 'return-to-sport', severity: 'moderate', checked: false,
    title:         { ko: '혈류 제한 운동(BFR) 금기증 미확인', ja: 'BFR禁忌確認漏れ', en: 'Failing to screen for blood flow restriction (BFR) contraindications' },
    description:   { ko: 'BFR 훈련 전 심부정맥혈전증(DVT), 말초혈관 질환, 고혈압 (>180/110) 등 금기증 미확인 시 혈전 형성 및 혈압 급상승 위험', ja: 'BFR前にDVT・末梢血管疾患・高血圧等の禁忌未確認→血栓形成・血圧急上昇リスク', en: 'BFR training without screening for DVT, peripheral vascular disease, or severe hypertension (>180/110) risks thrombus formation and acute blood pressure surge' },
    preventionTip: { ko: 'BFR 시작 전 체크리스트: DVT 기왕력, ABI(발목-상완 지수) <0.9, 사지 감각 이상, 임신 여부 확인. 압력 설정: 상지 50~60% AOP, 하지 60~80% AOP', ja: 'BFR前チェックリスト: DVT歴・ABI<0.9・四肢感覚異常・妊娠。圧設定: 上肢50〜60% AOP、下肢60〜80% AOP。', en: 'Pre-BFR checklist: DVT history, ABI <0.9, limb paraesthesia, pregnancy. Pressure: 50–60% AOP (upper) / 60–80% AOP (lower limb)' } },
  { id: 'PF-019', category: 'nutrition', severity: 'moderate', checked: false,
    title:         { ko: '에너지 가용성 부족(LEA) 스크리닝 누락', ja: 'エネルギー利用可能性不足（LEA）スクリーニング漏れ', en: 'Missing Low Energy Availability (LEA) screening in athlete patients' },
    description:   { ko: '특히 여성 선수 및 지구력 종목 선수에서 의도적/비의도적 에너지 부족 시 골다공증, 면역 저하, 무월경 (Female Athlete Triad / RED-S) 발생', ja: '特に女性・持久系選手でのLEAはFemale Athlete Triad / RED-Sに至る可能性', en: 'Intentional or unintentional LEA in female and endurance athletes can progress to Female Athlete Triad / RED-S: bone stress, immunosuppression, menstrual dysfunction' },
    preventionTip: { ko: 'LEAF-Q 설문 또는 3일 식이 기록 분석. 에너지 가용성 목표: ≥45 kcal/kg LBM/day. 영양사 협진 필수', ja: 'LEAF-Q問診または3日食事記録分析。EA目標≥45 kcal/kg LBM/日。栄養士協診必須。', en: 'Screen with LEAF-Q questionnaire or 3-day diet record. Target energy availability ≥45 kcal/kg LBM/day; refer to sports dietitian' } },
  { id: 'PF-020', category: 'communication', severity: 'low', checked: false,
    title:         { ko: '통증 신경과학 교육(PNE) 생략 (만성 통증 환자)', ja: 'PNE省略（慢性疼痛患者）', en: 'Omitting Pain Neuroscience Education (PNE) in chronic pain patients' },
    description:   { ko: '만성 통증 환자에서 PNE 없이 운동 처방만 적용 시 Fear-Avoidance 신념 잔존 → 운동 참여 저하 및 치료 순응도 하락', ja: 'PNEなしに運動処方のみ→Fear-Avoidance信念残存→参加率・治療順応低下', en: 'Exercise-only approach without PNE leaves Fear-Avoidance Beliefs intact → poor exercise adherence and treatment compliance in chronic pain patients' },
    preventionTip: { ko: '운동 처방 전 2~4세션 PNE 실시 (Pain biology, Central sensitisation 교육). Tampa Scale for Kinesiophobia ≥37점 시 필수', ja: '運動前2〜4回PNE実施。Tampa Scale≥37点で必須。', en: 'Deliver 2–4 PNE sessions before exercise progression; cover pain biology and central sensitisation concepts. Mandatory when Tampa Scale for Kinesiophobia ≥37' } },
];

// ── ROM 표준 참고값 ──────────────────────────────────────────

export interface ROMJoint {
  id: string; label: LocalizedText;
  movements: { id: string; label: LocalizedText; normalMin: number; normalMax: number; unit: string }[];
}

export const ROM_JOINTS: ROMJoint[] = [
  { id: 'hip', label: { ko: '고관절', ja: '股関節', en: 'Hip' }, movements: [
    { id: 'hip-flex', label: { ko: '굴곡', ja: '屈曲', en: 'Flexion' }, normalMin: 100, normalMax: 120, unit: '°' },
    { id: 'hip-ext',  label: { ko: '신전', ja: '伸展', en: 'Extension' }, normalMin: 20, normalMax: 30, unit: '°' },
    { id: 'hip-abd',  label: { ko: '외전', ja: '外転', en: 'Abduction' }, normalMin: 40, normalMax: 50, unit: '°' },
    { id: 'hip-ir',   label: { ko: '내회전', ja: '内旋', en: 'Int. Rotation' }, normalMin: 35, normalMax: 45, unit: '°' },
    { id: 'hip-er',   label: { ko: '외회전', ja: '外旋', en: 'Ext. Rotation' }, normalMin: 40, normalMax: 50, unit: '°' },
  ]},
  { id: 'knee', label: { ko: '슬관절', ja: '膝関節', en: 'Knee' }, movements: [
    { id: 'knee-flex', label: { ko: '굴곡', ja: '屈曲', en: 'Flexion' }, normalMin: 130, normalMax: 145, unit: '°' },
    { id: 'knee-ext',  label: { ko: '신전', ja: '伸展', en: 'Extension' }, normalMin: 0, normalMax: 5, unit: '°' },
  ]},
  { id: 'ankle', label: { ko: '족관절', ja: '足関節', en: 'Ankle' }, movements: [
    { id: 'ankle-df', label: { ko: '배굴', ja: '背屈', en: 'Dorsiflexion' }, normalMin: 15, normalMax: 20, unit: '°' },
    { id: 'ankle-pf', label: { ko: '저굴', ja: '底屈', en: 'Plantarflexion' }, normalMin: 40, normalMax: 55, unit: '°' },
  ]},
  { id: 'shoulder', label: { ko: '견관절', ja: '肩関節', en: 'Shoulder' }, movements: [
    { id: 'sh-flex',  label: { ko: '굴곡', ja: '屈曲', en: 'Flexion' }, normalMin: 170, normalMax: 180, unit: '°' },
    { id: 'sh-abd',   label: { ko: '외전', ja: '外転', en: 'Abduction' }, normalMin: 170, normalMax: 180, unit: '°' },
    { id: 'sh-er',    label: { ko: '외회전', ja: '外旋', en: 'Ext. Rotation' }, normalMin: 80, normalMax: 90, unit: '°' },
    { id: 'sh-ir',    label: { ko: '내회전', ja: '内旋', en: 'Int. Rotation' }, normalMin: 60, normalMax: 70, unit: '°' },
  ]},
  { id: 'elbow', label: { ko: '주관절', ja: '肘関節', en: 'Elbow' }, movements: [
    { id: 'elbow-flex', label: { ko: '굴곡', ja: '屈曲', en: 'Flexion' }, normalMin: 140, normalMax: 150, unit: '°' },
    { id: 'elbow-ext',  label: { ko: '신전', ja: '伸展', en: 'Extension' }, normalMin: 0, normalMax: 5, unit: '°' },
  ]},
];
