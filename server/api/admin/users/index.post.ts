import { createUser, generatePassword, usernameExists } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ username?: string, displayName?: string }>(event)

  const username = body?.username?.trim()
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: '請輸入帳號' })
  }
  if (await usernameExists(username)) {
    throw createError({ statusCode: 409, statusMessage: '這個帳號已經存在' })
  }

  const password = generatePassword()
  const user = await createUser({
    username,
    password,
    displayName: body?.displayName?.trim() || username,
    mustChangePassword: true,
  })

  return {
    ok: true,
    user: {
      username: user.username,
      displayName: user.displayName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    password,
  }
})
