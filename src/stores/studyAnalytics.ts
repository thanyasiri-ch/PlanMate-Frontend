/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/studyAnalytics.ts
import { defineStore } from 'pinia'
import type { StudyAnalyticsDTO } from '@/types'
import StudyAnalyticsService from '@/services/StudyAnalyticsService'
import { formatSeconds } from '@/utils/time'

interface StudyAnalyticsState {
  analytics: StudyAnalyticsDTO | null
  isLoading: boolean
  error: string | null
  currentRange: string
  currentDate: Date
  subjectColorMap: Record<string, string>
}

const availableColors = [
  'bg-orange-400',
  'bg-yellow-400',
  'bg-emerald-400',
  'bg-blue-400',
  'bg-pink-400',
  'bg-red-400',
  'bg-purple-400',
  'bg-teal-400',
]

export function getColorFromClass(colorClass: string): string {
  const colorMap: Record<string, string> = {
    'bg-orange-400': '#ff9f40',
    'bg-yellow-400': '#ffee58',
    'bg-emerald-400': '#66bb6a',
    'bg-blue-400': '#42a5f5',
    'bg-pink-400': '#ec4899',
    'bg-red-400': '#f87171',
    'bg-purple-400': '#a78bfa',
    'bg-teal-400': '#2dd4bf',
  }
  return colorMap[colorClass] || '#ccc'
}

// helper
function getSubjectColor(subject: string, map: Record<string, string>): string {
  if (!map[subject]) {
    // Try to find an unused color first
    const usedColors = new Set(Object.values(map))
    const unusedColors = availableColors.filter((c) => !usedColors.has(c))

    const colorPool = unusedColors.length > 0 ? unusedColors : availableColors
    const randomIndex = Math.floor(Math.random() * colorPool.length)

    map[subject] = colorPool[randomIndex]
    localStorage.setItem('subjectColorMap', JSON.stringify(map))
  }
  return map[subject]
}

