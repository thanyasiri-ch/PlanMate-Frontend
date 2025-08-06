/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import FocusSessionService from '@/services/FocusSessionService'
import { useStudySetupStore } from '@/stores/studySetup'
import type { SessionDTO, FocusSession, ToDoListResponseDTO } from '@/types'

interface FocusSessionState {
  sessions: ToDoListResponseDTO
  focusSession: FocusSession | null
  isLoading: boolean
  error: string | null
}

export const useFocusSessionStore = defineStore('focusSession', {
  state: (): FocusSessionState => ({
    sessions: {
      today: [],
      tomorrow: [],
      upcoming: [],
    },
    focusSession: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    todaySessions: (state) => state.sessions,
  },

  actions: {
    enrichSession(session: SessionDTO) {
      const setupStore = useStudySetupStore()
      const course = setupStore.term?.courses?.find((c) => c.courseId === session.courseId)
      const topic = course?.topics?.find((t) => t.id === session.topicId)
      const assignment = course?.assignments?.find((a) => a.id === session.assignmentId)

      return {
        ...session,
        courseCode: course?.courseCode || 'N/A',
        courseName: course?.name || 'N/A',
        topicName: topic?.name || null,
        assignmentName: assignment?.name || null,
        progress: `${session.sessionNumber}/${session.totalSessionsInGroup}`,
        displayName: topic?.name || assignment?.name || 'Untitled',
      }
    },

    async fetchSessions() {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.getToDoList()

        const enrichList = (list: SessionDTO[] = []) => list.map(this.enrichSession)

        this.sessions = {
          today: enrichList(res.data.today),
          tomorrow: enrichList(res.data.tomorrow),
          upcoming: enrichList(res.data.upcoming),
        }
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err)
        this.error = err.message || 'Failed to load sessions'
        this.sessions = {
          today: [],
          tomorrow: [],
          upcoming: [],
        }
      } finally {
        this.isLoading = false
      }
    },

    async startSession(sessionId: string) {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.startSession({ sessionId })
        this.focusSession = res.data
        return res.data
      } catch (err: any) {
        console.error('Failed to start focus session:', err)
        this.error = err.message || 'Failed to start session'
        return null
      } finally {
        this.isLoading = false
      }
    },

    clearFocusSession() {
      this.focusSession = null
    },
  },
})
