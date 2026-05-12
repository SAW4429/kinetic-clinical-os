-- ============================================================
--  Kinetic Clinical OS — Supabase 데이터베이스 스키마 v2
--  Supabase 대시보드 > SQL Editor 에서 전체 실행
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 사용자 프로필 (Supabase auth.users 확장) ───────────────────
-- auth.users 에는 이메일/비밀번호만 저장, 나머지 메타데이터는 여기에

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_str     TEXT        UNIQUE NOT NULL,   -- 앱 내 userId (로그인 식별자)
  name            TEXT        NOT NULL,
  age             INTEGER     CHECK (age BETWEEN 1 AND 120),
  phone           TEXT,
  email           TEXT,
  role            TEXT        DEFAULT 'student' CHECK (role IN ('student','practitioner','other')),
  school          TEXT        DEFAULT '',
  organization    TEXT        DEFAULT '',
  avatar_base64   TEXT,
  expert_code     TEXT        DEFAULT 'none',    -- 전문가 코드 tier
  registered_at   BIGINT      NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
  last_login_at   BIGINT
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_all" ON profiles FOR ALL USING (id = auth.uid());

-- ── 환자 테이블 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                TEXT        PRIMARY KEY,
  owner_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  age               INTEGER     NOT NULL CHECK (age >= 0 AND age < 150),
  gender            TEXT        NOT NULL CHECK (gender IN ('M', 'F', 'other')),
  condition         TEXT        NOT NULL,
  phone             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_visit_date   TEXT,
  deleted_at        BIGINT,
  soap_records      JSONB       NOT NULL DEFAULT '[]',
  biomarker_records JSONB       NOT NULL DEFAULT '[]',
  rom_analysis      JSONB       NOT NULL DEFAULT '[]',
  drafts            JSONB       NOT NULL DEFAULT '{"soap":null,"mps":null,"recovery":null}'
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_owner_all" ON patients FOR ALL USING (owner_id = auth.uid());

-- ── 휴지통 테이블 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycle_bin (
  id           TEXT        PRIMARY KEY,
  type         TEXT        NOT NULL CHECK (type IN ('patient','soap','biomarker','rom')),
  owner_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL,
  deleted_at   BIGINT      NOT NULL,
  data         JSONB       NOT NULL DEFAULT '{}'
);

ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recycle_bin_owner_all" ON recycle_bin FOR ALL USING (owner_id = auth.uid());

-- ── 인덱스 ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_str ON profiles(user_id_str);
CREATE INDEX IF NOT EXISTS idx_patients_owner       ON patients(owner_id);
CREATE INDEX IF NOT EXISTS idx_patients_deleted     ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bin_owner            ON recycle_bin(owner_id);
CREATE INDEX IF NOT EXISTS idx_bin_deleted_at       ON recycle_bin(deleted_at);

-- ── 자동 updated_at 트리거 (선택) ────────────────────────────
-- CREATE OR REPLACE FUNCTION update_updated_at()
-- RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- ══ 완료 ══════════════════════════════════════════════════════
-- 실행 후 Supabase > Authentication > Providers > Email 활성화
-- Confirm email: OFF 권장 (개발 중)
