import { useEffect, useState } from 'react'
import { recommendationApi } from '../../api/recommendationApi'

export default function RecommendPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const resp = await recommendationApi.recommend(1, 10)
        setItems(resp.items || [])
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>Recommended Words</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {items.map((it) => (
            <li key={it.word_id}>
              Word ID: {it.word_id} — score: {it.score.toFixed(3)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
