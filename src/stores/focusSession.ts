/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { db } from '@/firebase/firebase'
import { ref as dbRef, get } from 'firebase/database'
import { FocusStatus, SessionType, type FocusSessionDTO } from '@/types'
import FocusSessionService from '@/services/FocusSessionService'
import { getCurrentUser } from '@/services/auth'
import { notificationService } from '@/services/NotificationService'

interface FocusSessionState {
  activeSession: FocusSessionDTO | null
  enrichedFocusSession: any | null
  isLoading: boolean
  error: string | null
}

export const SessionTypeLabel: Record<SessionType, string> = {
  [SessionType.FINAL_REVIEW]: 'Final Review',
  [SessionType.OVERVIEW]: 'Overview',
  [SessionType.CORE_STUDY]: 'Core Study',
  [SessionType.ASSIGNMENT]: 'Assignment',
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
        // 1. Handle the error by setting the state in the store
        if (err.response && err.response.data) {
          this.error =
            typeof err.response.data === 'string'
              ? err.response.data
              : err.response.data.message || 'Failed to start focus session.'
        } else {
          this.error = err.message || 'Failed to start focus session.'
        }

        // 2. Re-throw the error so the calling function can catch it
        throw err
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
        // End the session
        const res = await FocusSessionService.endSession(this.activeSession.id)
        this.activeSession = res.data

        // Detect shared room from Firebase for current user
        const currentUserId = (await getCurrentUser())?.uid
        const userRef = dbRef(db, `activeUsers/${currentUserId}`)
        const snapshot = await get(userRef)
        const userData = snapshot.val()

        if (userData?.inSharedRoom && userData?.sharedRoomId) {
          const roomId = userData.sharedRoomId
          try {
            await FocusSessionService.leaveSharedRoom(roomId)
          } catch (leaveErr: any) {
            console.warn('Failed to leave shared room:', leaveErr.message)
          }
        }

        const elapsedSeconds = this.activeSession?.elapsedSeconds ?? 0
        if (elapsedSeconds > 300) {
          const taskName = this.activeSession?.displayName
          const taskType = this.activeSession?.sessionType
          const readableType = taskType ? SessionTypeLabel[taskType] : 'Unknown Type'

          await notificationService.sendNotification({
            userUid: currentUserId || '',
            type: 'GENERAL',
            title: 'Focus Session Complete!',
            content: `Nice work — your ${readableType} "${taskName}" just ended.`,
          })
        }
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
