// 後台頁面登入保護：未登入導向登入頁
export default defineNuxtRouteMiddleware(async () => {
  const requestFetch = useRequestFetch()
  try {
    await requestFetch('/api/admin/me')
  }
  catch {
    return navigateTo('/admin/login')
  }
})
