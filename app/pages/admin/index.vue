<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '報價管理 — 後台' })

const message = ref('')
const parsing = ref(false)
const publishing = ref(false)
const parseError = ref('')
const publishOk = ref('')
const warnings = ref<string[]>([])
const items = ref<QuoteItemUI[]>([])
const quoteDate = ref(todayString())

// 目前已發佈的資訊
const { data: publishedData, refresh: refreshPublished } = await useFetch<{ quotes: PublishedQuotesUI | null }>('/api/admin/published')
const published = computed(() => publishedData.value?.quotes ?? null)

async function parse() {
  if (!message.value.trim()) {
    parseError.value = '請先貼上今天收到的報價訊息'
    return
  }
  parsing.value = true
  parseError.value = ''
  publishOk.value = ''
  try {
    const res = await $fetch<{ items: QuoteItemUI[], warnings: string[] }>('/api/admin/parse', {
      method: 'POST',
      body: { message: message.value },
    })
    items.value = res.items
    warnings.value = res.warnings
  }
  catch (err: any) {
    parseError.value = err?.statusMessage || err?.data?.statusMessage || 'AI 拆解失敗，請再試一次'
  }
  finally {
    parsing.value = false
  }
}

function loadPublished() {
  if (!published.value) return
  items.value = published.value.items.map(i => ({ ...i }))
  quoteDate.value = published.value.date
  warnings.value = []
  publishOk.value = ''
}

function addRow() {
  items.value.push({
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: items.value.at(-1)?.category ?? '未分類',
    brand: items.value.at(-1)?.brand ?? '',
    model: '',
    variant: null,
    colors: null,
    price: 0,
    note: null,
  })
}

function removeRow(id: string) {
  items.value = items.value.filter(i => i.id !== id)
}

async function publish() {
  if (items.value.length === 0) return
  if (!confirm(`確定發佈 ${items.value.length} 筆報價到前台？（日期：${quoteDate.value}）`)) return
  publishing.value = true
  parseError.value = ''
  publishOk.value = ''
  try {
    const res = await $fetch<{ count: number }>('/api/admin/publish', {
      method: 'POST',
      body: { date: quoteDate.value, items: items.value },
    })
    publishOk.value = `已發佈 ${res.count} 筆報價！前台已更新。`
    await refreshPublished()
  }
  catch (err: any) {
    parseError.value = err?.statusMessage || err?.data?.statusMessage || '發佈失敗，請再試一次'
  }
  finally {
    publishing.value = false
  }
}

// 分類統計（表格上方小結）
const categorySummary = computed(() => {
  const map = new Map<string, number>()
  for (const item of items.value) {
    map.set(item.category, (map.get(item.category) ?? 0) + 1)
  }
  return [...map.entries()]
})
</script>

<template>
  <div class="space-y-5 max-w-5xl">
    <!-- 目前發佈狀態 -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white border border-slate-200 rounded-xl">
      <div>
        <h2 class="text-sm font-semibold text-slate-800">目前前台顯示</h2>
        <p v-if="published" class="mt-0.5 text-xs text-slate-400">
          {{ published.date }} 報價 · {{ published.items.length }} 筆 ·
          發佈於 {{ formatDateTime(published.publishedAt) }}（{{ published.publishedBy }}）
        </p>
        <p v-else class="mt-0.5 text-xs text-slate-400">尚未發佈任何報價</p>
      </div>
      <button
        v-if="published"
        class="px-3 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
        @click="loadPublished"
      >
        載入已發佈內容來修改
      </button>
    </div>

    <!-- 貼訊息 + AI 拆解 -->
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <h2 class="text-sm font-semibold text-slate-800">貼上今天的報價訊息</h2>
      <p class="mt-0.5 text-xs text-slate-400">整段貼上即可，AI 會自動拆解成報價清單</p>
      <textarea
        v-model="message"
        rows="8"
        class="mt-3 w-full px-3 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder="17系列&#10;17E 256 18300&#10;17 256 白黑綠藍紫 25600&#10;17 pro 1T 銀48200 橘藍48000&#10;…"
      />
      <div class="mt-3 flex items-center gap-3">
        <button
          :disabled="parsing"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          @click="parse"
        >
          <svg v-if="parsing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          {{ parsing ? 'AI 拆解中…（約需十幾秒）' : 'AI 拆解' }}
        </button>
        <span v-if="items.length" class="text-xs text-slate-400">拆出 {{ items.length }} 筆</span>
      </div>
      <p v-if="parseError" class="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {{ parseError }}
      </p>
      <div v-if="warnings.length" class="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <p class="font-medium">AI 提醒：</p>
        <ul class="mt-1 list-inside list-disc">
          <li v-for="(w, i) in warnings" :key="i">{{ w }}</li>
        </ul>
      </div>
    </div>

    <!-- 檢查與編輯 -->
    <div v-if="items.length" class="bg-white border border-slate-200 rounded-xl">
      <div class="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-slate-100">
        <div>
          <h2 class="text-sm font-semibold text-slate-800">檢查與修改</h2>
          <p class="mt-0.5 text-xs text-slate-400">點欄位即可直接修改</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="[cat, count] in categorySummary"
            :key="cat"
            class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600"
          >
            {{ cat }} × {{ count }}
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead class="bg-slate-50">
            <tr class="border-b border-slate-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 w-32">分類</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 w-24">品牌</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500">型號</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 w-32">容量/規格</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 w-36">顏色</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-slate-500 w-28">未稅價</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 w-32">備註</th>
              <th class="px-2 py-3 w-10" />
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/50">
              <td class="px-2 py-1.5">
                <input v-model="item.category" class="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </td>
              <td class="px-2 py-1.5">
                <input v-model="item.brand" class="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </td>
              <td class="px-2 py-1.5">
                <input v-model="item.model" class="w-full px-2 py-1 rounded-lg border border-transparent font-medium text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </td>
              <td class="px-2 py-1.5">
                <input v-model="item.variant" class="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </td>
              <td class="px-2 py-1.5">
                <input v-model="item.colors" class="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </td>
              <td class="px-2 py-1.5">
                <input
                  v-model.number="item.price"
                  type="number"
                  class="w-full px-2 py-1 rounded-lg border border-transparent text-right font-semibold text-indigo-600 hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
              </td>
              <td class="px-2 py-1.5">
                <input v-model="item.note" class="w-full px-2 py-1 rounded-lg border border-transparent text-slate-500 hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </td>
              <td class="px-2 py-1.5 text-center">
                <button
                  class="text-slate-300 hover:text-red-400 transition"
                  title="刪除這筆"
                  @click="removeRow(item.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-5 py-3 border-t border-slate-100">
        <button
          class="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition"
          @click="addRow"
        >
          ＋ 新增一筆
        </button>
      </div>
    </div>

    <!-- 發佈 -->
    <div v-if="items.length" class="bg-white border border-slate-200 rounded-xl p-5">
      <h2 class="text-sm font-semibold text-slate-800">發佈到前台</h2>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <label class="text-xs font-medium text-slate-600">報價日期</label>
        <input
          v-model="quoteDate"
          type="date"
          class="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
        <button
          :disabled="publishing"
          class="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          @click="publish"
        >
          {{ publishing ? '發佈中…' : `發佈 ${items.length} 筆報價` }}
        </button>
      </div>
      <p v-if="publishOk" class="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        {{ publishOk }}
        <NuxtLink to="/" target="_blank" class="ml-1 text-indigo-500 hover:text-indigo-700 underline">查看前台</NuxtLink>
      </p>
    </div>
  </div>
</template>
