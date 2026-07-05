import { getActiveCompany, getPublished } from '../../utils/storage'

// 前台公開 API：不需登入
export default defineEventHandler(async () => {
  const [quotes, company] = await Promise.all([getPublished(), getActiveCompany()])
  return {
    quotes,
    company: company
      ? {
          title: company.title,
          taxId: company.taxId,
        }
      : null,
  }
})
