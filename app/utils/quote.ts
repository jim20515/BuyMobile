export interface QuoteItemUI {
  id: string
  category: string
  brand: string
  model: string
  variant: string | null
  colors: string | null
  price: number
  note: string | null
}

export interface PublishedQuotesUI {
  date: string
  publishedAt: string
  publishedBy: string
  items: QuoteItemUI[]
}

export interface CompanyProfileUI {
  id: string
  title: string
  taxId: string
  isActive: boolean
  createdAt: string
}

export function formatPrice(n: number): string {
  return n.toLocaleString('zh-TW')
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
