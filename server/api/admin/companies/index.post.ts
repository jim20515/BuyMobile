import { createCompany } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ title?: string, taxId?: string }>(event)

  const title = body?.title?.trim()
  const taxId = body?.taxId?.trim() ?? ''
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '公司名稱為必填' })
  }
  if (taxId && !/^\d{8}$/.test(taxId)) {
    throw createError({ statusCode: 400, statusMessage: '統一編號需為 8 位數字' })
  }

  const company = await createCompany({ title, taxId })
  return { ok: true, company }
})
