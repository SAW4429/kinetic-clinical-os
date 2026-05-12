// ============================================================
//  clinicalDBExtended.ts — Red Flags · Pathophysiology · Comorbidity
// ============================================================
import type { Language, LocalizedText, RiskLevel } from './clinicalDB';

// ── Red Flags ─────────────────────────────────────────────────

export type RedFlagCategory = 'pain' | 'neurological' | 'systemic' | 'medication' | 'infection' | 'trauma';
export type RedFlagUrgency  = 'immediate' | '24h' | 'monitor';

export interface RedFlag {
  id:       string;
  label:    LocalizedText;
  category: RedFlagCategory;
  urgency:  RedFlagUrgency;
  rationale: LocalizedText;
  action:    LocalizedText;
}

export const RED_FLAGS: RedFlag[] = [
  { id:'RF-001', category:'pain', urgency:'immediate',
    label:    {ko:'야간 통증 (수면 방해 수준)', ja:'夜間痛（睡眠障害レベル）', en:'Night pain (sleep-disturbing)'},
    rationale:{ko:'악성 종양, 척추 감염, 강직성 척추염의 주요 지표. 통증이 체위 변화로 경감되지 않으면 즉각 의뢰', ja:'悪性腫瘍・脊椎感染・強直性脊椎炎の主要指標', en:'Key indicator of malignancy, spinal infection or ankylosing spondylitis; unrelieved by position change'},
    action:   {ko:'즉시 영상 검사(MRI 우선) 및 전문의 의뢰', ja:'即時画像検査（MRI優先）・専門医紹介', en:'Urgent MRI and specialist referral'}},
  { id:'RF-002', category:'pain', urgency:'24h',
    label:    {ko:'안정 시 지속 통증 (비기계적)', ja:'安静時持続痛（非機械的）', en:'Constant rest pain (non-mechanical)'},
    rationale:{ko:'기계적 통증은 자세·동작으로 변하지만 지속 안정통은 염증성, 혈관성, 악성 원인을 시사', ja:'機械的通証は動作で変化するが持続安静痛は炎症性・血管性・悪性を示唆', en:'Mechanical pain varies with movement; constant rest pain suggests inflammatory, vascular or malignant cause'},
    action:   {ko:'24시간 내 의사 평가, 염증 마커(CRP, ESR) 채혈', ja:'24時間以内に医師評価・炎症マーカー採血', en:'Medical evaluation within 24 h; order CRP and ESR'}},
  { id:'RF-003', category:'neurological', urgency:'immediate',
    label:    {ko:'마미총 증후군 징후 (방광/직장 기능 장애 + 안장 마취)', ja:'馬尾症候群徴候', en:'Cauda equina syndrome signs (bladder/bowel + saddle anaesthesia)'},
    rationale:{ko:'척수 압박으로 인한 신경외과적 응급. 지연 시 영구 마비 위험', ja:'脊髓圧迫による神経外科的緊急。遅延時に永久麻痺リスク', en:'Neurosurgical emergency from cord/cauda compression; delay risks permanent paralysis'},
    action:   {ko:'즉각 응급실 이송, 신경외과 긴급 의뢰', ja:'即座に救急搬送・神経外科緊急紹介', en:'Immediate ED transfer; emergency neurosurgical consultation'}},
  { id:'RF-004', category:'neurological', urgency:'24h',
    label:    {ko:'진행성 신경 결손 (근력 저하 악화)', ja:'進行性神経欠損（筋力低下増悪）', en:'Progressive neurological deficit (worsening weakness)'},
    rationale:{ko:'재활 중 근력이 점진적으로 악화되면 신경근 압박 또는 척수 병증 가능성', ja:'リハビリ中に筋力が悪化すれば神経根圧迫または脊髓症の可能性', en:'Worsening motor strength during rehabilitation suggests active nerve root compression or myelopathy'},
    action:   {ko:'즉시 신경학적 검사 반복, 영상 검사 의뢰', ja:'直ちに神経学的検査反復・画像検査', en:'Repeat neurological exam immediately; urgent imaging'}},
  { id:'RF-005', category:'systemic', urgency:'immediate',
    label:    {ko:'원인 불명 체중 감소 (3개월 내 >10%)', ja:'原因不明の体重減少（3ヶ月>10%）', en:'Unexplained weight loss (>10% in 3 months)'},
    rationale:{ko:'악성 종양, 결핵, 심한 감염의 전신 징후. 근골격계 통증과 동반 시 즉각 감별 필요', ja:'悪性腫瘍・結核・重篤感染の全身徴候', en:'Systemic sign of malignancy, TB or severe infection; co-existing with MSK pain requires immediate workup'},
    action:   {ko:'내과/혈액종양과 즉시 의뢰, 종양 마커 포함 혈액 검사', ja:'内科・血液腫瘍科即時紹介・腫瘍マーカー血液検査', en:'Urgent internal medicine/oncology referral; tumour marker panel'}},
  { id:'RF-006', category:'systemic', urgency:'24h',
    label:    {ko:'발열 동반 근골격 통증', ja:'発熱を伴う筋骨格痛', en:'Fever with musculoskeletal pain'},
    rationale:{ko:'화농성 관절염, 골수염, 연조직 감염의 징후. 열감 + 국소 발적 + 이동 제한은 즉각 배양 검사 필요', ja:'化膿性関節炎・骨髄炎・軟部組織感染の徴候', en:'Signs of septic arthritis, osteomyelitis or soft tissue infection; local warmth + erythema + restricted motion requires culture'},
    action:   {ko:'체온 측정, WBC·CRP·ESR 즉시, 화농성 관절염 배제 위해 관절 흡인 고려', ja:'体温測定・WBC·CRP·ESR即時・化膿性関節炎除外のため関節穿刺考慮', en:'Check temperature, urgent WBC/CRP/ESR; consider joint aspiration to rule out septic arthritis'}},
  { id:'RF-007', category:'infection', urgency:'immediate',
    label:    {ko:'최근 수술 부위 발적·삼출·열감', ja:'最近の術部位発赤・浸出・熱感', en:'Post-surgical wound erythema, exudate or warmth'},
    rationale:{ko:'수술 후 감염(특히 SSI)은 24시간 내 조치 지연 시 패혈증 진행 가능', ja:'術後感染（SSI）は24時間以内未対応で敗血症に進行可能', en:'Post-surgical infection (SSI) can progress to sepsis if unaddressed within 24 h'},
    action:   {ko:'수술 담당 의사 즉시 연락, 항생제 처방 전까지 재활 중단', ja:'執刀医へ即時連絡、抗生物質処方まで理学療法中断', en:'Notify operating surgeon immediately; suspend rehabilitation until antibiotics commenced'}},
  { id:'RF-008', category:'medication', urgency:'monitor',
    label:    {ko:'항응고제 복용 중 타박 후 급속 팽창 혈종', ja:'抗凝固薬服用中の打撲後急速膨張血腫', en:'Rapidly expanding haematoma post-contusion on anticoagulants'},
    rationale:{ko:'와파린·NOAC 복용 환자는 작은 외상으로도 심부 혈종 형성 → 구획 증후군 위험', ja:'ワルファリン・NOAC服用患者は軽外傷でも深部血腫→コンパートメント症候群リスク', en:'Warfarin/NOAC patients can develop deep haematoma from minor trauma → compartment syndrome risk'},
    action:   {ko:'INR/APTT 확인, 압박 드레싱, 외과 의뢰, 재활 해당 부위 즉시 중단', ja:'INR/APTT確認・圧迫ドレッシング・外科紹介・当部位リハ即中断', en:'Check INR/APTT; apply compression; surgical referral; suspend rehabilitation of affected region'}},
  { id:'RF-009', category:'trauma', urgency:'immediate',
    label:    {ko:'고에너지 손상 기전 (낙마, 교통사고, 추락 >2m)', ja:'高エネルギー受傷機転', en:'High-energy trauma mechanism (fall >2m, RTC, horse-riding)'},
    rationale:{ko:'골절, 혈기흉, 복강 내 출혈, 경추 손상 등 다발성 외상 배제 필요. 안정성 확인 전 재활 금지', ja:'骨折・血気胸・腹腔内出血・頸椎損傷等の多発外傷除外必要', en:'Must rule out fracture, haemopneumothorax, intra-abdominal haemorrhage, C-spine injury before any rehabilitation'},
    action:   {ko:'ATLS 프로토콜 적용, 척추 고정 유지, 외상 센터 이송', ja:'ATLSプロトコル適用・脊椎固定維持・外傷センター搬送', en:'Apply ATLS protocol; maintain spinal precautions; transfer to trauma centre'}},
  { id:'RF-010', category:'pain', urgency:'monitor',
    label:    {ko:'스테로이드 장기 복용 환자 갑작스러운 관절통 악화', ja:'ステロイド長期服用患者の関節痛急悪化', en:'Sudden articular pain worsening in long-term steroid users'},
    rationale:{ko:'대퇴골두 무혈성 괴사(AVN)는 스테로이드 고용량 장기 복용의 합병증. MRI로만 조기 진단 가능', ja:'大腿骨頭無血管性壊死（AVN）はステロイド長期高用量服用の合併症。MRIのみ早期診断可能', en:'Avascular necrosis (AVN) of femoral head is a complication of long-term high-dose steroids; only MRI enables early diagnosis'},
    action:   {ko:'AVN 배제 위해 MRI 의뢰, 부하 운동 잠정 중단', ja:'AVN除外のためMRI依頼、荷重運動を暫定中断', en:'MRI referral to rule out AVN; provisional suspension of weight-bearing exercise'}},
];

