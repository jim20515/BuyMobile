<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '公司資訊 — 後台' })

const { data, refresh } = await useFetch<{ companies: CompanyProfileUI[] }>('/api/admin/companies')
const companies = computed(() => data.value?.companies ?? [])

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const errorMsg = ref('')

const form = reactive({
  title: '',
  taxId: '',
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { title: '', taxId: '' })
  errorMsg.value = ''
  showModal.value = true
}

function openEdit(company: CompanyProfileUI) {
  editingId.value = company.id
  Object.assign(form, {
    title: company.title,
    taxId: company.taxId,
  })
  errorMsg.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  errorMsg.value = ''
}

async function save() {
  saving.value = true
  errorMsg.value = ''
  try {
    if (editingId.value) {
      await $fetch(`/api/admin/companies/${editingId.value}`, { method: 'PUT', body: { ...form } })
    }
    else {
      await $fetch('/api/admin/companies', { method: 'POST', body: { ...form } })
    }
    closeModal()
    await refresh()
  }
  catch (err: any) {
    errorMsg.value = err?.statusMessage || err?.data?.statusMessage || '儲存失敗'
  }
  finally {
    saving.value = false
  }
}

async function activate(id: string) {
  await $fetch(`/api/admin/companies/${id}/activate`, { method: 'POST' })
  await refresh()
}

async function remove(company: CompanyProfileUI) {
  if (!confirm(`確定刪除「${company.title}」？`)) return
  await $fetch(`/api/admin/companies/${company.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="max-w-3xl space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold text-slate-800">公司資訊</h2>
        <p class="mt-0.5 text-xs text-slate-400">可建立多組公司名稱／統編，指定其中一組顯示在前台最上方</p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        @click="openCreate"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增一組
      </button>
    </div>

    <!-- 清單 -->
    <p v-if="!companies.length" class="text-sm text-slate-400 text-center py-12 bg-white border border-slate-200 rounded-xl">
      還沒有公司資訊，點右上角「新增一組」建立第一組
    </p>

    <div
      v-for="company in companies"
      :key="company.id"
      class="bg-white border rounded-xl p-5"
      :class="company.isActive ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-slate-800">{{ company.title }}</h3>
            <span
              v-if="company.isActive"
              class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600"
            >
              前台顯示中
            </span>
          </div>
          <dl class="mt-2 space-y-0.5 text-sm text-slate-600">
            <div v-if="company.taxId"><dt class="inline text-slate-400">統編：</dt><dd class="inline">{{ company.taxId }}</dd></div>
          </dl>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="!company.isActive"
            class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
            @click="activate(company.id)"
          >
            設為前台顯示
          </button>
          <button
            class="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
            @click="openEdit(company)"
          >
            編輯
          </button>
          <button
            class="text-slate-300 hover:text-red-400 transition p-1.5"
            title="刪除"
            @click="remove(company)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 新增 / 編輯 Modal -->
    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl">
          <div class="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 class="text-base font-semibold text-slate-800">{{ editingId ? '編輯公司資訊' : '新增公司資訊' }}</h2>
            <button class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition" @click="closeModal">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">公司名稱 *</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="例：六點資訊科技有限公司"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">統一編號</label>
              <input
                v-model="form.taxId"
                inputmode="numeric"
                maxlength="8"
                placeholder="8 位數字"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
            </div>
            <div v-if="errorMsg" class="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {{ errorMsg }}
            </div>
          </div>

          <div class="flex gap-3 px-6 pb-6">
            <button
              class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              @click="closeModal"
            >
              取消
            </button>
            <button
              :disabled="saving"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              @click="save"
            >
              {{ saving ? '儲存中…' : editingId ? '儲存變更' : '新增' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
