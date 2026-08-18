import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'barbershop_token'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Any consumer that needs to react to a hard 401 (e.g. AuthContext clearing
 * the session) can register a listener here instead of importing React
 * state into this module.
 */
type UnauthorizedListener = () => void
let unauthorizedListener: UnauthorizedListener | null = null

export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListener = listener
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedListener?.()
    }
    return Promise.reject(error)
  }
)

/** Pulls a human-readable message out of a Laravel error response. */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (data?.errors) {
      const firstField = Object.values(data.errors)[0]
      if (firstField?.[0]) return firstField[0]
    }
    if (data?.message) return data.message
  }
  return fallback
}

export default client
