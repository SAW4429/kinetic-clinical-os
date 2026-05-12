// ============================================================
//  SignupPage — 회원가입: 유효성 검사 + 정규화 + 역할 선택
// ============================================================

import { useState, useCallback } from 'react';
import { useUserAuth, type UserRole } from '../context/UserAuthContext';
import type { Language } from '../data/clinicalDB';

// ── 정규화 유틸 ───────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3)  return d;
  if (d.length <= 7)  return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

// ── 폼 상태 / 에러 타입 ───────────────────────────────────────

interface FormState {
  name:         string;
  email:        string;
  phone:        string;
  age:          string;
  role:         UserRole | '';
  school:       string;
  organization: string;
}

interface FormErrors {
  name?:         string;
  email?:        string;
  age?:          string;
  role?:         string;
  schoolOrOrg?:  string;
}

const EMPTY: FormState = { name:'', email:'', phone:'', age:'', role:'', school:'', organization:'' };

// ── 유효성 검사 ───────────────────────────────────────────────

function validate(f: FormState, lang: Language): FormErrors {
  const e: FormErrors = {};
  const L = {
    ko:{ name:'이름을 입력해주세요.', email:'이메일을 입력해주세요.', emailFmt:'올바른 이메일 형식이 아닙니다.', age:'나이를 입력해주세요.', ageRange:'18~99세 사이로 입력해주세요.', role:'직업을 선택해주세요.', schoolOrOrg:'학교 또는 종사 기관 중 하나는 반드시 입력해야 합니다.' },
    ja:{ name:'お名前を入力してください。', email:'メールアドレスを入力してください。', emailFmt:'正しいメール形式ではありません。', age:'年齢を入力してください。', ageRange:'18〜99歳の範囲で入力してください。', role:'職業を選択してください。', schoolOrOrg:'学校または所属機関のいずれかを必ず入力してください。' },
    en:{ name:'Name is required.', email:'Email is required.', emailFmt:'Invalid email format.', age:'Age is required.', ageRange:'Age must be between 18 and 99.', role:'Please select your role.', schoolOrOrg:'School or organization — at least one is required.' },
  }[lang];

  if (!f.name.trim())  e.name  = L.name;
  if (!f.email.trim()) e.email = L.email;
  else if (!EMAIL_RE.test(f.email.trim())) e.email = L.emailFmt;

  const age = parseInt(f.age);
  if (!f.age.trim()) e.age = L.age;
  else if (isNaN(age) || age < 18 || age > 99) e.age = L.ageRange;

  if (!f.role) e.role = L.role;

  if (!f.school.trim() && !f.organization.trim()) e.schoolOrOrg = L.schoolOrOrg;

  return e;
}

// ── 다국어 ────────────────────────────────────────────────────

const T = {
  ko:{
    title:'Kinetic Clinical OS 시작하기',
    sub:'임상 도구를 사용하기 위해 정보를 입력해주세요.',
    name:'이름', email:'이메일', phone:'전화번호 (선택)', age:'나이',
    phonePH:'010-XXXX-XXXX',
    role:'직업 (역할)',
    roleHint:'직업에 맞게 사용할 수 있는 프로젝트가 결정됩니다.',
    student:'학생', practitioner:'임상가 / 기관 종사자', other:'기타',
    school:'재학 / 졸업 학교', org:'종사 센터 / 기관',
    schoolPH:'예: 연세대학교 물리치료학과', orgPH:'예: 서울재활의학과의원',
    condHint:'학교 또는 기관 중 하나는 반드시 입력해야 합니다.',
    submit:'대시보드 시작하기',
    back:'홈으로 돌아가기',
    already:'이미 계정이 있으신가요?',
    alreadyBtn:'바로 입장',
  },
  ja:{
    title:'Kinetic Clinical OS を始める',
    sub:'臨床ツールを使用するには情報を入力してください。',
    name:'氏名', email:'メールアドレス', phone:'電話番号（任意）', age:'年齢',
    phonePH:'090-XXXX-XXXX',
    role:'職業（役割）',
    roleHint:'職業に応じて利用できるプロジェクトが決まります。',
    student:'学生', practitioner:'臨床家 / 機関従事者', other:'その他',
    school:'在籍 / 卒業校', org:'所属センター / 機関',
    schoolPH:'例：東京大学理学療法学科', orgPH:'例：リハビリテーション科クリニック',
    condHint:'学校または機関のいずれかを必ず入力してください。',
    submit:'ダッシュボードを開始',
    back:'ホームに戻る',
    already:'すでにアカウントをお持ちですか？',
    alreadyBtn:'すぐに入場',
  },
  en:{
    title:'Get Started with Kinetic Clinical OS',
    sub:'Enter your details to access the clinical platform.',
    name:'Full Name', email:'Email Address', phone:'Phone (optional)', age:'Age',
    phonePH:'+82-10-XXXX-XXXX',
    role:'Role',
    roleHint:'Your accessible projects are determined by your selected role.',
    student:'Student', practitioner:'Clinician / Practitioner', other:'Other',
    school:'School / University', org:'Clinic / Organisation',
    schoolPH:'e.g., Seoul National University, Physical Therapy', orgPH:'e.g., Seoul Rehabilitation Clinic',
    condHint:'At least one of school or organisation is required.',
    submit:'Launch Dashboard',
    back:'Back to Home',
    already:'Already registered?',
    alreadyBtn:'Enter directly',
  },
} as const;

