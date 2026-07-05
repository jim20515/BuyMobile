import { createHash, randomUUID } from 'node:crypto'
import type { CompanyProfile, PublishedQuotes, User } from './types'

const store = () => useStorage('data')

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export function newId(): string {
  return randomUUID()
}

// ---------- 使用者 ----------

const DEFAULT_ADMIN: User = {
  username: 'admin',
  passwordHash: '', // 於 getUsers 內以預設密碼補上
  displayName: '管理員',
}

export async function getUsers(): Promise<User[]> {
  let users = await store().getItem<User[]>('users.json')
  if (!users || users.length === 0) {
    users = [{ ...DEFAULT_ADMIN, passwordHash: sha256('buymobile123') }]
    await store().setItem('users.json', users)
  }
  return users
}

export async function findUser(username: string, password: string): Promise<User | null> {
  const users = await getUsers()
  const hash = sha256(password)
  return users.find(u => u.username === username && u.passwordHash === hash) ?? null
}

// ---------- 報價 ----------

export async function getPublished(): Promise<PublishedQuotes | null> {
  return (await store().getItem<PublishedQuotes>('published.json')) ?? null
}

export async function savePublished(doc: PublishedQuotes): Promise<void> {
  await store().setItem('published.json', doc)
  // 每日留存一份歷史，之後要查過往報價都在
  await store().setItem(`history:${doc.date}.json`, doc)
}

// ---------- 公司資訊（多組） ----------

export async function getCompanies(): Promise<CompanyProfile[]> {
  return (await store().getItem<CompanyProfile[]>('companies.json')) ?? []
}

export async function saveCompanies(companies: CompanyProfile[]): Promise<void> {
  await store().setItem('companies.json', companies)
}

export async function getActiveCompany(): Promise<CompanyProfile | null> {
  const companies = await getCompanies()
  return companies.find(c => c.isActive) ?? null
}
