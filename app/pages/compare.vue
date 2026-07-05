<script setup lang="ts">
interface PublicCompany {
  title: string
  taxId: string
}

const { data } = await useFetch<{ quotes: PublishedQuotesUI | null, company: PublicCompany | null }>('/api/public/quotes')
const quotes = computed(() => data.value?.quotes ?? null)
const company = computed(() => data.value?.company ?? null)

useHead(() => ({
  title: company.value?.title ? `採購比對 — ${company.value.title}` : '採購比對',
  link: [{ rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }],
}))

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
        <h1 class="text-lg font-bold">🧮 採購比對</h1>
        <p v-if="quotes" class="text-xs text-slate-400">
          以 📅 {{ formatQuoteDate(quotes.date) }} 報價比對 · 含稅 ÷ 1.05 換算未稅
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-lg px-4">
      <!-- 尚未發佈 -->
      <div v-if="!quotes" class="mt-20 text-center">
        <div class="text-5xl">🧮</div>
        <p class="mt-4 text-slate-400">今日報價尚未發佈，暫時無法比對</p>
        <p class="mt-1 text-sm text-slate-600">請稍後再回來看看</p>
      </div>

      <div v-else class="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <PurchaseChecker :items="quotes.items" :date="quotes.date" theme="dark" />
      </div>

      <p class="mt-6 text-center text-xs text-slate-600">
        比對結果僅供參考，實際成交以現場確認為準
      </p>
    </main>

    <PublicTabBar />
  </div>
</template>
