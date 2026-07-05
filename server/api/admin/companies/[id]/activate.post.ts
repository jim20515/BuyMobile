import { activateCompany } from '../../../../utils/storage'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const activated = await activateCompany(id)
  if (!activated) {
    throw createError({ statusCode: 404, statusMessage: '找不到這組公司資訊' })
  }

  return { ok: true }
})