// ── 필드 래퍼 ─────────────────────────────────────────────────

function Field({ label, error, required, children }: { label:string; error?:string; required?:boolean; children:React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inp = "rounded-xl border bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-colors";
function inpCls(err?: string) { return `${inp} ${err ? 'border-red-400 dark:border-red-600 focus:border-red-400' : 'border-slate-200 dark:border-slate-700 focus:border-sky-400'}`; }

// ── 역할 선택 버튼 ────────────────────────────────────────────

const ROLE_META: { value: UserRole; icon: string }[] = [
  { value:'student',      icon:'🎓' },
  { value:'practitioner', icon:'🏥' },
  { value:'other',        icon:'👤' },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface Props { lang: Language; onBack: () => void; onEnter: () => void; }

export function SignupPage({ lang, onBack, onEnter }: Props) {
  const t = T[lang];
  const { register, isRegistered } = useUserAuth();
  const [form,   setForm]   = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  const set = useCallback(<K extends keyof FormState>(k: K, val: FormState[K]) => {
    setForm(p => ({ ...p, [k]: val }));
    if (touched) setErrors(prev => ({ ...prev, [k]: undefined }));
  }, [touched]);

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    set('phone', formatPhone(e.target.value));

  const handleAge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    set('age', v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    // 트림 후 검증
    const trimmed: FormState = {
      ...form,
      name:         form.name.trim(),
      email:        form.email.trim(),
      phone:        form.phone.trim(),
      school:       form.school.trim(),
      organization: form.organization.trim(),
    };
    setForm(trimmed);

    const errs = validate(trimmed, lang);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    register({
      name:         trimmed.name,
      email:        trimmed.email,
      phone:        trimmed.phone,
      age:          parseInt(trimmed.age),
      role:         trimmed.role as UserRole,
      school:       trimmed.school,
      organization: trimmed.organization,
    });
    onEnter();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* 브랜드 헤더 */}
        <div className="text-center mb-8">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-300 mb-4 block mx-auto transition-colors">
            ← {t.back}
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Kinetic <span className="text-sky-400">Clinical OS</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">{t.sub}</p>
        </div>

        {/* 이미 등록된 경우 */}
        {isRegistered && (
          <div className="mb-6 rounded-2xl border border-emerald-700 bg-emerald-950/40 p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-emerald-400">{t.already}</p>
            <button onClick={onEnter} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">
              {t.alreadyBtn}
            </button>
          </div>
        )}

        {/* 폼 카드 */}
        <form onSubmit={handleSubmit} noValidate
          className="rounded-2xl border border-slate-700 bg-slate-900 p-7 flex flex-col gap-5">

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.name} error={errors.name} required>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder={lang==='ko'?'홍길동':lang==='ja'?'山田 太郎':'John Doe'}
                className={inpCls(errors.name)}/>
            </Field>
            <Field label={t.age} error={errors.age} required>
              <input value={form.age} onChange={handleAge} placeholder="18-99"
                inputMode="numeric" className={inpCls(errors.age)}/>
            </Field>
          </div>

          <Field label={t.email} error={errors.email} required>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="name@example.com" className={inpCls(errors.email)}/>
          </Field>

          <Field label={t.phone}>
            <input value={form.phone} onChange={handlePhone}
              placeholder={t.phonePH} inputMode="tel" className={inpCls()}/>
          </Field>

          {/* 역할 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">
              {t.role}<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_META.map(r => (
                <button key={r.value} type="button"
                  onClick={() => set('role', r.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-semibold transition-all ${form.role === r.value ? 'border-sky-500 bg-sky-950/60 text-sky-300' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                  <span className="text-xl">{r.icon}</span>
                  <span>{(t as any)[r.value]}</span>
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
            <p className="text-xs text-slate-500 italic mt-0.5">{t.roleHint}</p>
          </div>

          {/* 학교 / 기관 (조건부 필수) */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {lang==='ko'?'소속 정보':lang==='ja'?'所属情報':'Affiliation'}
            </p>
            <Field label={t.school}>
              <input value={form.school} onChange={e => set('school', e.target.value)}
                placeholder={t.schoolPH} className={inpCls(errors.schoolOrOrg)}/>
            </Field>
            <Field label={t.org}>
              <input value={form.organization} onChange={e => set('organization', e.target.value)}
                placeholder={t.orgPH} className={inpCls(errors.schoolOrOrg)}/>
            </Field>
            {errors.schoolOrOrg ? (
              <p className="text-xs text-red-500">{errors.schoolOrOrg}</p>
            ) : (
              <p className="text-xs text-slate-500">{t.condHint}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button type="submit"
            className="mt-2 w-full rounded-2xl bg-sky-600 hover:bg-sky-500 py-4 text-base font-bold text-white transition-all shadow-xl shadow-sky-900/40 hover:-translate-y-0.5 active:translate-y-0">
            {t.submit} →
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
