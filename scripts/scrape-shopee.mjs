// 蝦皮 iPhone 競品價格爬蟲（競品監控用，少量型號、低頻率）
//
// 用法：
//   node scripts/scrape-shopee.mjs            # 正常跑（背景瀏覽器）
//   node scripts/scrape-shopee.mjs --headful  # 顯示瀏覽器視窗（除錯/過驗證用）
//
// 產出：data/competitors/YYYY-MM-DD.json
//
// 注意：蝦皮反爬蟲很兇。此腳本刻意「慢」——關鍵字之間隨機延遲、模擬捲動、
// 一天請勿多跑。若遇到 CAPTCHA，改用 --headful 手動過一次驗證即可。

import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TARGETS_FILE = join(__dirname, 'shopee-targets.json')
const OUT_DIR = join(ROOT, 'data', 'competitors')

const HEADFUL = process.argv.includes('--headful')
const SEARCH_API = '/api/v4/search/search_items'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const median = (arr) => {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}
const today = () => new Date().toISOString().slice(0, 10)

// 從攔截到的蝦皮 search API 回應中，萃取賣家與價格
function parseItems(json, target) {
  const rows = json?.items ?? []
  const out = []
  for (const row of rows) {
    const b = row?.item_basic
    if (!b) continue
    // 蝦皮價格是「微單位」，需除以 100000
    const price = Math.round((b.price ?? 0) / 100000)
    if (!price) continue
    if (target.minPrice && price < target.minPrice) continue
    if (target.maxPrice && price > target.maxPrice) continue
    out.push({
      price,
      name: b.name,
      sold: b.historical_sold ?? b.sold ?? 0,
      shopLocation: b.shop_location ?? null,
      url: `https://shopee.tw/product/${b.shopid}/${b.itemid}`,
    })
  }
  return out
}

async function scrapeTarget(page, target) {
  const url = `https://shopee.tw/search?keyword=${encodeURIComponent(target.keyword)}`

  // 攔截 search API 回應（比解析 DOM 穩定）
  const apiResponse = page
    .waitForResponse((r) => r.url().includes(SEARCH_API) && r.status() === 200, { timeout: 30000 })
    .catch(() => null)

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })

  // 模擬真人：慢慢往下捲，觸發資料載入
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, rand(600, 1200))
    await sleep(rand(800, 1800))
  }

  const resp = await apiResponse
  if (!resp) {
    return { model: target.model, keyword: target.keyword, error: '未攔截到搜尋 API（可能被擋或需驗證）', sellers: [] }
  }

  let json
  try {
    json = await resp.json()
  } catch {
    return { model: target.model, keyword: target.keyword, error: '回應非 JSON', sellers: [] }
  }

  const sellers = parseItems(json, target).sort((a, b) => a.price - b.price)
  const prices = sellers.map((s) => s.price)

  return {
    model: target.model,
    keyword: target.keyword,
    count: sellers.length,
    min: prices[0] ?? null,
    median: median(prices),
    max: prices[prices.length - 1] ?? null,
    // 只留最便宜的前 10 筆賣家，避免快照過肥
    sellers: sellers.slice(0, 10),
  }
}

async function main() {
  const { targets } = JSON.parse(await readFile(TARGETS_FILE, 'utf8'))
  console.log(`要監控 ${targets.length} 個型號，headful=${HEADFUL}`)

  const browser = await chromium.launch({ headless: !HEADFUL })
  const context = await browser.newContext({
    locale: 'zh-TW',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  })
  const page = await context.newPage()

  const results = []
  for (const [i, target] of targets.entries()) {
    console.log(`\n[${i + 1}/${targets.length}] 搜尋：${target.keyword}`)
    try {
      const r = await scrapeTarget(page, target)
      if (r.error) console.warn(`  ⚠ ${r.error}`)
      else console.log(`  ✓ ${r.count} 筆｜最低 ${r.min}｜中位 ${r.median}｜最高 ${r.max}`)
      results.push(r)
    } catch (e) {
      console.error(`  ✗ 失敗：${e.message}`)
      results.push({ model: target.model, keyword: target.keyword, error: e.message, sellers: [] })
    }
    // 型號之間隨機延遲，降低被擋機率
    if (i < targets.length - 1) {
      const wait = rand(8000, 20000)
      console.log(`  …等待 ${Math.round(wait / 1000)}s`)
      await sleep(wait)
    }
  }

  await browser.close()

  await mkdir(OUT_DIR, { recursive: true })
  const outFile = join(OUT_DIR, `${today()}.json`)
  const snapshot = { date: today(), scrapedAt: new Date().toISOString(), results }
  await writeFile(outFile, JSON.stringify(snapshot, null, 2), 'utf8')
  console.log(`\n完成，快照已寫入 ${outFile}`)
}

main().catch((e) => {
  console.error('爬蟲整體失敗：', e)
  process.exit(1)
})
