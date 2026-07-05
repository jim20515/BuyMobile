import { getPublished } from '../../utils/storage'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { quotes: await getPublished() }
})
