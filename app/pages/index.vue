<script setup lang="ts">
interface PublicCompany {
  title: string
  taxId: string
}

const { data, refresh } = await useFetch<{ quotes: PublishedQuotesUI | null, company: PublicCompany | null }>('/api/public/quotes')
const quotes = computed(() => data.value?.quotes ?? null)
const company = computed(() => data.value?.company ?? null)

useHead(() => ({
  title: company.value?.title ? `${company.value.title} — 每日報價` : '每日手機報價',
  link: [{ rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }],
}))

const search = ref('')

// 依分類分組（保留出現順序），並套用搜尋
const groups = computed(() => {
  if (!quotes.value) return []
  const keyword = search.value.trim().toLowerCase()
  const map = new Map<string, QuoteItemUI[]>()
  for (const item of quotes.value.items) {
    if (keyword) {
      const haystack = `${item.model} ${item.variant ?? ''} ${item.colors ?? ''} ${item.category}`.toLowerCase()
      if (!haystack.includes(keyword)) continue
    }
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category)!.push(item)
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }))
})

const totalShown = computed(() => groups.value.reduce((sum, g) => sum + g.items.length, 0))

const shareState = ref<'idle' | 'copied'>('idle')

async function share() {
  const url = window.location.href
  const title = company.value?.title ? `${company.value.title} 每日報價` : '每日手機報價'
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    }
    catch {
      // 使用者取消分享則不做事
      return
    }
  }
  await navigator.clipboard.writeText(url)
  shareState.value = 'copied'
  setTimeout(() => (shareState.value = 'idle'), 2000)
}

function formatQuoteDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}/${m}/${d}`
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 pb-24 text-slate-100">
    <!-- 頁首 -->
    <header class="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div class="mx-auto max-w-lg px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h1 class="truncate text-lg font-bold">
              {{ company?.title || '每日手機報價' }}
            </h1>
            <p v-if="company?.taxId" class="text-xs text-slate-400">
              統編 {{ company.taxId }}
            </p>
            <p v-if="quotes" class="text-xs text-slate-400">
              📅 {{ formatQuoteDate(quotes.date) }} 報價 · 更新 {{ formatDateTime(quotes.publishedAt) }}
            </p>
          </div>
          <button
            class="shrink-0 cursor-pointer rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white active:bg-sky-600"
            @click="share"
          >
            {{ shareState === 'copied' ? '已複製 ✓' : '分享 ↗' }}
          </button>
        </div>
        <!-- 搜尋 -->
        <div v-if="quotes" class="mt-2.5">
          <input
            v-model="search"
            type="search"
            placeholder="🔍 搜尋型號，例如：17 pro、ipad、S25"
            class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
          >
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-lg px-4">
      <!-- 尚未發佈 -->
      <div v-if="!quotes" class="mt-20 text-center">
        <div class="text-5xl">📱</div>
        <p class="mt-4 text-slate-400">今日報價尚未發佈</p>
        <p class="mt-1 text-sm text-slate-600">請稍後再回來看看</p>
      </div>

      <!-- 搜尋無結果 -->
      <div v-else-if="totalShown === 0" class="mt-16 text-center text-slate-500">
        找不到「{{ search }}」相關的型號
      </div>

      <!-- 報價清單 -->
      <template v-if="quotes && totalShown > 0">
        <p class="mt-3 text-right text-xs text-slate-500">共 {{ totalShown }} 筆 · 價格皆為未稅價</p>
        <section v-for="group in groups" :key="group.category" class="mt-4">
          <h2 class="flex items-center gap-2 text-sm font-bold text-sky-400">
            <span class="h-px flex-1 bg-slate-800" />
            {{ group.category }}
            <span class="h-px flex-1 bg-slate-800" />
          </h2>
          <ul class="mt-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <li
              v-for="(item, i) in group.items"
              :key="item.id"
              class="flex items-center justify-between gap-3 px-4 py-3"
              :class="i > 0 ? 'border-t border-slate-800' : ''"
            >
              <div class="min-w-0">
                <p class="font-medium text-slate-100">
                  {{ item.model }}
                  <span v-if="item.variant" class="ml-1 text-sm text-slate-400">{{ item.variant }}</span>
                </p>
                <p v-if="item.colors || item.note" class="mt-0.5 truncate text-xs text-slate-500">
                  <span v-if="item.colors">{{ item.colors }}</span>
                  <span v-if="item.colors && item.note"> · </span>
                  <span v-if="item.note">{{ item.note }}</span>
                </p>
              </div>
              <p class="shrink-0 text-lg font-bold text-sky-400">
                ${{ formatPrice(item.price) }}
              </p>
            </li>
          </ul>
        </section>
      </template>

      <p class="mt-6 text-center text-xs text-slate-600">
        價格為未稅參考價，實際成交以現場確認為準
      </p>
    </main>

    <PublicTabBar />
  </div>
</template>
