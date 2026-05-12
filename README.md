# Kinetic Clinical OS

스포츠 재활 전문 임상 분석 플랫폼 — React 19 + TypeScript + Tailwind CSS v4

---

## 목차
1. [로컬 개발 시작](#로컬-개발-시작)
2. [환경 변수 설정](#환경-변수-설정)
3. [Vercel 배포 가이드](#vercel-배포-가이드)
4. [업데이트 반영 방법 (Git 워크플로우)](#업데이트-반영-방법)
5. [Supabase 클라우드 DB 연동](#supabase-클라우드-db-연동)
6. [필수 계정 목록](#필수-계정-목록)

---

## 로컬 개발 시작

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/kinetic-clinical-os.git
cd kinetic-clinical-os

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 을 텍스트 편집기로 열어 값 입력

# 4. 개발 서버 실행
npm run dev
# → http://localhost:5173

# 5. 프로덕션 빌드 테스트
npm run build && npm run preview
```

---

## 환경 변수 설정

`.env.example` 을 복사해 `.env.local` 을 만드세요.  
`.env.local` 은 `.gitignore` 에 포함되어 **절대 GitHub 에 올라가지 않습니다**.

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `VITE_APP_ENV` | `development` / `production` | `development` |
| `VITE_USE_CLOUD_DB` | `true` = Supabase, `false` = localStorage | `false` |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | — |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public 키 | — |

---

## Vercel 배포 가이드

### 처음 배포할 때 (최초 1회)

1. **Vercel 계정 생성** → [vercel.com](https://vercel.com) 에서 GitHub 로그인
2. **New Project** 클릭 → GitHub 저장소 연결
3. **Framework Preset** → `Vite` 자동 감지
4. **Environment Variables** 탭에서 `.env.local` 값 입력:
   - `VITE_USE_CLOUD_DB` = `false`
5. **Deploy** 클릭 → 자동 빌드 및 배포 완료
6. 배포 URL: `https://your-project.vercel.app`

### Vercel 환경 변수 수정

Vercel 대시보드 → Project → Settings → **Environment Variables**

---

## 업데이트 반영 방법

코드를 수정한 후 아래 Git 명령어로 배포합니다.  
GitHub 에 `push` 하면 Vercel 이 **자동으로 재배포**합니다.

```bash
# 현재 변경 사항 확인
git status

# 변경된 파일 스테이징 (전체)
git add .

# 커밋 메시지 작성
git commit -m "feat: 환자 차팅 기능 개선"

# GitHub 에 푸시 → Vercel 자동 재배포
git push origin main
```

### 커밋 메시지 규칙 (권장)

| 태그 | 용도 |
|------|------|
| `feat:` | 새 기능 추가 |
| `fix:` | 버그 수정 |
| `style:` | UI/CSS 변경 |
| `refactor:` | 코드 정리 (기능 변경 없음) |
| `docs:` | 문서 수정 |

### 특정 버전으로 롤백

```bash
# 커밋 히스토리 확인
git log --oneline -10

# 특정 커밋으로 되돌리기 (예: abc1234)
git revert abc1234
git push origin main
```

---

## Supabase 클라우드 DB 연동

현재는 브라우저 `localStorage` 로 작동합니다.  
여러 사용자가 각자의 계정으로 데이터를 관리하려면 Supabase 를 연동하세요.

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → 계정 생성
2. **New Project** → 프로젝트 이름 입력, 비밀번호 설정, 리전: **Northeast Asia**
3. 생성 완료까지 약 2분 대기

### 2단계: 데이터베이스 스키마 실행

1. Supabase 대시보드 → **SQL Editor**
2. `src/lib/db/schema.sql` 파일 내용 전체를 복사해 붙여넣기
3. **Run** 버튼 클릭

### 3단계: Auth 활성화

Supabase 대시보드 → **Authentication** → **Providers** → **Email** 활성화

### 4단계: API 키 확인 및 적용

1. Supabase 대시보드 → **Settings** → **API**
2. `Project URL` 과 `anon public` 키 복사

**.env.local 수정:**
```
VITE_USE_CLOUD_DB=true
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5단계: SDK 설치 및 코드 활성화

```bash
npm install @supabase/supabase-js
```

`src/lib/db/supabaseClient.ts` 와 `src/lib/db/cloudAdapter.ts` 의  
주석 처리된 코드를 해제한 후,  
`src/context/PatientContext.tsx` import 경로 변경:

```typescript
// 변경 전
import { getAllPatients, ... } from '../store/patientStore';

// 변경 후
import { getAllPatientsCloud as getAllPatients, ... } from '../lib/db/cloudAdapter';
```

---

## 필수 계정 목록

| 순서 | 서비스 | 용도 | 가입 주소 | 요금 |
|------|--------|------|-----------|------|
| ① | **GitHub** | 코드 저장 · 버전 관리 | [github.com](https://github.com) | 무료 |
| ② | **Vercel** | 자동 배포 · CDN 호스팅 | [vercel.com](https://vercel.com) | 무료 (Hobby) |
| ③ | **Supabase** | 클라우드 DB · 인증 | [supabase.com](https://supabase.com) | 무료 (500MB) |
| ④ | **도메인** (선택) | 커스텀 주소 | 가비아 / Cloudflare | 연 1~3만원 |

### 가입 순서

1. **GitHub 먼저** — 코드를 올려야 Vercel 연결 가능
2. **Vercel** — GitHub 계정으로 로그인 (별도 가입 불필요)
3. **Supabase** — 수익화 준비 시점에 가입 (지금은 localStorage 로 충분)
4. **도메인** — 첫 고객 확보 후 구매 권장

### 무료 티어 한도

| 서비스 | 무료 한도 |
|--------|-----------|
| Vercel Hobby | 월 100GB 대역폭, 무제한 배포 |
| Supabase Free | DB 500MB, 월 5만 row 읽기, 인증 5만 MAU |
| GitHub Free | 무제한 공개/비공개 저장소 |

> Supabase 무료 플랜으로 초기 수백 명 사용자 대응 가능.

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 |
| 빌드 도구 | Vite 8 |
| 아이콘 | Lucide React |
| 차트 | Recharts |
| 현재 DB | Browser localStorage |
| 예정 DB | Supabase (PostgreSQL + RLS) |
| 배포 | Vercel (자동 CI/CD) |

---

*Kinetic Clinical OS — Sports Medicine Clinical Platform*
