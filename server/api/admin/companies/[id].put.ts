import { updateCompany } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ title?: string, taxId?: string }>(event)

  const title = body?.title?.trim()
  const taxId = body?.taxId?.trim() ?? ''
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '公司名稱為必填' })
  }
  if (taxId && !/^\d{8}$/.test(taxId)) {
    throw createError({ statusCode: 400, statusMessage: '統一編號需為 8 位數字' })
  }

  const company = await updateCompany(id, { title, taxId })
  if (!company) {
    throw createError({ statusCode: 404, statusMessage: '找不到這組公司資訊' })
  }

  return { ok: true, company }
})
