// 共用型別定義（本機檔案儲存版；之後可無痛換成 Supabase）

export interface User {
  username: string
  passwordHash: string
  displayName: string
}

export interface QuoteItem {
  id: string
  /** 分類/區段，例：iPhone 17 系列、iPad、配件、三星 */
  category: string
  /** 品牌：Apple、Samsung… */
  brand: string
  /** 正規化型號，例：iPhone 17 Pro Max */
  model: string
  /** 容量/規格，例：256GB、1TB、8GB/256GB */
  variant: string | null
  /** 顏色（頓號分隔），例：銀、橘、藍 */
  colors: string | null
  /** 未稅價（新台幣） */
  price: number
  note: string | null
}

export interface PublishedQuotes {
  /** 報價日期 YYYY-MM-DD */
  date: string
  publishedAt: string
  publishedBy: string
  items: QuoteItem[]
}

export interface CompanyProfile {
  id: string
  /** 公司名稱 */
  title: string
  /** 統一編號 */
  taxId: string
  /** 是否為前台目前顯示的那組 */
  isActive: boolean
  createdAt: string
}
