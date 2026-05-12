// ============================================================
//  validators.ts — Zod-스타일 입력 검증 함수 모음
// ============================================================

import type { Language } from '../data/clinicalDB';

export interface VResult { ok: boolean; error?: string; }
const OK: VResult = { ok: true };
const err = (msg: string): VResult => ({ ok: false, error: msg });

// ── 로컬라이즈 에러 맵 ───────────────────────────────────────

const M = {
  userId: {
    ko: { required:'아이디를 입력해주세요.', format:'4~20자 영문/숫자/밑줄만 사용 가능합니다.' },
    ja: { required:'ユーザーIDを入力してください。', format:'4〜20文字の英数字・アンダースコアのみ使用可能です。' },
    en: { required:'User ID is required.', format:'4–20 characters: letters, numbers and underscores only.' },
  },
  password: {
    ko: { required:'비밀번호를 입력해주세요.', length:'8자 이상이어야 합니다.', letter:'영문자를 포함해야 합니다.', number:'숫자를 포함해야 합니다.' },
    ja: { required:'パスワードを入力してください。', length:'8文字以上必要です。', letter:'英文字を含む必要があります。', number:'数字を含む必要があります。' },
    en: { required:'Password is required.', length:'Minimum 8 characters.', letter:'Must include a letter.', number:'Must include a number.' },
  },
  passwordConfirm: {
    ko: { mismatch:'비밀번호가 일치하지 않습니다.' },
    ja: { mismatch:'パスワードが一致しません。' },
    en: { mismatch:'Passwords do not match.' },
  },
  name: {
    ko: { required:'이름을 입력해주세요.' },
    ja: { required:'お名前を入力してください。' },
    en: { required:'Name is required.' },
  },
  age: {
    ko: { required:'나이를 입력해주세요.', range:'18~99세 사이로 입력해주세요.' },
    ja: { required:'年齢を入力してください。', range:'18〜99歳の範囲で入力してください。' },
    en: { required:'Age is required.', range:'Age must be between 18 and 99.' },
  },
  phone: {
    ko: { required:'전화번호를 입력해주세요.', format:'올바른 전화번호를 입력해주세요.' },
    ja: { required:'電話番号を入力してください。', format:'正しい電話番号を入力してください。' },
    en: { required:'Phone number is required.', format:'Enter a valid phone number.' },
  },
  email: {
    ko: { format:'올바른 이메일 형식이 아닙니다.' },
    ja: { format:'正しいメール形式ではありません。' },
    en: { format:'Invalid email format.' },
  },
  schoolOrOrg: {
    ko: { required:'학교 또는 기관 중 하나는 반드시 입력해야 합니다.' },
    ja: { required:'学校または機関のいずれかを必ず入力してください。' },
    en: { required:'At least one of school or organisation is required.' },
  },
  rom: {
    ko: { range:(min:number,max:number)=>`${min}°~${max}° 범위로 입력해주세요.` },
    ja: { range:(min:number,max:number)=>`${min}°〜${max}°の範囲で入力してください。` },
    en: { range:(min:number,max:number)=>`Enter a value between ${min}° and ${max}°.` },
  },
};

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ── 개별 검증 함수 ────────────────────────────────────────────

export function validateUserId(id: string, lang: Language): VResult {
  const t = M.userId[lang];
  if (!id.trim()) return err(t.required);
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(id.trim())) return err(t.format);
  return OK;
}

export function validatePassword(pw: string, lang: Language): VResult {
  const t = M.password[lang];
  if (!pw) return err(t.required);
  if (pw.length < 8) return err(t.length);
  if (!/[A-Za-z]/.test(pw)) return err(t.letter);
  if (!/[0-9]/.test(pw)) return err(t.number);
  return OK;
}

export function validatePasswordConfirm(pw: string, confirm: string, lang: Language): VResult {
  if (pw !== confirm) return err(M.passwordConfirm[lang].mismatch);
  return OK;
}

export function validateName(name: string, lang: Language): VResult {
  if (!name.trim()) return err(M.name[lang].required);
  return OK;
}

export function validateAge(ageStr: string, lang: Language): VResult {
  const t = M.age[lang];
  if (!ageStr.trim()) return err(t.required);
  const age = parseInt(ageStr);
  if (isNaN(age) || age < 18 || age > 99) return err(t.range);
  return OK;
}

export function validatePhone(phone: string, lang: Language): VResult {
  const t = M.phone[lang];
  if (!phone.trim()) return err(t.required);
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 11) return err(t.format);
  return OK;
}

export function validateEmail(email: string, lang: Language): VResult {
  if (!email.trim()) return OK; // optional
  if (!EMAIL_RE.test(email.trim())) return err(M.email[lang].format);
  return OK;
}

export function validateSchoolOrOrg(school: string, org: string, lang: Language): VResult {
  if (!school.trim() && !org.trim()) return err(M.schoolOrOrg[lang].required);
  return OK;
}

export function validateROM(value: string, min: number, max: number, lang: Language): VResult {
  if (!value.trim()) return OK; // optional
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) return err(M.rom[lang].range(min, max));
  return OK;
}

// ── 폼 전체 검증 결과 타입 ────────────────────────────────────

export type SignupErrors = Partial<Record<
  'userId'|'password'|'passwordConfirm'|'name'|'age'|'phone'|'email'|'role'|'schoolOrOrg',
  string
>>;

export interface SignupFormData {
  userId: string; password: string; passwordConfirm: string;
  name: string; age: string; phone: string; email: string;
  role: string; school: string; organization: string;
}

export function validateSignupForm(f: SignupFormData, lang: Language): SignupErrors {
  const e: SignupErrors = {};
  const r = (k: keyof SignupErrors, v: VResult) => { if (!v.ok && v.error) e[k] = v.error; };

  r('userId',          validateUserId(f.userId, lang));
  r('password',        validatePassword(f.password, lang));
  r('passwordConfirm', validatePasswordConfirm(f.password, f.passwordConfirm, lang));
  r('name',            validateName(f.name, lang));
  r('age',             validateAge(f.age, lang));
  r('phone',           validatePhone(f.phone, lang));
  r('email',           validateEmail(f.email, lang));
  r('schoolOrOrg',     validateSchoolOrOrg(f.school, f.organization, lang));

  if (!f.role) {
    e.role = lang==='ko'?'역할을 선택해주세요.':lang==='ja'?'役割を選択してください。':'Please select your role.';
  }
  return e;
}

// ── 전화번호 자동 포맷 ────────────────────────────────────────

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}
