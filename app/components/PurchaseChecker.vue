<script setup lang="ts">
const props = withDefaults(defineProps<{
  items: QuoteItemUI[]
  date?: string
  theme?: 'light' | 'dark'
}>(), { theme: 'light' })

const TAX_RATE = 1.05 // 台灣營業稅 5%

function itemLabel(item: QuoteItemUI): string {
  const parts = [item.model]
  if (item.variant) parts.push(item.variant)
  if (item.colors) parts.push(item.colors)
  return parts.join(' · ')
}

// ── 型號自動完成 ──
const query = ref('')
const showList = ref(false)
const selectedItem = ref<QuoteItemUI | null>(null)
const taxedPriceInput = ref<number | null>(null)

const suggestions = computed(() => {
  const kw = query.value.trim().toLowerCase()
  if (!kw) return props.items.slice(0, 30)
  const tokens = kw.split(/\s+/)
  return props.items
    .filter((item) => {
      const hay = `${item.model} ${item.variant ?? ''} ${item.colors ?? ''} ${item.category}`.toLowerCase()
      return tokens.every(t => hay.includes(t))
    })
    .slice(0, 30)
})

function onInput() {
  showList.value = true
  selectedItem.value = null
}

function pick(item: QuoteItemUI) {
  selectedItem.value = item
  query.value = itemLabel(item)
  showList.value = false
}

// ── 比對結果 ──
interface CheckResult {
  id: number
  label: string
  quotePrice: number
  taxedPrice: number
  untaxedPrice: number
  diff: number
  time: string
}

const result = computed<Omit<CheckResult, 'id' | 'time'> | null>(() => {
  if (!selectedItem.value || !taxedPriceInput.value || taxedPriceInput.value <= 0) return null
  const untaxed = Math.round(taxedPriceInput.value / TAX_RATE)
  return {
    label: itemLabel(selectedItem.value),
    quotePrice: selectedItem.value.price,
    taxedPrice: taxedPriceInput.value,
    untaxedPrice: untaxed,
    diff: selectedItem.value.price - untaxed,
  }
})

// 本次瀏覽的比對紀錄（僅存在頁面上）
const history = ref<CheckResult[]>([])
let historyId = 0

function saveToHistory() {
  if (!result.value) return
  history.value.unshift({
    ...result.value,
    id: ++historyId,
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
  })
}

// ── 主題樣式 ──
const dark = computed(() => props.theme === 'dark')
const t = computed(() => dark.value
  ? {
      label: 'block text-xs font-medium text-slate-400 mb-1.5',
      input: 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500',
      panel: 'absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl',
      option: 'flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800',
      optionPrice: 'shrink-0 font-semibold text-sky-400',
      resultOk: 'border-green-500/40 bg-green-500/10',
      resultEven: 'border-amber-500/40 bg-amber-500/10',
      resultNo: 'border-red-500/40 bg-red-500/10',
      verdictOk: 'text-green-400',
      verdictEven: 'text-amber-400',
      verdictNo: 'text-red-400',
      statBox: 'rounded-lg bg-slate-950/60 px-3 py-2',
      statLabel: 'text-xs text-slate-500',
      statValue: 'font-semibold text-slate-200',
      saveBtn: 'mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition',
      historyCard: 'rounded-xl border border-slate-800 bg-slate-900',
      historyHead: 'px-4 py-3 border-b border-slate-800 text-sm font-semibold text-slate-200',
      historyItem: 'flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm border-t border-slate-800 first:border-t-0',
      historyLabel: 'font-medium text-slate-200',
      historyMuted: 'text-xs text-slate-500',
      badgeOk: 'bg-green-500/15 text-green-400',
      badgeEven: 'bg-amber-500/15 text-amber-400',
      badgeNo: 'bg-red-500/15 text-red-400',
    }
  : {
      label: 'block text-xs font-medium text-slate-600 mb-1.5',
      input: 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300',
      panel: 'absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg',
      option: 'flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50',
      optionPrice: 'shrink-0 font-semibold text-indigo-600',
      resultOk: 'border-green-200 bg-green-50',
      resultEven: 'border-amber-200 bg-amber-50',
      resultNo: 'border-red-200 bg-red-50',
      verdictOk: 'text-green-700',
      verdictEven: 'text-amber-700',
      verdictNo: 'text-red-600',
      statBox: 'rounded-lg bg-white/80 px-3 py-2',
      statLabel: 'text-xs text-slate-400',
      statValue: 'font-semibold text-slate-700',
      saveBtn: 'mt-3 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition',
      historyCard: 'bg-white border border-slate-200 rounded-xl',
      historyHead: 'px-5 py-4 border-b border-slate-100 text-sm font-semibold text-slate-800',
      historyItem: 'flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm border-t border-slate-50 first:border-t-0 hover:bg-slate-50/50',
      historyLabel: 'font-medium text-slate-700',
      historyMuted: 'text-xs text-slate-400',
      badgeOk: 'bg-green-50 text-green-700',
      badgeEven: 'bg-amber-50 text-amber-700',
      badgeNo: 'bg-red-50 text-red-600',
    })
