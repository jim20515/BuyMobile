import { createHash, randomUUID } from 'node:crypto'
import type { CompanyProfile, PublishedQuotes, User } from './types'
import { useSupabase } from './supabase'

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export function newId(): string {
  return randomUUID()
}

function fail(message: string): never {
  throw createError({ statusCode: 500, statusMessage: message })
}

// ---------- 使用者 ----------

const DEFAULT_ADMIN: User = {
  username: 'admin',
  passwordHash: sha256('buymobile123'),
  displayName: '管理員',
  mustChangePassword: false,
}

function toUser(row: any): User {
  return {
    username: row.username,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    mustChangePassword: row.must_change_password,
  }
}

export async function getUsers(): Promise<User[]> {
  const supabase = useSupabase()
  const { data, error } = await supabase.from('users').select('*')
  if (error) fail(error.message)
  if (data && data.length > 0) return data.map(toUser)

  const { error: insertError } = await supabase.from('users').insert({
    username: DEFAULT_ADMIN.username,
    password_hash: DEFAULT_ADMIN.passwordHash,
    display_name: DEFAULT_ADMIN.displayName,
  })
  if (insertError) fail(insertError.message)
  return [DEFAULT_ADMIN]
}

export async function findUser(username: string, password: string): Promise<User | null> {
  const users = await getUsers()
  const hash = sha256(password)
  return users.find(u => u.username === username && u.passwordHash === hash) ?? null
}

export async function createUser(input: { username: string, password: string, displayName: string, mustChangePassword?: boolean }): Promise<User> {
  const supabase = useSupabase()
  const { error } = await supabase.from('users').insert({
    username: input.username,
    password_hash: sha256(input.password),
    display_name: input.displayName,
    must_change_password: input.mustChangePassword ?? false,
  })
  if (error) fail(error.message)
  return {
    username: input.username,
    passwordHash: sha256(input.password),
    displayName: input.displayName,
    mustChangePassword: input.mustChangePassword ?? false,
  }
}

export async function updateUserPassword(username: string, newPassword: string): Promise<void> {
  const supabase = useSupabase()
  const { error } = await supabase
    .from('users')
    .update({ password_hash: sha256(newPassword), must_change_password: false })
    .eq('username', username)
  if (error) fail(error.message)
}

// ---------- 報價 ----------

function toPublished(row: any): PublishedQuotes {
  return { date: row.date, publishedAt: row.published_at, publishedBy: row.published_by, items: row.items }
}

export async function getPublished(): Promise<PublishedQuotes | null> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('published_quotes')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) fail(error.message)
  return data ? toPublished(data) : null
}

export async function savePublished(doc: PublishedQuotes): Promise<void> {
  const supabase = useSupabase()
  const { error } = await supabase.from('published_quotes').upsert({
    date: doc.date,
    published_at: doc.publishedAt,
    published_by: doc.publishedBy,
    items: doc.items,
  }, { onConflict: 'date' })
  if (error) fail(error.message)
}

// ---------- 公司資訊（多組） ----------

function toCompany(row: any): CompanyProfile {
  return { id: row.id, title: row.title, taxId: row.tax_id, isActive: row.is_active, createdAt: row.created_at }
}

export async function getCompanies(): Promise<CompanyProfile[]> {
  const supabase = useSupabase()
  const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: true })
  if (error) fail(error.message)
  return (data ?? []).map(toCompany)
}

export async function getActiveCompany(): Promise<CompanyProfile | null> {
  const supabase = useSupabase()
  const { data, error } = await supabase.from('companies').select('*').eq('is_active', true).maybeSingle()
  if (error) fail(error.message)
  return data ? toCompany(data) : null
}

export async function createCompany(input: { title: string, taxId: string }): Promise<CompanyProfile> {
  const supabase = useSupabase()
  const { count, error: countError } = await supabase.from('companies').select('*', { count: 'exact', head: true })
  if (countError) fail(countError.message)

  const { data, error } = await supabase.from('companies').insert({
    title: input.title,
    tax_id: input.taxId,
    is_active: (count ?? 0) === 0, // 第一組自動設為啟用
  }).select().single()
  if (error) fail(error.message)
  return toCompany(data)
}

export async function updateCompany(id: string, input: { title: string, taxId: string }): Promise<CompanyProfile | null> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('companies')
    .update({ title: input.title, tax_id: input.taxId })
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) fail(error.message)
  return data ? toCompany(data) : null
}

export async function deleteCompany(id: string): Promise<boolean> {
  const supabase = useSupabase()
  // 若刪掉的是啟用中那組，前台就不顯示公司資訊（等使用者再指定）
  const { data, error } = await supabase.from('companies').delete().eq('id', id).select('id')
  if (error) fail(error.message)
  return (data?.length ?? 0) > 0
}

export async function activateCompany(id: string): Promise<boolean> {
  const supabase = useSupabase()
  const { data: existing, error: checkError } = await supabase.from('companies').select('id').eq('id', id).maybeSingle()
  if (checkError) fail(checkError.message)
  if (!existing) return false

  // 同時只有一組啟用
  const { error: clearError } = await supabase.from('companies').update({ is_active: false }).neq('id', id)
  if (clearError) fail(clearError.message)
  const { error: setError } = await supabase.from('companies').update({ is_active: true }).eq('id', id)
  if (setError) fail(setError.message)
  return true
}
