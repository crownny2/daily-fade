import client from './client'
import type { User } from '@/types'

export interface AuthResponse {
  user: User
  token: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
}

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  const { data } = await client.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterPayload) {
  const { data } = await client.post<AuthResponse>('/auth/register', payload)
  return data
}

export async function logout() {
  await client.post('/auth/logout')
}

export async function fetchCurrentUser() {
  const { data } = await client.get<{ user: User }>('/auth/user')
  return data.user
}
