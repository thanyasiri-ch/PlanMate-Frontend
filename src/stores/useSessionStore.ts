/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import SessionService from '@/services/SessionService'
import { useStudySetupStore } from '@/stores/studySetup'
import type { SessionDTO, ToDoListResponseDTO } from '@/types'

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

export const useSessionStore = defineStore('sessionStore', {
  state: (): SessionState => ({
    sessions: { today: [], tomorrow: [], upcoming: [] },
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
        topicName: topic?.name ?? null,
        assignmentName: assignment?.name ?? null,
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
        this.sessions = {
          today: enrichList(todoRes.data.today),
          tomorrow: enrichList(todoRes.data.tomorrow),
          upcoming: enrichList(todoRes.data.upcoming),
        }

        // Enrich completed sessions
        this.completedSessions = enrichList(completedRes.data)
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err)
        this.error = err.message || 'Failed to load sessions'
        this.sessions = { today: [], tomorrow: [], upcoming: [] }
        this.completedSessions = []
      } finally {
        this.isLoading = false
      }
    },
  },
})
