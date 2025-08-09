/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { FocusStatus, type FocusSessionDTO, type StartFocusSessionDTO } from '@/types'
import FocusSessionService from '@/services/FocusSessionService'
import { useStudySetupStore } from '@/stores/studySetup'

interface FocusSessionState {
  activeSession: FocusSessionDTO | null
  enrichedFocusSession: any | null
  isLoading: boolean
  error: string | null
}

export const useFocusSessionStore = defineStore('focusSessionStore', {
  state: (): FocusSessionState => ({
    activeSession: null,
    enrichedFocusSession: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isFocusing: (state) => state.activeSession?.status === FocusStatus.FOCUSING,
    elapsedSeconds: (state) => state.activeSession?.elapsedSeconds ?? 0,
    sessionType: (state) => state.activeSession?.session?.type ?? null,
  },

  actions: {
    enrichFocusSession(focus: FocusSessionDTO) {
      const setupStore = useStudySetupStore()
      const course = setupStore.term?.courses?.find(c => c.courseId === focus.courseId)
      const topic = course?.topics?.find(t => t.id === focus.topicId)
      const assignment = course?.assignments?.find(a => a.id === focus.session.assignmentId)

      return {
        ...focus,
        courseCode: course?.courseCode ?? 'N/A',
        courseName: course?.name ?? 'N/A',
        topicName: topic?.name ?? null,
        assignmentName: assignment?.name ?? null,
        displayName: topic?.name || assignment?.name || 'Untitled',
      }
    },

    async fetchActiveFocusSession() {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.fetchActiveSession()
        if (res.status === 204) {
          this.activeSession = null
          this.enrichedFocusSession = null
        } else {
          this.activeSession = res.data
          this.enrichedFocusSession = this.enrichFocusSession(res.data)
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch active focus session.'
      } finally {
        this.isLoading = false
      }
    },

    async startFocusSession(payload: StartFocusSessionDTO) {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.startSession(payload)
        this.activeSession = res.data
        this.enrichedFocusSession = this.enrichFocusSession(res.data)
      } catch (err: any) {
        this.error = err.message || 'Failed to start focus session.'
      } finally {
        this.isLoading = false
      }
    },

    async endFocusSession() {
      if (!this.activeSession?.id) {
        this.error = 'No active session to end.'
        return
      }

      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.endSession(this.activeSession.id)
        this.activeSession = res.data
        this.enrichedFocusSession = this.enrichFocusSession(res.data)
      } catch (err: any) {
        this.error = err.message || 'Failed to stop focus session.'
      } finally {
        this.isLoading = false
      }
    },

    clearSession() {
      this.activeSession = null
      this.enrichedFocusSession = null
      this.error = null
    },
  },
})
