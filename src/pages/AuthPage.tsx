// ============================================================
//  AuthPage — 로그인 / 회원가입 탭 통합 페이지
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';
import type { Language } from '../data/clinicalDB';

// ── 전화번호 자동 포맷 ────────────────────────────────────────

function formatPhone(v: string): string {
  const d = v.replace(/\D/g,'').slice(0,11);
  if (d.length<=3) return d;
  if (d.length<=7) return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ── 다국어 ────────────────────────────────────────────────────

const T = {
  ko:{
    tabLogin:'로그인', tabSignup:'회원가입',
    userId:'아이디', pw:'비밀번호', pwConfirm:'비밀번호 확인',
    remember:'아이디 기억하기', loginBtn:'로그인하기',
    err_id:'존재하지 않는 아이디입니다.', err_pw:'비밀번호가 올바르지 않습니다.',
    name:'이름', age:'나이 (18-99)', phone:'전화번호 (필수)', email:'이메일 (선택)',
    role:'직업 / 역할', roleHint:'직업에 따라 접근할 수 있는 기능이 결정됩니다.',
    student:'학생', practitioner:'임상가 / 기관 종사자', other:'기타',
    school:'재학 / 졸업 학교', org:'종사 센터 / 기관',
    condHint:'학교 또는 기관 중 하나는 반드시 입력해야 합니다.',
    signupBtn:'계정 만들기', err_exists:'이미 사용 중인 아이디입니다.',
    back:'← 홈으로', show:'보기', hide:'숨기기',
    affl:'소속 정보',
  },
  ja:{
    tabLogin:'ログイン', tabSignup:'会員登録',
    userId:'ユーザーID', pw:'パスワード', pwConfirm:'パスワード確認',
    remember:'IDを記憶する', loginBtn:'ログインする',
    err_id:'存在しないIDです。', err_pw:'パスワードが正しくありません。',
    name:'氏名', age:'年齢(18-99)', phone:'電話番号(必須)', email:'メール(任意)',
    role:'職業/役割', roleHint:'職業に応じて利用できる機能が決まります。',
    student:'学生', practitioner:'臨床家/機関従事者', other:'その他',
    school:'在籍/卒業校', org:'所属機関',
    condHint:'学校または機関のいずれかを必ず入力してください。',
    signupBtn:'アカウント作成', err_exists:'すでに使用中のIDです。',
    back:'← ホームへ', show:'表示', hide:'非表示',
    affl:'所属情報',
  },
  en:{
    tabLogin:'Sign In', tabSignup:'Sign Up',
    userId:'User ID', pw:'Password', pwConfirm:'Confirm Password',
    remember:'Remember my ID', loginBtn:'Sign In',
    err_id:'User ID not found.', err_pw:'Incorrect password.',
    name:'Full Name', age:'Age (18–99)', phone:'Phone (required)', email:'Email (optional)',
    role:'Role', roleHint:'Your accessible features are determined by role.',
    student:'Student', practitioner:'Clinician / Practitioner', other:'Other',
    school:'School / University', org:'Clinic / Organisation',
    condHint:'At least one of school or organisation is required.',
    signupBtn:'Create Account', err_exists:'This ID is already taken.',
    back:'← Home', show:'Show', hide:'Hide',
    affl:'Affiliation',
  },
} as const;

const F = ({ label, error, children }: { label:string; error?:string; children:React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-slate-300">{label}</label>
    {children}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const inp = (err?: string) => `rounded-xl border ${err?'border-red-500':'border-slate-600'} bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none w-full transition-colors`;

// ── 로그인 폼 ─────────────────────────────────────────────────

function LoginForm({ lang, onSuccess }: { lang: Language; onSuccess: () => void }) {
  const t = T[lang];
  const { login, getSavedId } = useAuth();
  const [userId,  setUserId]  = useState(getSavedId);
  const [pw,      setPw]      = useState('');
  const [rememberMe, setRememberMe] = useState(!!getSavedId());
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (getSavedId()) pwRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const result = await login(userId.trim(), pw, rememberMe);
      if (result === 'ID_NOT_FOUND') return setError(t.err_id);
      if (result === 'WRONG_PASSWORD') return setError(t.err_pw);
      onSuccess();
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <F label={t.userId}>
        <input value={userId} onChange={e=>setUserId(e.target.value)} className={inp()} placeholder={lang==='ko'?'영문/숫자 4-20자':'4-20 chars'}/>
      </F>
      <F label={t.pw}>
        <div className="relative">
          <input ref={pwRef} type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} className={inp()} style={{paddingRight:'3.5rem'}} placeholder="••••••••"/>
          <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200">
            {showPw?t.hide:t.show}
          </button>
        </div>
      </F>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} className="h-4 w-4 accent-sky-500"/>
        <span className="text-sm text-slate-400">{t.remember}</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="mt-2 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-3.5 text-sm font-bold text-white transition-all">
        {loading ? (lang==='ko'?'로그인 중…':lang==='ja'?'ログイン中…':'Signing in…') : t.loginBtn}
      </button>
    </form>
  );
}

