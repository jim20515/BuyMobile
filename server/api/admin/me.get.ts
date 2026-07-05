import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { user, displayName, mustChangePassword } = await requireAdmin(event)
  return { user, displayName, mustChangePassword }
})
