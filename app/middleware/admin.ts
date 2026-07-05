// 後台頁面登入保護：未登入導向登入頁；需改密碼時強制導向改密碼頁
export default defineNuxtRouteMiddleware(async (to) => {
  const requestFetch = useRequestFetch()
  try {
    const me = await requestFetch<{ user: string, displayName: string, mustChangePassword: boolean }>('/api/admin/me')
    if (me.mustChangePassword && to.path !== '/admin/change-password') {
      return navigateTo('/admin/change-password')
    }
    if (!me.mustChangePassword && to.path === '/admin/change-password') {
      return navigateTo('/admin')
    }
  }
  catch {
    return navigateTo('/admin/login')
  }
})
