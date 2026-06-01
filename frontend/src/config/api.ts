export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export const API_ROUTES = {
  auth: '/api/auth',
  user: '/api/user',
  vocabulary: '/api/vocabulary',
  topics: '/api/topics',
  bands: '/api/bands',
  learning: '/api/learning',
} as const
