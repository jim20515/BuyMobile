import { findUser } from '../../utils/storage'
import { getAdminSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string, password?: string }>(event)
  const username = body?.username?.trim()
  const password = body?.password

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '請輸入帳號與密碼' })
  }

  const user = await findUser(username, password)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '帳號或密碼錯誤' })
  }

  const session = await getAdminSession(event)
  await session.update({ user: user.username, displayName: user.displayName })

  return { ok: true, user: user.username, displayName: user.displayName }
})
