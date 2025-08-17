/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { FocusStatus, type FocusSessionDTO } from '@/types'
import FocusSessionService from '@/services/FocusSessionService'

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
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch active focus session.'
      } finally {
        this.isLoading = false
      }
    },

    async startFocusSession(sessionId: string) {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.startSession(sessionId)
        this.activeSession = res.data
      } catch (err: any) {
        this.error = err.message || 'Failed to start focus session.'
      } finally {
        this.isLoading = false
      }
    },

    async pauseFocusSession(sessionId: string) {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.pauseSession(sessionId)
        this.activeSession = res.data
      } catch (err: any) {
        this.error = err.message || 'Failed to pause session.'
      } finally {
        this.isLoading = false
      }
    },

    async resumeFocusSession(sessionId: string) {
      this.isLoading = true
      this.error = null
      try {
        const res = await FocusSessionService.resumeSession(sessionId)
        this.activeSession = res.data
      } catch (err: any) {
        this.error = err.message || 'Failed to resume session.'
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
