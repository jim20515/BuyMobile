import Anthropic from '@anthropic-ai/sdk'
import { newId } from '../../utils/storage'
import { requireAdmin } from '../../utils/auth'

const SYSTEM_PROMPT = `你是手機通路每日報價訊息的解析器。使用者貼上的訊息是通路商每天發的報價單，價格一律為「未稅價」（新台幣）。你的任務是把訊息拆解成結構化的報價清單。

解析規則：
1. 一個「價格點」一筆資料。同一行若有多組「顏色 → 不同價格」，必須拆成多筆。
   例：「17 pro 1T 銀48200 橘藍48000」→ 兩筆：(顏色=銀, 價格=48200)、(顏色=橘、藍, 價格=48000)
   例：「Ipad 11 128 藍銀 11500 粉黃11300」→ 兩筆：(顏色=藍、銀, 價格=11500)、(顏色=粉、黃, 價格=11300)
2. 顏色和價格常黏在一起，要正確切開。例：「橘藍銀35700」→ 顏色=橘、藍、銀，價格=35700
3. 區段標題（如「17系列」「其他型號額外報」「三星 其他型號現貨報」）是分類提示，不是商品，用來決定 category。
4. 型號正規化：
   - iPhone 系列補上前綴：「17 pro max」→「iPhone 17 Pro Max」、「17E」→「iPhone 17e」、「17 air」→「iPhone 17 Air」
   - iPad 正確大小寫：「ipad air 11 M4」→「iPad Air 11 (M4)」、「ipad mini a17 8.3」→「iPad mini (A17)」
   - AirPods：「airpods pro 3」→「AirPods Pro 3」；「airpods 4降」的「降」代表降噪版 →「AirPods 4（主動降噪）」
   - 三星：「A56」→「Galaxy A56」、「S25 U」→「Galaxy S25 Ultra」、「S25 +」→「Galaxy S25+」
5. variant 為容量/規格：「256」→「256GB」、「1T」→「1TB」、「8/256」→「8GB/256GB」。沒有就 null。
6. 顏色用頓號「、」分隔：「白黑綠藍紫」→「白、黑、綠、藍、紫」。沒有標顏色就 null。
7. brand 依型號判斷：iPhone/iPad/AirPods → Apple；Galaxy → Samsung；其他依常識。
8. category 依區段給簡潔名稱，例：「iPhone 17 系列」「iPad」「配件」「三星」。
9. price 一律為數字（未稅價）。
10. 看不懂或不確定的行，放進 warnings 說明，不要瞎猜價格。`

const PARSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: '拆解後的報價項目',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', description: '分類，例：iPhone 17 系列、iPad、配件、三星' },
          brand: { type: 'string', description: '品牌，例：Apple、Samsung' },
          model: { type: 'string', description: '正規化型號，例：iPhone 17 Pro Max' },
          variant: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
            description: '容量/規格，例：256GB、1TB、8GB/256GB',
          },
          colors: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
            description: '顏色（頓號分隔），例：銀、橘、藍',
          },
          price: { type: 'number', description: '未稅價（新台幣）' },
          note: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
            description: '備註（不確定的資訊放這裡）',
          },
        },
        required: ['category', 'brand', 'model', 'variant', 'colors', 'price', 'note'],
        additionalProperties: false,
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: '無法解析或不確定的內容說明',
    },
  },
  required: ['items', 'warnings'],
  additionalProperties: false,
} as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ message?: string }>(event)
  const message = body?.message?.trim()
  if (!message) {
    throw createError({ statusCode: 400, statusMessage: '請先貼上報價訊息' })
  }

  const config = useRuntimeConfig(event)
  if (!config.anthropicApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: '尚未設定 Claude API 金鑰：請在專案根目錄 .env 填入 NUXT_ANTHROPIC_API_KEY',
    })
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message }],
    output_config: { format: { type: 'json_schema', schema: PARSE_SCHEMA } },
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw createError({ statusCode: 500, statusMessage: 'AI 沒有回傳解析結果，請再試一次' })
  }

  let parsed: { items: any[], warnings: string[] }
  try {
    parsed = JSON.parse(textBlock.text)
  }
  catch {
    throw createError({ statusCode: 500, statusMessage: 'AI 回傳格式異常，請再試一次' })
  }

  const items = (parsed.items ?? []).map(item => ({
    id: newId(),
    category: item.category ?? '未分類',
    brand: item.brand ?? '',
    model: item.model ?? '',
    variant: item.variant ?? null,
    colors: item.colors ?? null,
    price: Number(item.price) || 0,
    note: item.note ?? null,
  }))

  return {
    ok: true,
    items,
    warnings: parsed.warnings ?? [],
  }
})
