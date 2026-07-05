import { getCompanies, saveCompanies } from '../../../../utils/storage'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const companies = await getCompanies()
  const target = companies.find(c => c.id === id)
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: '找不到這組公司資訊' })
  }

  // 同時只有一組啟用
  for (const c of companies) {
    c.isActive = c.id === id
  }
  await saveCompanies(companies)

  return { ok: true }
})
