<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: '登入 — 報價管理後台' })

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function login() {
  if (loading.value) return
  if (!username.value || !password.value) {
    errorMsg.value = '請輸入帳號與密碼'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    window.location.replace('/admin')
  }
  catch (err: any) {
    errorMsg.value = err?.statusMessage || err?.data?.statusMessage || '登入失敗，請再試一次'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800">每日手機報價</h1>
        <p class="text-sm text-slate-400 mt-1">報價管理後台</p>
      </div>

      <form class="space-y-4" @submit.prevent="login">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">帳號</label>
          <input
            v-model="username"
            type="text"
            placeholder="帳號"
            autocomplete="username"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">密碼</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
        </div>

        <div v-if="errorMsg" class="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {{ loading ? '處理中…' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>
