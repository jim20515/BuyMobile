import { getCompanies } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { companies: await getCompanies() }
})
