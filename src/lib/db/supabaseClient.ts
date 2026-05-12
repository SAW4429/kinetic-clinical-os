// ============================================================
//  supabaseClient.ts — Supabase 클라이언트 (실서비스 활성화 버전)
//
//  활성화 방법:
//    1. .env.local 에 아래 두 값 입력
//    2. VITE_USE_CLOUD_DB=true 설정
//    3. npm run dev 재시작
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// USE_CLOUD_DB: 환경 변수 + 자격증명 둘 다 있어야 활성화
export const USE_CLOUD_DB: boolean =
  import.meta.env.VITE_USE_CLOUD_DB === 'true' &&
  !!SUPABASE_URL?.startsWith('https://') &&
  !!SUPABASE_ANON_KEY?.startsWith('eyJ');

// supabase: 자격증명이 없으면 null (localStorage 모드에서 안전하게 사용)
export const supabase: SupabaseClient | null = USE_CLOUD_DB
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null;

if (import.meta.env.DEV) {
  console.info(
    USE_CLOUD_DB
      ? `%c☁️  Supabase Cloud DB 활성화됨 (${SUPABASE_URL})`
      : '%c🗄️  localStorage 모드 (VITE_USE_CLOUD_DB=false)',
    'font-weight:bold;color:#38bdf8'
  );
}
