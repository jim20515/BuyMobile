import { getAdminSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getAdminSession(event)
  await session.clear()
  return { ok: true }
})
