import { getCompanies, saveCompanies } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const companies = await getCompanies()
  const target = companies.find(c => c.id === id)
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: '找不到這組公司資訊' })
  }

  const rest = companies.filter(c => c.id !== id)
  // 若刪掉的是啟用中那組，前台就不顯示公司資訊（等使用者再指定）
  await saveCompanies(rest)

  return { ok: true }
})
