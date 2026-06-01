import { useEffect, useState } from 'react'
import { analyticsApi } from '../../api/analyticsApi'
import { learningApi } from '../../api/learningApi'
import AnalyticsCharts from '../../components/AnalyticsCharts'

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [streaks, setStreaks] = useState<any>(null)
  const [mastery, setMastery] = useState<any>(null)

  useEffect(() => {
    void (async () => {
      try {
        // Prefer LearningService progress (uses existing entities) — fallback to AnalyticsService
        const progress = await learningApi.getProgress()
        if (progress) {
          setStats({ totalStudySessions: progress.overview.totalSessions, totalReviewed: progress.overview.totalReviews })
          setStreaks({ currentStreak: progress.overview.currentStudyStreakDays, longestStreak: progress.overview.bestAnswerStreak })
          // learningApi returns percentage (0-100); convert to 0-1 for mastery UI
          setMastery({ averageMastery: (progress.overview.averageMasteryScore || 0) / 100, timeseries: [] })
        } else {
          const s = await analyticsApi.getStudyStats()
          setStats(s)
          const st = await analyticsApi.getStreaks()
          setStreaks(st)
          const m = await analyticsApi.getMastery()
          setMastery(m)
        }
      } catch (err) {
        // ignore for scaffold
      }
    })()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#111', fontWeight: 900 }}>Analytics Dashboard</h2>
      <p style={{ color: '#666', marginTop: 6 }}>A refined view of your study progress — colors follow the app theme (white, red, black).</p>
      <div style={{ marginTop: 16 }}>
        <AnalyticsCharts stats={stats} streaks={streaks} mastery={mastery} />
      </div>
    </div>
  )
}
