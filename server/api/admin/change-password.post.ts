import { findUser, updateUserPassword } from '../../utils/storage'
import { getAdminSession, requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)
  const body = await readBody<{ currentPassword?: string, newPassword?: string }>(event)

  const currentPassword = body?.currentPassword ?? ''
  const newPassword = body?.newPassword ?? ''

  if (!(await findUser(user, currentPassword))) {
    throw createError({ statusCode: 401, statusMessage: '目前密碼不正確' })
  }
  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: '新密碼至少需要 8 個字元' })
  }
  if (newPassword === currentPassword) {
    throw createError({ statusCode: 400, statusMessage: '新密碼不可與目前密碼相同' })
  }

  await updateUserPassword(user, newPassword)

  const session = await getAdminSession(event)
  await session.update({ ...session.data, mustChangePassword: false })

  return { ok: true }
})