export const useStudyAnalyticsStore = defineStore('studyAnalytics', {
  state: (): StudyAnalyticsState => ({
    analytics: null,
    isLoading: false,
    error: null,
    currentRange: 'MONTH',
    currentDate: new Date(),
    subjectColorMap: JSON.parse(localStorage.getItem('subjectColorMap') || '{}'),
  }),

  getters: {
    hasAnalytics: (state) => !!state.analytics,

    totalCompletedFocusSessions: (state) =>
      state.analytics ? state.analytics.totalCompletedFocusSessions : 0,

    totalFocusDuration: (state) => {
      if (!state.analytics) return '0 hrs 0 mins'
      const totalMinutes = Math.floor(state.analytics.totalFocusDuration / 60)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours} hrs ${minutes} mins`
    },

    barChartData: (state) => {
      if (!state.analytics?.focusSessions) return []

      const now = new Date(state.currentDate || new Date())
      const labels: { date: string; label: string }[] = []
      const range = state.currentRange.toLowerCase()

      // Timezone-safe function to generate 'YYYY-MM-DD' keys from a local Date object
      const normalizeKey = (date: Date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // ---------- DAY VIEW ----------
      if (range === 'day') {
        const targetDateKey = normalizeKey(now)

        // Initialize 24 hour slots
        const hours = Array.from({ length: 24 }, (_, h) => ({
          date: `${targetDateKey}_${h}`,
          label: h.toString(),
          minutes: 0,
        }))

        // Filter sessions that belong to this day
        state.analytics.focusSessions
          .filter((s) => s.focusStart.startsWith(targetDateKey))
          .forEach((session) => {
            const start = new Date(session.focusStart)
            const end = new Date(session.focusEnd)

            let cursor = new Date(start)
            while (cursor < end) {
              const hourIndex = cursor.getHours()
              const endOfHour = new Date(cursor)
              endOfHour.setMinutes(59, 59, 999)

              const chunkEnd = end < endOfHour ? end : endOfHour
              const minutesInThisHour = Math.round((chunkEnd.getTime() - cursor.getTime()) / 60000)

              hours[hourIndex].minutes += minutesInThisHour

              cursor = new Date(endOfHour.getTime() + 1)
            }
          })

        const maxMinutes = Math.max(...hours.map((h) => h.minutes), 1)

        return hours.map((h) => ({
          ...h,
          heightPercent: Math.round((h.minutes / maxMinutes) * 100),
        }))
      }

      // ---------- WEEK VIEW ----------
      if (range === 'week') {
        const start = new Date(now)
        const day = start.getDay() || 7
        start.setDate(start.getDate() - (day - 1)) // Monday as first day

        for (let i = 0; i < 7; i++) {
          const d = new Date(start)
          d.setDate(start.getDate() + i)
          labels.push({
            date: normalizeKey(d),
            label: d.toLocaleString('default', { weekday: 'short' }),
          })
        }
      }

      // ---------- MONTH VIEW ----------
      if (range === 'month') {
        const year = now.getFullYear()
        const month = now.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        for (let i = 1; i <= daysInMonth; i++) {
          const d = new Date(year, month, i)
          labels.push({
            date: normalizeKey(d),
            label: i.toString(),
          })
        }
      }

      // ---------- YEAR VIEW ----------
      if (range === 'year') {
        for (let m = 0; m < 12; m++) {
          const d = new Date(now.getFullYear(), m, 1)
          labels.push({
            date: normalizeKey(d).slice(0, 7), // 'YYYY-MM'
            label: d.toLocaleString('default', { month: 'short' }),
          })
        }
      }

      // ---------- Aggregate Sessions ----------
      const dataMap: Record<string, number> = {}
      state.analytics.focusSessions.forEach((session) => {
        if (range === 'day') {
          // daily totals are already handled in the day view
          return
        }

        // Split multi-day sessions (if any)
        let current = new Date(session.focusStart)
        const end = new Date(session.focusEnd)

        while (current <= end) {
          const key = normalizeKey(current)
          const nextDay = new Date(current)
          nextDay.setDate(current.getDate() + 1)
          nextDay.setHours(0, 0, 0, 0)

          const chunkEnd = end < nextDay ? end : nextDay
          const minutes = Math.round((chunkEnd.getTime() - current.getTime()) / 60000)

          dataMap[key] = (dataMap[key] || 0) + minutes

          current = new Date(nextDay)
        }
      })

      // Map labels to their corresponding data from the dataMap
      const entries = labels.map((l) => {
        let minutes = 0
        if (range === 'year') {
          // For 'year' view, sum up all daily totals for the month
          minutes = Object.entries(dataMap)
            .filter(([dateKey]) => dateKey.startsWith(l.date))
            .reduce((sum, [, value]) => sum + value, 0)
        } else {
          minutes = dataMap[l.date] || 0
        }
        return { date: l.date, label: l.label, minutes }
      })

      const maxMinutes = Math.max(...entries.map((e) => e.minutes), 1)
      return entries.map((e) => ({
        ...e,
        heightPercent: Math.round((e.minutes / maxMinutes) * 100),
      }))
    },

    pieChartData: (state) => {
      if (!state.analytics) return []
      const total = state.analytics.totalFocusDuration
      if (!total) return []

      return Object.entries(state.analytics.subjectBreakdown).map(
        ([subject, durationInMinutes]) => {
          const colorClass = getSubjectColor(subject, state.subjectColorMap)
          return {
            label: subject,
            value: Math.round((Number(durationInMinutes) / total) * 100),
            time: formatSeconds(Number(durationInMinutes)),
            colorClass,
          }
        },
      )
    },
  },

  actions: {
    async fetchAnalytics(range: string, date: Date) {
      this.isLoading = true
      this.error = null
      this.currentRange = range
      this.currentDate = date
      try {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const localDateString = `${year}-${month}-${day}`

        const { data } = await StudyAnalyticsService.getAnalytics(
          range.toUpperCase(),
          localDateString,
        )
        this.analytics = data
      } catch (err: any) {
        console.error('Failed to fetch study analytics:', err)
        this.error = err.message || 'Failed to load analytics.'
        this.analytics = null
      } finally {
        this.isLoading = false
      }
    },

    clearAnalytics() {
      this.analytics = null
      this.error = null
    },
  },
})
