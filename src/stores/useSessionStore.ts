/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import SessionService from '@/services/SessionService'
import { useStudySetupStore } from '@/stores/studySetup'
import type { SessionDTO, ToDoListResponseDTO } from '@/types'
import { getCurrentUser } from '@/services/auth'
import { useNotificationStore } from './notificationStore'

type EnrichedSession = SessionDTO & {
  courseCode: string
  courseName: string
  topicName: string | null
  assignmentName: string | null
  displayName: string
  progress: string
}

interface SessionState {
  sessions: ToDoListResponseDTO
  completedSessions: EnrichedSession[]
  enrichedSession: EnrichedSession | null
  isLoading: boolean
  error: string | null
}

// Compute urgency based on days left and remaining workload
function calculateUrgency(daysLeft: number, remainingSessions: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (daysLeft <= 2 || remainingSessions > 8) return 'HIGH'
  if (daysLeft <= 5 || remainingSessions > 4) return 'MEDIUM'
  return 'LOW'
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useSessionStore = defineStore('sessionStore', {
  state: (): SessionState => ({
    sessions: { overdue: [], today: [], tomorrow: [], upcoming: [] },
    completedSessions: [],
    enrichedSession: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    today: (state) => state.sessions.today,
    tomorrow: (state) => state.sessions.tomorrow,
    upcoming: (state) => state.sessions.upcoming,
    completed: (state) => state.completedSessions,
  },

  actions: {
    enrichSession(session: SessionDTO): EnrichedSession {
      const setupStore = useStudySetupStore()
      const course = setupStore.term?.courses?.find((c) => c.courseId === session.courseId)
      const topic = course?.topics?.find((t) => t.id === session.topicId)
      const assignment = course?.assignments?.find((a) => a.id === session.assignmentId)

      return {
        ...session,
        courseCode: course?.courseCode ?? 'N/A',
        courseName: course?.name ?? 'N/A',
        topicName: topic?.name ?? 'N/A',
        assignmentName: assignment?.name ?? 'N/A',
        progress: `${session.sessionNumber}/${session.totalSessionsInGroup}`,
        displayName: topic?.name || assignment?.name || 'Untitled',
      }
    },

    setEnrichedSession(session: any) {
      this.enrichedSession = session
    },

    async fetchSessions() {
      this.isLoading = true
      this.error = null
      try {
        // Fetch both to-do and completed in parallel
        const [todoRes, completedRes] = await Promise.all([
          SessionService.getToDoList(),
          SessionService.getCompleted(),
        ])

        const enrichList = (list: SessionDTO[] = []) => list.map(this.enrichSession)

        // Enrich to-do sessions
        const { overdue = [], today = [], tomorrow = [], upcoming = [] } = todoRes.data

        // Enrich all to-do sessions
        this.sessions = {
          overdue: enrichList(overdue),
          today: enrichList(today),
          tomorrow: enrichList(tomorrow),
          upcoming: enrichList(upcoming),
        }

        const notificationStore = useNotificationStore()

        try {
          const currentUser = await getCurrentUser()
          const currentUid = currentUser?.uid
          if (!currentUid) return

          // Flatten all sessions for easier processing
          const allSessions = [
            ...this.sessions.overdue,
            ...this.sessions.today,
            ...this.sessions.tomorrow,
            ...this.sessions.upcoming,
          ]

          // Group by course
          const courseMap: Record<number, EnrichedSession[]> = {}
          for (const s of allSessions) {
            if (!courseMap[s.courseId]) courseMap[s.courseId] = []
            courseMap[s.courseId].push(this.enrichSession(s))
          }

          const todayKey = getTodayKey()

          for (const [courseId, sessions] of Object.entries(courseMap)) {
            const remaining = sessions.filter((s) => !s.isCompleted)
            if (remaining.length === 0) continue

            // Get nearest session (acts as deadline marker)
            const nearest = remaining.reduce((soonest, curr) =>
              new Date(curr.date) < new Date(soonest.date) ? curr : soonest,
            )

            // Days until next exam or assignment deadline
            const deadline = new Date(nearest.date)
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

            const urgency = calculateUrgency(daysLeft, remaining.length)

            // Avoid multiple sends per day per course
            const notiKey = `deadlineNoti_${currentUid}_${courseId}`
            const lastSent = localStorage.getItem(notiKey)
            if (lastSent === todayKey) continue

            const title =
              urgency === 'HIGH'
                ? '🚨 Deadline Approaching Soon!'
                : urgency === 'MEDIUM'
                  ? '⚠️ Upcoming Deadline Reminder'
                  : '🕓 Stay on Track'

            const content =
              urgency === 'HIGH'
                ? `Your ${nearest.courseName} plan is at risk! Only ${daysLeft} day${
                    daysLeft !== 1 ? 's' : ''
                  } left before exam. Complete your next session today to catch up.`
                : urgency === 'MEDIUM'
                  ? `Your ${nearest.courseName} plan needs attention. About ${daysLeft} days remain. Try finishing one session today.`
                  : `You’re pacing well in ${nearest.courseName}. Keep studying to stay ahead!`

            // Send notification
            await notificationStore.sendNotification({
              userUid: currentUid,
              type: 'DEADLINE',
              title,
              content,
            })

            // Mark as sent today
            localStorage.setItem(notiKey, todayKey)
          }
        } catch (err) {
          console.warn('Deadline urgency check failed:', err)
        }

        // Enrich completed sessions
        this.completedSessions = enrichList(completedRes.data)
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err)
        this.error = err.message || 'Failed to load sessions'
        this.sessions = { overdue: [], today: [], tomorrow: [], upcoming: [] }
        this.completedSessions = []
      } finally {
        this.isLoading = false
      }
    },
  },
})
