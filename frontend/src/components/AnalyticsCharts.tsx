import React from 'react'
import type {
  ChartOptions,
} from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type Stats = any
type Streaks = any
type Mastery = { averageMastery: number; timeseries?: Array<{ date: string; avgMastery: number }>} | null

export default function AnalyticsCharts({ stats, streaks, mastery }: { stats: Stats; streaks: Streaks; mastery: Mastery }) {
  const timeseries = (mastery?.timeseries || []).map((t: any) => ({ date: new Date(t.date).toLocaleDateString(), value: t.avgMastery }))
  const barData = (stats?.daily || []).map((d: any) => ({ date: new Date(d.date).toLocaleDateString(), count: d.count }))
  const gaugeValue = mastery ? Math.round((mastery.averageMastery || 0) * 100) : 0

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
    color: '#111',
  }

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        cornerRadius: 8,
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f3f3',
        },
        ticks: {
          color: '#666',
          font: { size: 12 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
          font: { size: 11 },
        },
      },
    },
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
        {/* Bar Chart Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#C51E3A', fontWeight: 700 }}>Overview</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>Study Progress</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#C51E3A' }}>{stats?.totalStudySessions ?? 0}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Study days</div>
            </div>
          </div>

          <div style={{ height: 200 }}>
            {barData.length > 0 ? (
              <Bar
                data={{
                  labels: barData.map((d: any) => d.date),
                  datasets: [
                    {
                      label: 'Sessions',
                      data: barData.map((d: any) => d.count),
                      backgroundColor: '#C51E3A',
                      borderColor: '#C51E3A',
                      borderRadius: 6,
                      borderSkipped: false,
                    },
                  ],
                }}
                options={{ ...chartOptions, maintainAspectRatio: false } as ChartOptions<'bar'>}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Gauge Card */}
        <div style={cardStyle}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#C51E3A', fontWeight: 700 }}>Mastery</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, marginTop: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#C51E3A' }}>{gaugeValue}%</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Average score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaks Card */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#C51E3A', fontWeight: 700 }}>Streaks</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#f9f9f9', borderRadius: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#C51E3A' }}>{streaks?.currentStreak ?? 0}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Current streak</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#f9f9f9', borderRadius: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{streaks?.longestStreak ?? 0}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Longest streak</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: '#444' }}>Keep practising daily to increase your streak and mastery — small, consistent steps win.</div>
      </div>

      {/* Line Chart Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#C51E3A', fontWeight: 700 }}>Mastery over time</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>Progress chart</div>
          </div>
        </div>

        <div style={{ height: 280, marginTop: 16 }}>
          {timeseries.length > 0 ? (
            <Line
              data={{
                labels: timeseries.map((t: any) => t.date),
                datasets: [
                  {
                    label: 'Average Mastery',
                    data: timeseries.map((t: any) => Math.round(t.value * 100)),
                    borderColor: '#C51E3A',
                    backgroundColor: 'rgba(197, 30, 58, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#C51E3A',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                ...chartOptions,
                maintainAspectRatio: false,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    ...chartOptions.plugins?.tooltip,
                    callbacks: {
                      label: (context: any) => {
                        return `${context.parsed.y}%`
                      },
                    },
                  },
                },
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales?.y,
                    min: 0,
                    max: 100,
                    ticks: {
                      ...(chartOptions.scales?.y as any)?.ticks,
                      callback: (value: any) => `${value}%`,
                    },
                  },
                },
              } as ChartOptions<'line'>}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              No mastery data yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
