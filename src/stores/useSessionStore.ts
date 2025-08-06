import { defineStore } from 'pinia'
import type { FocusSession, StartFocusSessionDTO } from '@/types'
import SessionService from '@/services/SessionService.ts'

interface SessionState {
  activeSession: FocusSession | null
  isLoading: boolean
  error: string | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    activeSession: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isFocusing: (state) => state.activeSession?.status === 'FOCUSING',
    elapsedSeconds: (state) => state.activeSession?.elapsedSeconds ?? 0,
    sessionType: (state) => state.activeSession?.session.type ?? null,
  },

  actions: {
    async startFocusSession(payload: StartFocusSessionDTO) {
      this.isLoading = true
      this.error = null
      try {
        const response = await SessionService.startFocus(payload)
        this.activeSession = response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to start focus session.'
      } finally {
        this.isLoading = false
      }
    },

    async stopFocusSession(sessionId: string) {
      this.isLoading = true
      this.error = null
      try {
        const response = await SessionService.stopFocus(sessionId)
        this.activeSession = response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to stop focus session.'
      } finally {
        this.isLoading = false
      }
    },

    clearSession() {
      this.activeSession = null
      this.error = null
    },
  },
})
