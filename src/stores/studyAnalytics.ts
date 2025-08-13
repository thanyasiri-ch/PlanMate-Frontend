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
}

export const useStudyAnalyticsStore = defineStore('studyAnalytics', {
  state: (): StudyAnalyticsState => ({
    analytics: null,
    isLoading: false,
    error: null,
    currentRange: 'MONTH',
    currentDate: new Date(),
  }),

  getters: {
    hasAnalytics: (state) => !!state.analytics,

    totalCompletedFocusSessions: (state) =>
      state.analytics ? state.analytics.totalCompletedFocusSessions : 0,

    totalFocusDuration: (state) => {
      if (!state.analytics) return '0 hrs 0 mins'
      const totalMinutes = state.analytics.totalFocusDuration
      const hours = Math.floor(totalMinutes / 60)
      const minutes = Math.floor(totalMinutes % 60)
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

      // Generate labels for the selected time range
      if (range === 'day') {
        const targetDateKey = normalizeKey(now)

        const hours = Array.from({ length: 24 }, (_, h) => ({
          date: `${targetDateKey}_${h}`,
          label: h.toString(),
          minutes: 0,
        }))

        state.analytics.focusSessions
          .filter((s) => s.focusStart.startsWith(targetDateKey))
          .forEach((session) => {
            const start = new Date(session.focusStart)
            const end = new Date(start.getTime() + session.elapsed * 60 * 1000)

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
      } else if (range === 'week') {
        // 7 days starting from Monday
        const start = new Date(now)
        const day = start.getDay() || 7
        start.setDate(start.getDate() - (day - 1))
        for (let i = 0; i < 7; i++) {
          const d = new Date(start)
          d.setDate(start.getDate() + i)
          labels.push({
            date: normalizeKey(d),
            label: d.toLocaleString('default', { weekday: 'short' }),
          })
        }
      } else if (range === 'month') {
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
      } else if (range === 'year') {
        for (let m = 0; m < 12; m++) {
          const d = new Date(now.getFullYear(), m, 1)
          labels.push({
            date: normalizeKey(d).slice(0, 7), // Key is 'YYYY-MM'
            label: d.toLocaleString('default', { month: 'short' }),
          })
        }
      }

      // Aggregate session data into a map with daily keys ('YYYY-MM-DD')
      const dataMap: Record<string, number> = {}
      state.analytics.focusSessions.forEach((session) => {
        const sessionDate = session.focusStart.split('T')[0]
        const minutes = Math.round(session.elapsed)
        dataMap[sessionDate] = (dataMap[sessionDate] || 0) + minutes
      })

      // Map labels to their corresponding data from the dataMap
      const entries = labels.map((l) => {
        let minutes = 0
        if (range === 'year') {
          // For 'year' view, sum up all daily totals for the month
          minutes = Object.entries(dataMap)
            .filter(([dateKey]) => dateKey.startsWith(l.date))
            .reduce((sum, [, value]) => sum + value, 0)
        } else if (range === 'day') {
          // For 'day' view, get the total for that specific day
          minutes = dataMap[l.date.split('_')[0]] || 0
        } else {
          // For 'week' and 'month' view, find the exact date match
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
      // Ensure total is not zero to avoid division by zero errors
      if (!total) return []

      const colors = ['bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-blue-400']
      return Object.entries(state.analytics.subjectBreakdown).map(
        ([subject, durationInMinutes], idx) => ({
          label: subject,
          value: Math.round((Number(durationInMinutes) / total) * 100),
          time: formatSeconds(Number(durationInMinutes) * 60),
          colorClass: colors[idx % colors.length],
        }),
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
