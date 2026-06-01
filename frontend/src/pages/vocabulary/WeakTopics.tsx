import { useEffect, useState } from 'react'
import { analyticsApi } from '../../api/analyticsApi'

export default function WeakTopics() {
  const [mastery, setMastery] = useState<any>(null)

  useEffect(() => {
    void (async () => {
      try {
        const m = await analyticsApi.getMastery()
        setMastery(m)
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  if (!mastery) return <div style={{ padding: 20 }}>Loading...</div>

  // Treat low mastery bands as weak topics for now
  const weak = (mastery.bands || []).filter((b: any) => b.mastery < 0.5)

  return (
    <div style={{ padding: 20 }}>
      <h2>Weak Topics (derived from mastery)</h2>
      {weak.length === 0 ? (
        <div>No weak bands detected.</div>
      ) : (
        <ul>
          {weak.map((b: any) => (
            <li key={b.band}>{b.band} — mastery: {(b.mastery * 100).toFixed(0)}%</li>
          ))}
        </ul>
      )}
    </div>
  )
}
