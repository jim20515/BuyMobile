import { setUserActive } from '../../../../utils/storage'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const { user: currentUser } = await requireAdmin(event)
  const username = getRouterParam(event, 'username')!
  const body = await readBody<{ isActive?: boolean }>(event)

  if (typeof body?.isActive !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: '缺少啟用狀態' })
  }
  if (!body.isActive && username === currentUser) {
    throw createError({ statusCode: 400, statusMessage: '無法停用自己目前登入的帳號' })
  }

  const updated = await setUserActive(username, body.isActive)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: '找不到這個帳號' })
  }

  return { ok: true }
})
