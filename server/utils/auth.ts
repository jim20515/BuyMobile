import type { H3Event } from 'h3'

interface AdminSessionData {
  user?: string
  displayName?: string
  mustChangePassword?: boolean
}

export function getAdminSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  return useSession<AdminSessionData>(event, {
    password: config.sessionPassword,
    name: 'buymobile-admin',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  })
}

/** 驗證登入，未登入丟 401 */
export async function requireAdmin(event: H3Event): Promise<{ user: string, displayName: string, mustChangePassword: boolean }> {
  const session = await getAdminSession(event)
  if (!session.data?.user) {
    throw createError({ statusCode: 401, statusMessage: '請先登入' })
  }
  return {
    user: session.data.user,
    displayName: session.data.displayName || session.data.user,
    mustChangePassword: session.data.mustChangePassword ?? false,
  }
}