// ── 회원가입 폼 ───────────────────────────────────────────────

interface SignupForm {
  userId: string; pw: string; pwConfirm: string;
  name: string; age: string; phone: string; email: string;
  role: UserRole | ''; school: string; org: string;
}
const EMPTY: SignupForm = { userId:'', pw:'', pwConfirm:'', name:'', age:'', phone:'', email:'', role:'', school:'', org:'' };

function SignupFormC({ lang, onSuccess }: { lang: Language; onSuccess: () => void }) {
  const t = T[lang];
  const { register } = useAuth();
  const [form, setForm] = useState<SignupForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm|'schoolOrOrg'|'idExists',string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof SignupForm>(k: K) => (v: string) => setForm(p => ({...p,[k]:v}));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.userId.trim() || !/^[a-zA-Z0-9_]{4,20}$/.test(form.userId.trim()))
      e.userId = lang==='ko'?'4~20자 영문/숫자/밑줄':lang==='ja'?'4〜20文字英数字':'4-20 chars, letters/numbers';
    if (!form.pw || form.pw.length < 8 || !/[A-Za-z]/.test(form.pw) || !/[0-9]/.test(form.pw))
      e.pw = lang==='ko'?'8자 이상, 영문+숫자 포함':lang==='ja'?'8文字以上英字+数字':'Min 8 chars with letter+number';
    if (form.pw !== form.pwConfirm)
      e.pwConfirm = lang==='ko'?'비밀번호가 일치하지 않습니다.':lang==='ja'?'パスワードが一致しません。':'Passwords do not match.';
    if (!form.name.trim())
      e.name = lang==='ko'?'이름을 입력해주세요.':lang==='ja'?'氏名を入力してください。':'Name is required.';
    const age = parseInt(form.age);
    if (isNaN(age) || age < 18 || age > 99)
      e.age = lang==='ko'?'18~99세 사이로 입력해주세요.':lang==='ja'?'18〜99歳':'Age must be 18–99.';
    const digits = form.phone.replace(/\D/g,'');
    if (digits.length < 9)
      e.phone = lang==='ko'?'올바른 전화번호를 입력해주세요.':lang==='ja'?'正しい電話番号を入力してください。':'Enter a valid phone number.';
    if (form.email && !EMAIL_RE.test(form.email.trim()))
      e.email = lang==='ko'?'올바른 이메일 형식이 아닙니다.':lang==='ja'?'正しいメール形式ではありません。':'Invalid email format.';
    if (!form.role)
      e.role = lang==='ko'?'직업을 선택해주세요.':lang==='ja'?'職業を選択してください。':'Please select a role.';
    if (!form.school.trim() && !form.org.trim())
      e.schoolOrOrg = lang==='ko'?'학교 또는 기관 중 하나를 입력해주세요.':lang==='ja'?'学校または機関を入力してください。':'Enter school or organisation.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register({
        userId:       form.userId.trim(),
        password:     form.pw,
        name:         form.name.trim(),
        age:          parseInt(form.age),
        phone:        form.phone.trim(),
        email:        form.email.trim(),
        role:         form.role as UserRole,
        school:       form.school.trim(),
        organization: form.org.trim(),
      });
      if (result === 'ID_EXISTS') return setErrors({idExists: t.err_exists});
      onSuccess();
    } finally { setLoading(false); }
  };

  const ROLES: { v: UserRole; icon: string }[] = [
    {v:'student',icon:'🎓'},{v:'practitioner',icon:'🏥'},{v:'other',icon:'👤'},
  ];

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <F label={`${t.userId} *`} error={errors.userId||errors.idExists}>
          <input value={form.userId} onChange={e=>set('userId')(e.target.value)} className={inp(errors.userId||errors.idExists)} placeholder="myid123"/>
        </F>
        <F label={`${t.age} *`} error={errors.age}>
          <input value={form.age} onChange={e=>set('age')(e.target.value.replace(/\D/g,'').slice(0,2))} className={inp(errors.age)} placeholder="25" inputMode="numeric"/>
        </F>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <F label={`${t.pw} *`} error={errors.pw}>
          <div className="relative">
            <input type={showPw?'text':'password'} value={form.pw} onChange={e=>set('pw')(e.target.value)} className={inp(errors.pw)} style={{paddingRight:'3.5rem'}} placeholder="••••••••"/>
            <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200">{showPw?t.hide:t.show}</button>
          </div>
        </F>
        <F label={`${t.pwConfirm} *`} error={errors.pwConfirm}>
          <input type={showPw?'text':'password'} value={form.pwConfirm} onChange={e=>set('pwConfirm')(e.target.value)} className={inp(errors.pwConfirm)} placeholder="••••••••"/>
        </F>
      </div>
      <F label={`${t.name} *`} error={errors.name}>
        <input value={form.name} onChange={e=>set('name')(e.target.value)} className={inp(errors.name)} placeholder={lang==='ko'?'홍길동':lang==='ja'?'山田 太郎':'John Doe'}/>
      </F>
      <F label={`${t.phone} *`} error={errors.phone}>
        <input value={form.phone} onChange={e=>set('phone')(formatPhone(e.target.value))} className={inp(errors.phone)} placeholder="010-XXXX-XXXX" inputMode="tel"/>
      </F>
      <F label={t.email} error={errors.email}>
        <input type="email" value={form.email} onChange={e=>set('email')(e.target.value)} className={inp(errors.email)} placeholder="name@example.com"/>
      </F>

      {/* 역할 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-300">{t.role} *</label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(r=>(
            <button key={r.v} type="button" onClick={()=>set('role')(r.v)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition-all ${form.role===r.v?'border-sky-500 bg-sky-950/60 text-sky-300':'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>
              <span className="text-xl">{r.icon}</span>
              <span>{(t as any)[r.v]}</span>
            </button>
          ))}
        </div>
        {errors.role && <p className="text-xs text-red-400">{errors.role}</p>}
        <p className="text-xs text-slate-500 italic">{t.roleHint}</p>
      </div>

      {/* 소속 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.affl}</p>
        <F label={t.school} error={errors.schoolOrOrg}>
          <input value={form.school} onChange={e=>set('school')(e.target.value)} className={inp(errors.schoolOrOrg)} placeholder={lang==='ko'?'예: 연세대학교 물리치료학과':'e.g. Seoul Nat. Univ.'}/>
        </F>
        <F label={t.org} error={errors.schoolOrOrg}>
          <input value={form.org} onChange={e=>set('org')(e.target.value)} className={inp(errors.schoolOrOrg)} placeholder={lang==='ko'?'예: 서울재활의학과의원':'e.g. Seoul Rehab Clinic'}/>
        </F>
        {errors.schoolOrOrg && <p className="text-xs text-red-400">{errors.schoolOrOrg}</p>}
        {!errors.schoolOrOrg && <p className="text-xs text-slate-500">{t.condHint}</p>}
      </div>

      <button type="submit" disabled={loading} className="mt-2 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5">
        {loading ? (lang==='ko'?'처리 중…':lang==='ja'?'処理中…':'Processing…') : `${t.signupBtn} →`}
      </button>
    </form>
  );
}

// ── 메인 AuthPage ─────────────────────────────────────────────

interface Props {
  lang:         Language;
  onLangChange: (l: Language) => void;
  onBack:       () => void;
  onSuccess:    () => void;
  initialTab?:  'login' | 'signup';
}

export function AuthPage({ lang, onLangChange, onBack, onSuccess, initialTab='login' }: Props) {
  const t = T[lang];
  const [tab, setTab] = useState<'login'|'signup'>(initialTab);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-300 mb-4 block mx-auto transition-colors">{t.back}</button>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Kinetic <span className="text-sky-400">Clinical OS</span>
          </h1>
          <div className="flex justify-center mt-3">
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {(['ko','ja','en'] as Language[]).map(l=>(
                <button key={l} onClick={()=>onLangChange(l)} className={`px-3 py-1.5 text-xs font-bold transition-all ${lang===l?'bg-sky-600 text-white':'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex rounded-2xl border border-slate-700 overflow-hidden mb-5">
          <button onClick={()=>setTab('login')} className={`flex-1 py-3 text-sm font-bold transition-all ${tab==='login'?'bg-sky-600 text-white':'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>{t.tabLogin}</button>
          <button onClick={()=>setTab('signup')} className={`flex-1 py-3 text-sm font-bold transition-all ${tab==='signup'?'bg-sky-600 text-white':'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>{t.tabSignup}</button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-7 overflow-y-auto max-h-[76vh]">
          {tab==='login'
            ? <LoginForm lang={lang} onSuccess={onSuccess}/>
            : <SignupFormC lang={lang} onSuccess={onSuccess}/>
          }
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