</script>

<template>
  <div class="space-y-4">
    <!-- 型號自動完成 -->
    <div class="relative">
      <label :class="t.label">型號{{ date ? `（${date} 報價）` : '' }}</label>
      <input
        v-model="query"
        type="text"
        placeholder="輸入型號關鍵字，例如：17 pro、ipad、S25"
        :class="t.input"
        @focus="showList = true"
        @input="onInput"
        @blur="showList = false"
      >
      <ul v-if="showList && suggestions.length" :class="t.panel">
        <li
          v-for="item in suggestions"
          :key="item.id"
          :class="t.option"
          @mousedown.prevent="pick(item)"
        >
          <span class="min-w-0 truncate">{{ itemLabel(item) }}</span>
          <span :class="t.optionPrice">${{ formatPrice(item.price) }}</span>
        </li>
      </ul>
      <p v-if="showList && query.trim() && !suggestions.length" class="mt-1.5 text-xs" :class="dark ? 'text-slate-500' : 'text-slate-400'">
        找不到符合的型號
      </p>
    </div>

    <!-- 含稅價輸入 -->
    <div>
      <label :class="t.label">你的採購價（含稅）</label>
      <input
        v-model.number="taxedPriceInput"
        type="number"
        inputmode="numeric"
        min="0"
        placeholder="例如：42000"
        :class="[t.input, 'text-base font-semibold']"
      >
    </div>

    <!-- 結果 -->
    <div
      v-if="result"
      class="rounded-xl border p-4"
      :class="result.diff > 0 ? t.resultOk : result.diff === 0 ? t.resultEven : t.resultNo"
    >
      <p class="text-lg font-bold" :class="result.diff > 0 ? t.verdictOk : result.diff === 0 ? t.verdictEven : t.verdictNo">
        <template v-if="result.diff > 0">✓ 可以採購</template>
        <template v-else-if="result.diff === 0">— 打平（無利潤空間）</template>
        <template v-else>✕ 不建議採購</template>
      </p>
      <div class="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div :class="t.statBox">
          <p :class="t.statLabel">你的含稅價 ÷ 1.05</p>
          <p :class="t.statValue">未稅 ${{ formatPrice(result.untaxedPrice) }}</p>
        </div>
        <div :class="t.statBox">
          <p :class="t.statLabel">當日未稅報價</p>
          <p :class="t.statValue">${{ formatPrice(result.quotePrice) }}</p>
        </div>
        <div :class="t.statBox">
          <p :class="t.statLabel">價差（報價 − 採購）</p>
          <p class="font-bold" :class="result.diff > 0 ? t.verdictOk : result.diff === 0 ? t.verdictEven : t.verdictNo">
            {{ result.diff > 0 ? '+' : '' }}{{ formatPrice(result.diff) }}
          </p>
        </div>
      </div>
      <button :class="t.saveBtn" @click="saveToHistory">
        記到下方清單
      </button>
    </div>

    <!-- 比對紀錄 -->
    <div v-if="history.length" :class="t.historyCard">
      <div :class="t.historyHead">本次比對紀錄</div>
      <ul>
        <li v-for="h in history" :key="h.id" :class="t.historyItem">
          <div class="min-w-0">
            <span class="mr-2" :class="t.historyMuted">{{ h.time }}</span>
            <span :class="t.historyLabel">{{ h.label }}</span>
            <span class="ml-2" :class="t.historyMuted">含稅 ${{ formatPrice(h.taxedPrice) }} → 未稅 ${{ formatPrice(h.untaxedPrice) }}</span>
          </div>
          <span
            class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
            :class="h.diff > 0 ? t.badgeOk : h.diff === 0 ? t.badgeEven : t.badgeNo"
          >
            {{ h.diff > 0 ? `可採購 +${formatPrice(h.diff)}` : h.diff === 0 ? '打平' : `不建議 ${formatPrice(h.diff)}` }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
