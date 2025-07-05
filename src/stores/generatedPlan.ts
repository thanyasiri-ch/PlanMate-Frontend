/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { scheduleService } from '@/services/ScheduleService'
import type { ScheduleDTO } from '@/types'

// Helper function to calculate a session's end time based on its start and duration
function calculateEndTime(startTime: string, durationInMinutes: number): string {
  if (!startTime) return ''
  const [hours, minutes] = startTime.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  const newDate = new Date(date.getTime() + durationInMinutes * 60000)

  const endHours = newDate.getHours().toString().padStart(2, '0')
  const endMinutes = newDate.getMinutes().toString().padStart(2, '0')

  return `${endHours}:${endMinutes}`
}

export const useGeneratedPlanStore = defineStore('generatedPlan', {
  state: () => ({
    schedule: null as ScheduleDTO | null,
    isLoading: false,
    error: null as string | null,
    isPlanDirty: false,
    isNewPlan: false,
  }),

  actions: {
    /**
     * Fetches the existing schedule from the server, but only if it's not already in the store.
     */
    async fetchExistingSchedule() {
      // --- FIX: Added this block to prevent re-fetching ---
      if (this.schedule) {
        console.log('Using cached schedule from planStore. Skipping fetch.')
        return // Exit if the schedule is already loaded
      }
      // ---------------------------------------------------

      this.isLoading = true
      this.error = null
      try {
        const response = await scheduleService.getSchedule()
        this.schedule = response.data
        this.isPlanDirty = false
        this.isNewPlan = false
      } catch (err: any) {
        if (err.response && err.response.status !== 404) {
          this.error = 'Failed to load your existing schedule.'
          console.error(err)
        } else {
          this.schedule = null
        }
      } finally {
        this.isLoading = false
      }
    },

    async generatePlan() {
      this.isLoading = true
      this.error = null
      this.schedule = null
      try {
        const response = await scheduleService.generateSchedule()
        this.schedule = response.data
        this.isPlanDirty = true
        this.isNewPlan = true
      } catch (err) {
        this.error = 'Failed to generate a study plan. Please try again.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    updateSessionTime(payload: { sessionId: string; date: string; start: string }) {
      if (!this.schedule) return
      const session = this.schedule.study_plan.find((s) => s.sessionId === payload.sessionId)
      if (session) {
        session.date = payload.date
        session.start = payload.start
        session.end = calculateEndTime(payload.start, session.duration)
        this.isPlanDirty = true
      }
    },

    unscheduleSession(payload: { sessionId: string }) {
      if (!this.schedule) return
      const index = this.schedule.study_plan.findIndex((s) => s.sessionId === payload.sessionId)
      if (index > -1) {
        const [session] = this.schedule.study_plan.splice(index, 1)
        session.isScheduled = false
        this.schedule.unscheduled_plan.push(session)
        this.isPlanDirty = true
      }
    },

    scheduleItemManually(payload: { sessionId: string; date: string; start: string }) {
      if (!this.schedule) return
      const index = this.schedule.unscheduled_plan.findIndex(
        (i) => i.sessionId === payload.sessionId,
      )
      if (index > -1) {
        const [itemToSchedule] = this.schedule.unscheduled_plan.splice(index, 1)
        itemToSchedule.date = payload.date
        itemToSchedule.start = payload.start
        itemToSchedule.end = calculateEndTime(payload.start, itemToSchedule.duration)
        itemToSchedule.isScheduled = true
        this.schedule.study_plan.push(itemToSchedule)
        this.isPlanDirty = true
      }
    },

    async acceptAndSavePlan() {
      if (!this.schedule) return
      this.isLoading = true
      this.error = null
      try {
        await scheduleService.saveSchedule(this.schedule)
        this.isPlanDirty = false
        this.isNewPlan = false
        this.schedule = null // Clear schedule to force a refetch on next load
      } catch (err) {
        this.error = 'Failed to save the plan.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async updateSchedule() {
      if (!this.schedule) return
      this.isLoading = true
      this.error = null
      try {
        await scheduleService.updateSchedule(this.schedule)
        this.isPlanDirty = false
      } catch (err) {
        this.error = 'Failed to update the plan.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    clearPlan() {
      this.schedule = null // Set schedule to null to force a refetch
      this.fetchExistingSchedule()
    },
  },
})
