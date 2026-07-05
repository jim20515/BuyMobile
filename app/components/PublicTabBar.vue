<script setup lang="ts">
const route = useRoute()

const tabs = [
  { to: '/', label: '報價', icon: 'M9 17h6M9 13h6M9 9h1m4 0h1M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { to: '/compare', label: '採購比對', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
]
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
    <div class="mx-auto flex max-w-lg">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium"
        :class="route.path === tab.to ? 'text-sky-400' : 'text-slate-500'"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
        </svg>
        {{ tab.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
