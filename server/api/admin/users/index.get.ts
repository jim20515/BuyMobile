import { getUsers } from '../../../utils/storage'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const users = await getUsers()
  return {
    users: users.map(u => ({
      username: u.username,
      displayName: u.displayName,
      mustChangePassword: u.mustChangePassword,
      isActive: u.isActive,
      createdAt: u.createdAt,
    })),
  }
})
