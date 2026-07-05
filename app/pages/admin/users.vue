<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '帳號管理 — 後台' })

interface AdminUser {
  username: string
  displayName: string
  mustChangePassword: boolean
  isActive: boolean
  createdAt: string
}

const { data, refresh } = await useFetch<{ users: AdminUser[] }>('/api/admin/users')
const users = computed(() => data.value?.users ?? [])

const { data: meData } = await useFetch<{ user: string }>('/api/admin/me')
const currentUsername = computed(() => meData.value?.user ?? '')

const showCreateModal = ref(false)
const showPasswordModal = ref(false)
const creating = ref(false)
const errorMsg = ref('')
const togglingUsername = ref('')

const form = reactive({ username: '', displayName: '' })
const created = reactive({ username: '', password: '' })
const copied = ref(false)

function openCreate() {
  Object.assign(form, { username: '', displayName: '' })
  errorMsg.value = ''
  showCreateModal.value = true
}

function closeCreate() {
  showCreateModal.value = false
  errorMsg.value = ''
}

async function createAccount() {
  if (!form.username.trim()) {
    errorMsg.value = '請輸入帳號'
    return
  }
  creating.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch<{ user: AdminUser, password: string }>('/api/admin/users', {
      method: 'POST',
      body: { username: form.username.trim(), displayName: form.displayName.trim() },
    })
    created.username = res.user.username
    created.password = res.password
    copied.value = false
    showCreateModal.value = false
    showPasswordModal.value = true
    await refresh()
  }
  catch (err: any) {
    errorMsg.value = err?.statusMessage || err?.data?.statusMessage || '建立失敗，請再試一次'
  }
  finally {
    creating.value = false
  }
}

async function copyPassword() {
  await navigator.clipboard.writeText(created.password)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

async function toggleStatus(u: AdminUser) {
  togglingUsername.value = u.username
  try {
    await $fetch(`/api/admin/users/${encodeURIComponent(u.username)}/status`, {
      method: 'POST',
      body: { isActive: !u.isActive },
    })
    await refresh()
  }
  catch (err: any) {
    alert(err?.statusMessage || err?.data?.statusMessage || '操作失敗，請再試一次')
  }
  finally {
    togglingUsername.value = ''
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold text-slate-800">帳號管理</h2>
        <p class="mt-0.5 text-xs text-slate-400">新增後台登入帳號，系統會自動產生密碼；帳號第一次登入時需修改密碼</p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        @click="openCreate"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增帳號
      </button>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50">
          <tr class="border-b border-slate-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-slate-500">帳號</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-slate-500">顯示名稱</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-slate-500">狀態</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-slate-500">建立時間</th>
            <th class="px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="u in users" :key="u.username" class="hover:bg-slate-50/50">
            <td class="px-4 py-3">
              <p class="font-medium text-slate-700">{{ u.username }}</p>
              <p v-if="u.mustChangePassword" class="mt-0.5 text-xs text-amber-600">尚未修改初始密碼</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ u.displayName }}</td>
            <td class="px-4 py-3">
              <span
                class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                :class="u.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ u.isActive ? '啟用中' : '已停用' }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-400">{{ formatDateTime(u.createdAt) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                v-if="u.username !== currentUsername"
                :disabled="togglingUsername === u.username"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition disabled:opacity-50"
                :class="u.isActive
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-green-200 text-green-700 hover:bg-green-50'"
                @click="toggleStatus(u)"
              >
                {{ u.isActive ? '停用' : '啟用' }}
              </button>
              <span v-else class="text-xs text-slate-300">目前登入中</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增帳號 Modal -->
    <Transition name="fade">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        @click.self="closeCreate"
      >
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl">
          <div class="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 class="text-base font-semibold text-slate-800">新增帳號</h2>
            <button class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition" @click="closeCreate">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">帳號 *</label>
              <input
                v-model="form.username"
                type="text"
                placeholder="例：name@example.com"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                @keyup.enter="createAccount"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">顯示名稱</label>
              <input
                v-model="form.displayName"
                type="text"
                placeholder="留空則使用帳號"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                @keyup.enter="createAccount"
              >
            </div>
            <p class="text-xs text-slate-400">系統會自動產生一組密碼，建立後請立即複製並交給使用者，該密碼只會顯示一次。</p>
            <div v-if="errorMsg" class="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {{ errorMsg }}
            </div>
          </div>
          <div class="flex gap-3 px-6 pb-6">
            <button
              class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              @click="closeCreate"
            >
              取消
            </button>
            <button
              :disabled="creating"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              @click="createAccount"
            >
              {{ creating ? '建立中…' : '建立帳號' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 建立成功：顯示密碼 Modal -->
    <Transition name="fade">
      <div
        v-if="showPasswordModal"
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
          <h2 class="text-base font-semibold text-slate-800">帳號建立成功</h2>
          <p class="mt-1 text-xs text-slate-400">請複製這組密碼交給使用者，關閉後將無法再次查看</p>

          <div class="mt-4 space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">帳號</label>
              <p class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700">{{ created.username }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">初始密碼</label>
              <div class="flex gap-2">
                <p class="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 select-all">
                  {{ created.password }}
                </p>
                <button
                  class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition shrink-0"
                  :class="copied ? 'text-green-600 border-green-200' : 'text-slate-600'"
                  @click="copyPassword"
                >
                  {{ copied ? '已複製 ✓' : '複製' }}
                </button>
              </div>
            </div>
          </div>

          <button
            class="mt-6 w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            @click="showPasswordModal = false"
          >
            我已複製，關閉
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