// ── Pathophysiology Framework ─────────────────────────────────

export type PathCategory = 'tissue' | 'load' | 'movement' | 'systemic';

export interface PathFactor {
  id:            string;
  category:      PathCategory;
  title:         LocalizedText;
  description:   LocalizedText;
  clinicalTests: LocalizedText[];
  interventions: LocalizedText[];
}

export const PATHOPHYSIOLOGY_FACTORS: PathFactor[] = [
  // TISSUE
  { id:'PATH-T1', category:'tissue',
    title:       {ko:'근육 미세 파열 (Grade I–II)', ja:'筋肉微細断裂（GradeI-II）', en:'Muscle micro-tear (Grade I–II)'},
    description: {ko:'Z-disc 손상, 세포골격 파괴로 인한 국소 염증. 편심성 수축 후 24~72h 피크', ja:'Z-disc損傷・細胞骨格破壊による局所炎症。離心性収縮後24〜72hピーク', en:'Z-disc disruption and cytoskeletal breakdown cause local inflammation; peaks 24–72 h after eccentric loading'},
    clinicalTests:[
      {ko:'부하 VAS 통증 위치 지도화, 저항 검사(MMT) 약점 확인', ja:'負荷VAS疼痛マッピング・MMT弱点確認', en:'Load-VAS pain mapping; MMT to identify strength deficit'},
      {ko:'초음파로 혈종 또는 불연속 확인', ja:'超音波で血腫・不連続確認', en:'Ultrasound to identify haematoma or structural discontinuity'},
    ],
    interventions:[
      {ko:'PEACE&LOVE 프로토콜: 보호→상승→회피→압박→교육→부하→낙관→혈관화', ja:'PEACE&LOVEプロトコル適用', en:'Apply PEACE&LOVE protocol (Protect→Elevate→Avoid anti-inf→Compress→Educate→Load→Optimism→Vascularisation)'},
      {ko:'3~5일 후 저강도 편심성 부하 재개 (통증 ≤3/10 범위 내)', ja:'3〜5日後に低強度離心性負荷再開（疼痛≤3/10）', en:'Resume low-load eccentric exercise 3–5 days post-injury within pain ≤3/10'},
    ]},
  { id:'PATH-T2', category:'tissue',
    title:       {ko:'힘줄 부하 적응 실패 (반응성 힘줄병증)', ja:'腱負荷適応失敗（反応性腱症）', en:'Tendon load adaptation failure (reactive tendinopathy)'},
    description: {ko:'과부하 시 콜라겐 섬유 배열 장애, tenocyte 비정상 반응, 신혈관 형성. 비염증성 퇴행 과정. 스트레칭은 오히려 악화 가능', ja:'過負荷でコラーゲン線維配列障害・tenocyte異常反応・新血管形成。非炎症性退行過程。ストレッチは悪化可能', en:'Collagen fibre disorganisation, tenocyte dysregulation and neovascularisation under overload; non-inflammatory degenerative process; stretching may worsen reactive stage'},
    clinicalTests:[
      {ko:'Victorian Institute of Sports Tendon Assessment (VISA) 설문', ja:'VISAスコア評価', en:'VISA score questionnaire (VISA-A for Achilles, VISA-P for patellar)'},
      {ko:'단일 하지 뒤꿈치 올리기 테스트: 통증 유발 부하량 확인', ja:'片脚踵挙げテスト：疼痛誘発負荷量確認', en:'Single-leg heel raise test to quantify load tolerance'},
    ],
    interventions:[
      {ko:'등속성 저항 운동 (Isometric → Isotonic → 에너지 저장 부하) 단계적 진행', ja:'等尺性→等張性→エネルギー貯蔵負荷の段階的進行', en:'Progressive tendon loading: isometric → isotonic → energy-storage loading'},
      {ko:'부하 모니터링: 운동 후 24h 통증 ≤2/10 기준 유지', ja:'運動後24h疼痛≤2/10を維持', en:'Load monitoring: maintain post-exercise 24 h pain ≤2/10 as progression criterion'},
    ]},
  { id:'PATH-T3', category:'tissue',
    title:       {ko:'인대 불안정성 (Grade II–III)', ja:'靭帯不安定性（GradeII-III）', en:'Ligamentous instability (Grade II–III)'},
    description: {ko:'교원질 섬유 부분/완전 파열로 관절 안정성 저하. 2차 근육 방어 패턴 발생 → 피로 증가', ja:'膠原線維部分/完全断裂で関節安定性低下。2次的筋防御パターン発生→疲労増大', en:'Partial or complete collagen disruption reduces joint stability; secondary muscle guarding patterns develop, increasing fatigue'},
    clinicalTests:[
      {ko:'전방 거비 인대(ATFL) - 전방 거비 인대 테스트, 내번 스트레스 테스트', ja:'ATFL-前方引き出しテスト・内反ストレステスト', en:'ATFL: anterior drawer test, inversion stress test; Grade by end-feel and laxity (mm)'},
      {ko:'KT-1000 무릎 관절 이완도 계측 (측방 차이 >3mm = 비정상)', ja:'KT-1000による膝関節弛緩度計測（側方差>3mm=異常）', en:'KT-1000 arthrometer for knee laxity (side-to-side difference >3 mm = abnormal)'},
    ],
    interventions:[
      {ko:'신경근 조절 훈련 우선 (균형 판, 진동 플랫폼, 반응 훈련)', ja:'神経筋コントロール訓練優先（バランスボード・振動プラットフォーム）', en:'Prioritise neuromuscular control training (balance board, vibration platform, perturbation training)'},
      {ko:'등척성 근력 강화 → 기능 운동 사슬 훈련 순서 준수', ja:'等尺性筋力強化→機能的運動連鎖訓練の順序遵守', en:'Isometric strengthening → functional kinetic chain training in sequence'},
    ]},
  // LOAD
  { id:'PATH-L1', category:'load',
    title:       {ko:'볼륨 과부하 (Overreaching)', ja:'ボリューム過負荷（オーバーリーチング）', en:'Training volume overload (overreaching)'},
    description: {ko:'훈련 볼륨이 회복 능력을 초과. 1~2주 이내 가역적이면 기능적 오버리칭, 지속 시 비기능적으로 전환', ja:'訓練ボリュームが回復能力を超過。1〜2週以内可逆なら機能的、持続で非機能的に転換', en:'Training volume exceeds recovery capacity; reversible within 1–2 weeks = functional overreaching; persistent = non-functional overreaching → OTS risk'},
    clinicalTests:[
      {ko:'ACWR(급만성 훈련 부하 비율) 계산: 급성 1주 부하 / 만성 4주 평균. >1.5 = 위험', ja:'ACWR計算（急性1週/慢性4週平均）。>1.5=危険', en:'Calculate ACWR (Acute:Chronic Workload Ratio); ratio >1.5 indicates elevated injury risk'},
      {ko:'주관적 웰니스 점검 (수면, 기분, 피로, 근육통) 매일 기록', ja:'主観的ウェルネス毎日記録（睡眠・気分・疲労・筋肉痛）', en:'Daily subjective wellness monitoring (sleep, mood, fatigue, soreness)'},
    ],
    interventions:[
      {ko:'즉각 40~60% 볼륨 감량(Deload). 2주 후 재평가 후 점진 복귀', ja:'即時40〜60%ボリューム削減(Deload)。2週後再評価後に段階復帰', en:'Immediate 40–60% volume reduction (deload); re-evaluate at 2 weeks before progressive return'},
      {ko:'RPE 기반 부하 조절 (세션 RPE × 분 = 내부 부하 지표)', ja:'RPEベース負荷調整（セッションRPE×分=内部負荷指標）', en:'Implement RPE-based load management (session RPE × duration = internal load metric)'},
    ]},
  { id:'PATH-L2', category:'load',
    title:       {ko:'충격 부하 과다 (Bone Stress Reaction)', ja:'衝撃負荷過多（骨ストレス反応）', en:'Excessive impact loading (bone stress reaction)'},
    description: {ko:'뼈 재형성 속도를 초과하는 반복 충격 → 미세 골절 누적 → 피로 골절로 진행 가능. 주로 경골, 족부 골', ja:'骨リモデリング速도を超える反復衝撃→微細骨折蓄積→疲労骨折に進行可能', en:'Repetitive impact exceeding bone remodelling rate → micro-fracture accumulation → stress fracture progression; most common in tibia and metatarsals'},
    clinicalTests:[
      {ko:'Hop test 1회 하지 시 통증 재현 여부, 음차 검사(Tuning fork)', ja:'ホップテスト・音叉検査', en:'Single-leg hop pain reproduction; tuning fork test (128 Hz vibration at fracture site)'},
      {ko:'MRI (Grade 4 이상) 또는 CT (피질 골절선 확인)', ja:'MRI（Grade4以上）またはCT（皮質骨折線確認）', en:'MRI (Grade IV stress reaction) or CT (cortical fracture line confirmation)'},
    ],
    interventions:[
      {ko:'즉각 충격 부하 중단. 수중 달리기, 자전거 에르고로 심폐 유지', ja:'即時衝撃負荷中断。水中ランニング・自転車エルゴで心肺維持', en:'Immediate impact suspension; maintain aerobic fitness via aqua-jogging or cycle ergometer'},
      {ko:'칼슘·비타민D 상태 확인. 여성 선수: LEA 및 생리 주기 평가', ja:'カルシウム・ビタミンD状態確認。女性選手: LEA・月経周期評価', en:'Assess calcium and vitamin D status; female athletes: evaluate LEA and menstrual status (RED-S)'},
    ]},
  // MOVEMENT
  { id:'PATH-M1', category:'movement',
    title:       {ko:'보상성 움직임 패턴 (Compensatory Movement)', ja:'代償性動作パターン', en:'Compensatory movement pattern'},
    description: {ko:'손상 또는 통증으로 인해 비최적 근육 활성화 순서 형성. 단기 보호 메커니즘이 장기화되면 이차 손상 유발', ja:'損傷・疼痛による非最適筋活性化順序形성。短期保護が長期化で二次損傷誘発', en:'Non-optimal muscle activation sequencing from injury/pain; short-term protective mechanism becomes chronic and causes secondary injury'},
    clinicalTests:[
      {ko:'FMS 딥 스쿼트: 상체 전경 여부, 발목 배굴 제한 확인', ja:'FMSディープスクワット：体幹前傾・足首背屈制限確認', en:'FMS deep squat: assess trunk forward lean and ankle dorsiflexion restriction'},
      {ko:'단일 하지 스쿼트: 무릎 내반/외반, 골반 드롭 관찰', ja:'片脚スクワット：膝内外反・骨盤ドロップ観察', en:'Single-leg squat: assess knee valgus/varus and contralateral pelvic drop'},
    ],
    interventions:[
      {ko:'움직임 교정 운동 우선 (FMS 점수 개선 목표), 이후 부하 추가', ja:'動作矯正運動優先（FMSスコア改善目標）後に負荷追加', en:'Prioritise movement correction exercise (target FMS score improvement) before adding load'},
      {ko:'비디오 분석 피드백 + 거울 훈련으로 인식 향상', ja:'ビデオ分析フィードバック＋鏡訓練で認識向上', en:'Video analysis feedback and mirror training to improve body awareness'},
    ]},
  { id:'PATH-M2', category:'movement',
    title:       {ko:'관절 가동 범위 제한 (ROM Deficit)', ja:'関節可動域制限（ROM制限）', en:'Joint range of motion deficit'},
    description: {ko:'관절낭 섬유화, 근육 단축, 신경근 과긴장으로 인한 가동 범위 제한. 인접 관절 과부하 초래', ja:'関節包線維化・筋短縮・神経筋過緊張によるROM制限。隣接関節過負荷を招来', en:'ROM restriction from capsular fibrosis, muscle shortening or neuromuscular hypertonia; creates overload at adjacent joints'},
    clinicalTests:[
      {ko:'수동 ROM vs 능동 ROM 비교로 제한 원인 감별 (관절낭 vs 근육성)', ja:'受動ROM vs 能動ROM比較で原因鑑別（関節包vs筋性）', en:'Compare passive vs active ROM to differentiate capsular versus muscular restriction'},
      {ko:'End-feel 평가: 경성(골성) vs 탄성(근육성) vs 스프링감(관절낭성)', ja:'End-feel評価：硬性(骨性)vs弾性(筋性)vsスプリング感(関節包性)', en:'Assess end-feel quality: hard (bony) vs springy (capsular) vs elastic (muscular)'},
    ],
    interventions:[
      {ko:'관절 모빌리제이션 (Maitland Grade I-IV) + 자가 스트레칭 병행', ja:'Maitland Grade I-IVの関節モビライゼーション＋自己ストレッチ', en:'Joint mobilisation (Maitland Grade I–IV) combined with self-stretching'},
      {ko:'통증 없는 범위의 말기 범위(End-range) 저부하 운동으로 교원질 재형성 촉진', ja:'疼痛のない末期可動域での低負荷運動でコラーゲンリモデリング促進', en:'Low-load end-range exercise within pain-free range to stimulate collagen remodelling'},
    ]},
  // SYSTEMIC
  { id:'PATH-S1', category:'systemic',
    title:       {ko:'전신 염증 (낮은 수준 / Low-grade Inflammation)', ja:'全身性低度炎症', en:'Low-grade systemic inflammation'},
    description: {ko:'비만, 당뇨, 좌식 생활에 의한 만성 낮은 수준의 전신 염증. IL-6 TNF-α 기저 수준 상승. 근손상 회복 지연, 힘줄 퇴행 가속', ja:'肥満・糖尿・座位生活による慢性低度全身炎症。IL-6・TNF-α基礎レベル上昇。筋損傷回復遅延・腱退行加速', en:'Chronic low-grade systemic inflammation from obesity, T2DM and sedentary behaviour; elevated baseline IL-6/TNF-α delays muscle repair and accelerates tendon degeneration'},
    clinicalTests:[
      {ko:'CRP (>3 mg/L), IL-6, HbA1c, 체지방률, 허리둘레 측정', ja:'CRP(>3mg/L)・IL-6・HbA1c・体脂肪率・腹囲測定', en:'CRP (>3 mg/L), IL-6, HbA1c, body fat %, waist circumference'},
    ],
    interventions:[
      {ko:'유산소 운동 + 저항 운동 복합: 내장 지방 감소 → 기저 TNF-α 감소 전략', ja:'有酸素＋抵抗運動複合：内臓脂肪減少→基礎TNF-α低下戦略', en:'Combined aerobic + resistance training to reduce visceral fat and lower baseline TNF-α'},
      {ko:'항염증 식단 (오메가-3, 폴리페놀) 영양 상담 병행', ja:'抗炎症食（オメガ-3・ポリフェノール）栄養相談併用', en:'Anti-inflammatory dietary counselling (omega-3, polyphenols) concurrent with exercise programme'},
    ]},
  { id:'PATH-S2', category:'systemic',
    title:       {ko:'중추 감작 (Central Sensitisation)', ja:'中枢感作', en:'Central sensitisation'},
    description: {ko:'말초 조직 손상 없이도 통증 역치 저하. 척수 후각 신경 흥분성 증가. 만성 통증, 광범위한 이통(Allodynia/Hyperalgesia) 특징', ja:'末梢組織損傷なしでも痛覚閾値低下。脊髄後角神経興奮性増大。慢性痛・広範囲の異痛症・痛覚過敏特徴', en:'Pain threshold reduction without peripheral tissue damage; dorsal horn hyperexcitability; characterised by widespread allodynia, hyperalgesia and chronic pain'},
    clinicalTests:[
      {ko:'Central Sensitization Inventory (CSI) ≥40점 시 의심', ja:'CSI(Central Sensitization Inventory)≥40点で疑い', en:'Central Sensitization Inventory (CSI) ≥40 points suggests central sensitisation'},
      {ko:'압통 역치 측정(알고미터): 비손상 부위에서도 저하된 역치 확인', ja:'圧痛閾値測定（アルゴメーター）：非損傷部位での低下した閾値確認', en:'Pressure pain threshold (algometry): reduced thresholds at non-injured sites'},
    ],
    interventions:[
      {ko:'통증 신경과학 교육(PNE) 필수: 통증 ≠ 조직 손상 이해 구축', ja:'疼痛神経科学教育（PNE）必須：疼痛≠組織損傷の理解構築', en:'Pain Neuroscience Education (PNE) essential: build understanding that pain ≠ tissue damage'},
      {ko:'그레이디드 노출 (Graded exposure): 공포 회피 행동 단계적 해소', ja:'グレイデッドエクスポージャー：恐怖回避行動の段階的解消', en:'Graded exposure: systematically address fear-avoidance behaviours toward loading'},
    ]},
];

