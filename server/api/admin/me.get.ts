import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { user, displayName } = await requireAdmin(event)
  return { user, displayName }
})
