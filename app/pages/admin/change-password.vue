<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '修改密碼 — 後台' })

const { data } = await useFetch<{ mustChangePassword: boolean }>('/api/admin/me')
const forced = computed(() => data.value?.mustChangePassword ?? false)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errorMsg = ref('')

async function submit() {
  errorMsg.value = ''
  if (newPassword.value.length < 8) {
    errorMsg.value = '新密碼至少需要 8 個字元'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '兩次輸入的新密碼不一致'
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/change-password', {
      method: 'POST',
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value },
    })
    window.location.replace('/admin')
  }
  catch (err: any) {
    errorMsg.value = err?.statusMessage || err?.data?.statusMessage || '修改失敗，請再試一次'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-sm">
    <div class="bg-white border border-slate-200 rounded-xl p-6">
      <h2 class="text-sm font-semibold text-slate-800">修改密碼</h2>
      <p v-if="forced" class="mt-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        這是您第一次登入，請先設定新密碼再繼續使用後台
      </p>

      <form class="mt-4 space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">目前密碼</label>
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">新密碼（至少 8 碼）</label>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">確認新密碼</label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
        </div>

        <div v-if="errorMsg" class="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="saving"
          class="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {{ saving ? '處理中…' : '更新密碼' }}
        </button>
      </form>
    </div>
  </div>
</template>
