import type { PublishedQuotes, QuoteItem } from '../../utils/types'
import { newId, savePublished } from '../../utils/storage'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)
  const body = await readBody<{ date?: string, items?: Partial<QuoteItem>[] }>(event)

  const date = body?.date?.trim()
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: '報價日期格式錯誤（YYYY-MM-DD）' })
  }

  const rawItems = body?.items ?? []
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '沒有可發佈的報價項目' })
  }

  const items: QuoteItem[] = []
  for (const [i, raw] of rawItems.entries()) {
    const model = (raw.model ?? '').toString().trim()
    const price = Number(raw.price)
    if (!model) {
      throw createError({ statusCode: 400, statusMessage: `第 ${i + 1} 筆缺少型號` })
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw createError({ statusCode: 400, statusMessage: `「${model}」的價格不正確` })
    }
    items.push({
      id: raw.id || newId(),
      category: (raw.category ?? '').toString().trim() || '未分類',
      brand: (raw.brand ?? '').toString().trim(),
      model,
      variant: raw.variant ? raw.variant.toString().trim() : null,
      colors: raw.colors ? raw.colors.toString().trim() : null,
      price,
      note: raw.note ? raw.note.toString().trim() : null,
    })
  }

  const doc: PublishedQuotes = {
    date,
    publishedAt: new Date().toISOString(),
    publishedBy: user,
    items,
  }
  await savePublished(doc)

  return { ok: true, count: items.length, publishedAt: doc.publishedAt }
})
