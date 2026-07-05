import type { CompanyProfile } from '../../../utils/types'
import { getCompanies, newId, saveCompanies } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Partial<CompanyProfile>>(event)

  const title = body?.title?.trim()
  const taxId = body?.taxId?.trim() ?? ''
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '公司名稱為必填' })
  }
  if (taxId && !/^\d{8}$/.test(taxId)) {
    throw createError({ statusCode: 400, statusMessage: '統一編號需為 8 位數字' })
  }

  const companies = await getCompanies()
  const profile: CompanyProfile = {
    id: newId(),
    title,
    taxId,
    // 第一組自動設為啟用
    isActive: companies.length === 0,
    createdAt: new Date().toISOString(),
  }
  companies.push(profile)
  await saveCompanies(companies)

  return { ok: true, company: profile }
})
