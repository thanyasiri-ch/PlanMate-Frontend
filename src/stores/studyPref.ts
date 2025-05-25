/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import type { StudyPreference } from '@/types' // Assuming your types are in @/types
import StudyPrefService from '@/services/StudyPrefServices' // Your existing service

interface StudyPreferencesState {
  preferences: StudyPreference | null
  isLoading: boolean
  error: string | null
}

export const useStudyPreferencesStore = defineStore('studyPreferences', {
  state: (): StudyPreferencesState => ({
    preferences: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    hasPreferences: (state) => !!state.preferences,
    // You could add more specific getters if needed
    preferredTimes: (state) => state.preferences?.preferredStudyTimes || [],
    sessionDurationRange: (state) => ({
      min: state.preferences?.minSessionDuration,
      max: state.preferences?.maxSessionDuration,
    }),
  },

  actions: {
    async fetchPreferences() {
      if (this.preferences) return // Already fetched

      this.isLoading = true
      this.error = null
      try {
        const response = await StudyPrefService.getPref()
        this.preferences = response.data || null
      } catch (err: any) {
        console.error('Failed to fetch study preferences:', err)
        this.error = err.message || 'Failed to load preferences.'
        this.preferences = null
      } finally {
        this.isLoading = false
      }
    },

    async saveOrUpdatePreferences(newPreferences: StudyPreference) {
      this.isLoading = true
      this.error = null
      try {
        let response
        if (this.preferences) {
          response = await StudyPrefService.updatePref(newPreferences)
        } else {
          response = await StudyPrefService.savePref(newPreferences)
        }
        this.preferences = response.data
        return true
      } catch (err: any) {
        console.error('Failed to save study preferences:', err)
        this.error = err.message || 'Failed to save preferences.'
        return false // Indicate failure
      } finally {
        this.isLoading = false
      }
    },

    // Optional: Action to clear preferences (e.g., on logout)
    clearPreferences() {
      this.preferences = null
      this.error = null
    },
  },
})
