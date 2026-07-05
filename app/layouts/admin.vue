<script setup lang="ts">
import { h } from 'vue'

const route = useRoute()
const sidebarOpen = ref(false)
watch(route, () => { sidebarOpen.value = false })

const icon = (d: string) => () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d }),
])

const navItems = [
  {
    path: '/admin',
    label: '報價管理',
    icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'),
  },
  {
    path: '/admin/purchase',
    label: '採購比對',
    icon: icon('M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'),
  },
  {
    path: '/admin/settings',
    label: '公司資訊',
    icon: icon('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'),
  },
]

const titleMap: Record<string, string> = {
  '/admin': '報價管理',
  '/admin/purchase': '採購比對',
  '/admin/settings': '公司資訊',
  '/admin/change-password': '修改密碼',
}

const pageTitle = computed(() => titleMap[route.path] ?? '報價管理後台')
const today = computed(() =>
  new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
)

const isActive = (path: string) => route.path === path

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  window.location.replace('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- 手機遮罩 -->
    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/40 z-30 md:hidden" @click="sidebarOpen = false" />

    <!-- 側邊欄 -->
    <aside
      class="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="px-6 py-5 border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800">每日手機報價</p>
            <p class="text-xs text-slate-400">Quote Dashboard</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        <p class="px-3 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">主選單</p>
        <ul class="space-y-0.5 leading-normal">
          <li v-for="item in navItems" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="isActive(item.path)
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
              @click="sidebarOpen = false"
            >
              <component :is="item.icon" class="w-5 h-5 shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>

        <p class="px-3 mt-6 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">前台</p>
        <ul class="space-y-0.5 leading-normal">
          <li>
            <NuxtLink
              to="/"
              target="_blank"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              前台報價頁
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="px-4 py-4 border-t border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span class="text-xs font-semibold text-indigo-600">管</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">管理員</p>
            <p class="text-xs text-slate-400 truncate">每日報價管理</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主內容 -->
    <div class="md:ml-60 flex-1 flex flex-col min-h-screen overflow-x-hidden">
      <header class="bg-white border-b border-slate-200 px-4 md:px-6">
        <div class="h-14 flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <button class="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0" @click="sidebarOpen = true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div class="min-w-0">
              <h1 class="text-base font-semibold text-slate-800 truncate">{{ pageTitle }}</h1>
              <p class="text-xs text-slate-400 hidden sm:block">{{ today }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <NuxtLink
              to="/"
              target="_blank"
              class="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              前台預覽
            </NuxtLink>
            <div class="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-1">
              <NuxtLink
                to="/admin/change-password"
                class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="修改密碼"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </NuxtLink>
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="登出"
                @click="logout"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
