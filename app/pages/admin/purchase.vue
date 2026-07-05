<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '採購比對 — 後台' })

const { data: publishedData } = await useFetch<{ quotes: PublishedQuotesUI | null }>('/api/admin/published')
const published = computed(() => publishedData.value?.quotes ?? null)
const items = computed(() => published.value?.items ?? [])
</script>

<template>
  <div class="max-w-2xl space-y-5">
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <h2 class="text-sm font-semibold text-slate-800">採購比對</h2>
      <p class="mt-0.5 text-xs text-slate-400">
        輸入型號關鍵字選擇機型，再輸入對方報的含稅價，系統換算未稅（÷1.05）後與當日報價比對
      </p>

      <div v-if="!items.length" class="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
        目前沒有已發佈的報價，請先到「報價管理」發佈當日報價。
      </div>

      <div v-else class="mt-4">
        <PurchaseChecker :items="items" :date="published?.date" theme="light" />
      </div>
    </div>
  </div>
</template>