// ── Comorbidity Constraints ───────────────────────────────────

export interface ComorbidityConstraint {
  condition:   string;
  label:       LocalizedText;
  severity:    RiskLevel;
  constraints: {
    factor:       LocalizedText;
    modification: LocalizedText;
    rationale:    LocalizedText;
  }[];
  monitoring:  LocalizedText[];
}

export const COMORBIDITY_CONSTRAINTS: ComorbidityConstraint[] = [
  { condition:'T2DM', severity:'high',
    label:{ko:'제2형 당뇨병',ja:'2型糖尿病',en:'Type 2 Diabetes Mellitus'},
    constraints:[
      {factor:{ko:'운동 강도',ja:'運動強度',en:'Exercise intensity'},
       modification:{ko:'혈당 <100 또는 >300 mg/dL 시 운동 금지',ja:'血糖<100/>300 mg/dLで運動禁止',en:'No exercise if glucose <100 or >300 mg/dL'},
       rationale:{ko:'저혈당 또는 케톤산증 위험',ja:'低血糖またはケトアシドーシスリスク',en:'Risk of exercise-induced hypoglycaemia or ketoacidosis'}},
      {factor:{ko:'발/하지 관리',ja:'足部・下肢管理',en:'Foot/lower limb care'},
       modification:{ko:'매 세션 전후 발 검사 필수. 개방형 상처 시 수중 운동 금지',ja:'毎セッション前後に足検査必須。開放創では水中運動禁止',en:'Mandatory foot inspection pre/post each session; no aquatic exercise with open wound'},
       rationale:{ko:'당뇨병성 신경병증으로 손상 감지 불능',ja:'糖尿神経障害で損傷感知不能',en:'Diabetic neuropathy impairs injury perception'}},
      {factor:{ko:'RPE 기반 처방',ja:'RPEベース処方',en:'RPE-based prescription'},
       modification:{ko:'베타차단제 복용 시 HR 기반 처방 대신 RPE 11~13 사용',ja:'β遮断薬服用時はRPE11〜13使用',en:'Use RPE 11–13 instead of HR-based targets if on β-blockers'},
       rationale:{ko:'약물 HR 반응 둔화로 %HRmax 신뢰 불가',ja:'薬物HR反応鈍化でHRmax%信頼不可',en:'β-blockers blunt HR response, invalidating %HRmax targets'}},
    ],
    monitoring:[
      {ko:'운동 전/후 혈당 측정, 야간 지연성 저혈당 모니터링',ja:'運動前後血糖測定、夜間遅発性低血糖モニタリング',en:'Pre/post-exercise glucose monitoring; nocturnal delayed hypoglycaemia surveillance'},
      {ko:'HbA1c 3개월마다, 신기능(eGFR) 6개월마다 추적',ja:'HbA1c 3ヶ月毎・eGFR 6ヶ月毎追跡',en:'HbA1c every 3 months; eGFR every 6 months'},
    ]},
  { condition:'RA', severity:'moderate',
    label:{ko:'류마티스 관절염',ja:'関節リウマチ',en:'Rheumatoid Arthritis'},
    constraints:[
      {factor:{ko:'급성 발화 관리',ja:'急性発火管理',en:'Acute flare management'},
       modification:{ko:'급성 발화 기간: 관절 보호 원칙, 등척성 운동만 허용. ROM 유지 목적만',ja:'急性発火中：関節保護原則、等尺性運動のみ許可',en:'During acute flare: joint protection principles; isometric exercise only for ROM maintenance'},
       rationale:{ko:'염증 관절에 과부하 시 연골 손상 악화',ja:'炎症関節の過負荷で軟骨損傷悪化',en:'Loading inflamed joints accelerates cartilage damage'}},
      {factor:{ko:'경추 불안정성 확인',ja:'頸椎不安定性確認',en:'Cervical spine instability assessment'},
       modification:{ko:'상경추 불안정성(C1-C2 아탈구) 배제 후 운동 진행. 목 부하 운동 주의',ja:'上頸椎不安定性（C1-C2亜脱臼）除外後に運動進行',en:'Rule out atlanto-axial instability (C1–C2 subluxation) before loading cervical spine; caution with neck loading'},
       rationale:{ko:'RA에서 C1-C2 인대 침범으로 아탈구 위험',ja:'RAではC1-C2靱帯侵犯で亜脱臼リスク',en:'RA-related ligamentous involvement at C1–C2 risks atlanto-axial subluxation under load'}},
    ],
    monitoring:[
      {ko:'DAS28 점수, CRP/ESR 추적으로 질환 활성도 평가',ja:'DAS28スコア・CRP/ESR追跡で疾患活性度評価',en:'Disease Activity Score DAS28; CRP/ESR for disease activity monitoring'},
      {ko:'DMARDs/biologics 부작용 모니터링 (감염 증가, 골밀도 저하)',ja:'DMARDs/生物学的製剤副作用モニタリング',en:'Monitor for DMARD/biologic adverse effects (infection risk, bone density loss)'},
    ]},
  { condition:'Osteoporosis', severity:'high',
    label:{ko:'골다공증',ja:'骨粗鬆症',en:'Osteoporosis'},
    constraints:[
      {factor:{ko:'고충격 운동 제한',ja:'高衝撃運動制限',en:'High-impact activity restriction'},
       modification:{ko:'T-score ≤-2.5 + 골절 기왕력: 점프, 달리기, 전신 비틀기 동작 배제',ja:'T-score≤-2.5＋骨折歴：ジャンプ・ランニング・体幹捻転動作除外',en:'T-score ≤−2.5 with fracture history: eliminate jumping, running, trunk rotation under load'},
       rationale:{ko:'척추 압박 골절 및 고관절 골절 위험',ja:'椎体圧迫骨折・股関節骨折リスク',en:'Risk of vertebral compression fracture and hip fracture under high-impact load'}},
      {factor:{ko:'낙상 예방 우선',ja:'転倒予防優先',en:'Fall prevention priority'},
       modification:{ko:'균형 훈련을 처방 1순위로 배치. 불안정 면(폼 패드, BOSU) 훈련 포함',ja:'バランス訓練を処方第1優先に配置。不安定面訓練を含む',en:'Position balance/proprioception training as prescription priority 1; include unstable surface training'},
       rationale:{ko:'낙상이 골다공증 골절의 주요 원인',ja:'転倒が骨粗鬆症骨折の主要原因',en:'Falls are the primary cause of osteoporotic fractures'}},
    ],
    monitoring:[
      {ko:'DXA 6~12개월마다 (치료 중). FRAX 점수 연간 업데이트',ja:'DXA 6〜12ヶ月毎（治療中）。FRAXスコア年間更新',en:'DXA every 6–12 months during treatment; annual FRAX fracture risk score update'},
      {ko:'칼슘(25-OH-D, 이온화 Ca²⁺), 부갑상선 호르몬 추적',ja:'カルシウム・25-OH-D・PTH追跡',en:'Monitor 25-OH-D, ionised Ca²⁺ and PTH levels'},
    ]},
  { condition:'COPD', severity:'moderate',
    label:{ko:'만성 폐쇄성 폐질환',ja:'COPD',en:'COPD'},
    constraints:[
      {factor:{ko:'SpO₂ 최저 기준',ja:'SpO₂最低基準',en:'SpO₂ floor'},
       modification:{ko:'운동 중 SpO₂ <88% 즉각 중단. 보조 산소 필요 시 처방 전 호흡기 내과 협진',ja:'運動中SpO₂<88%で即中断。補助酸素が必要な場合は呼吸器内科協診',en:'Stop exercise immediately if SpO₂ <88%; consult pulmonology before prescribing if supplemental O₂ required'},
       rationale:{ko:'운동 유발 저산소증은 부정맥 및 인지 저하 위험',ja:'運動誘発低酸素症は不整脈・認知低下リスク',en:'Exercise-induced hypoxaemia risks cardiac arrhythmia and cognitive impairment'}},
      {factor:{ko:'호흡 보조 기법 통합',ja:'呼吸補助技法統合',en:'Breathing technique integration'},
       modification:{ko:'횡격막 호흡 + 입술 오므리기 호흡을 모든 운동에 통합. 흡기:호기 = 2:4 리듬',ja:'横隔膜呼吸＋口すぼめ呼吸をすべての運動に統合。吸気:呼気=2:4リズム',en:'Integrate diaphragmatic breathing and pursed-lip breathing into all exercises; inhalation:exhalation ratio 2:4'},
       rationale:{ko:'호흡 패턴 재훈련으로 air trapping 감소, 운동 내성 향상',ja:'呼吸パターン再訓練でair trapping減少・運動耐容性向上',en:'Breathing retraining reduces air trapping and improves exercise tolerance'}},
    ],
    monitoring:[
      {ko:'Borg 호흡 곤란 척도 (0-10), SpO₂, 6분 보행 거리(6MWT) 추적',ja:'Borg息切れ척도・SpO₂・6分歩行距離追跡',en:'Track Borg dyspnoea scale, SpO₂ and 6-Minute Walk Test distance'},
      {ko:'SABA 구제 흡입 횟수 추적 (악화 조기 지표)',ja:'SABA救済吸入回数追跡（増悪早期指標）',en:'Track SABA rescue inhaler usage frequency (early exacerbation indicator)'},
    ]},
];
