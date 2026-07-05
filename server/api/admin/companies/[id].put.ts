import type { CompanyProfile } from '../../../utils/types'
import { getCompanies, saveCompanies } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<Partial<CompanyProfile>>(event)

  const companies = await getCompanies()
  const target = companies.find(c => c.id === id)
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: '找不到這組公司資訊' })
  }

  const title = body?.title?.trim()
  const taxId = body?.taxId?.trim() ?? ''
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '公司名稱為必填' })
  }
  if (taxId && !/^\d{8}$/.test(taxId)) {
    throw createError({ statusCode: 400, statusMessage: '統一編號需為 8 位數字' })
  }

  target.title = title
  target.taxId = taxId
  await saveCompanies(companies)

  return { ok: true, company: target }
})
