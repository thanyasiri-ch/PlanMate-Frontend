/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import SessionService from '@/services/SessionService'
import { useStudySetupStore } from '@/stores/studySetup'
import type { SessionDTO, ToDoListResponseDTO } from '@/types'

interface SessionState {
  sessions: ToDoListResponseDTO
  enrichedSession: any | null
  isLoading: boolean
  error: string | null
}

export const useSessionStore = defineStore('sessionStore', {
  state: (): SessionState => ({
    sessions: { today: [], tomorrow: [], upcoming: [] },
    enrichedSession: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    today: (state) => state.sessions.today,
    tomorrow: (state) => state.sessions.tomorrow,
    upcoming: (state) => state.sessions.upcoming,
  },

  actions: {
    enrichSession(session: SessionDTO) {
      const setupStore = useStudySetupStore()
      const course = setupStore.term?.courses?.find(c => c.courseId === session.courseId)
      const topic = course?.topics?.find(t => t.id === session.topicId)
      const assignment = course?.assignments?.find(a => a.id === session.assignmentId)

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
        const res = await SessionService.getToDoList()
        const enrichList = (list: SessionDTO[] = []) => list.map(this.enrichSession)

        this.sessions = {
          today: enrichList(res.data.today),
          tomorrow: enrichList(res.data.tomorrow),
          upcoming: enrichList(res.data.upcoming),
        }
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err)
        this.error = err.message || 'Failed to load sessions'
        this.sessions = { today: [], tomorrow: [], upcoming: [] }
      } finally {
        this.isLoading = false
      }
    },
  },
})
