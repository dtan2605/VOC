const BASE = (import.meta.env.VITE_RECOMMENDATION_API_URL as string) || 'http://localhost:8005'

export const recommendationApi = {
  async recommend(userId: number, topK = 10) {
    const res = await fetch(`${BASE}/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, top_k: topK })
    })
    if (!res.ok) throw new Error('recommendation request failed')
    return res.json()
  }
}

export default recommendationApi
