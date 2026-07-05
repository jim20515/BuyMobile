import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Service role key：只在伺服器端使用，繞過 RLS，絕不能傳到前端
export function useSupabase(): SupabaseClient {
  if (client) return client

  const config = useRuntimeConfig()
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: '尚未設定 Supabase 連線資訊：請在 .env 填入 NUXT_SUPABASE_URL 與 NUXT_SUPABASE_SERVICE_KEY',
    })
  }

  client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false },
  })
  return client
}
