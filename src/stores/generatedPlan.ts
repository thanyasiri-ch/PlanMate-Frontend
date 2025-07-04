/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { scheduleService } from '@/services/ScheduleService'
import type { ScheduleDTO } from '@/types'

// Helper function to calculate a session's end time based on its start and duration
function calculateEndTime(startTime: string, durationInMinutes: number): string {
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
    // --- Existing actions (fetch, generate) remain the same ---
    async fetchExistingSchedule() {
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
      this.schedule = null // Clear previous plan
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

    /**
     * NEW: Updates the date and time of an existing scheduled session.
     */
    updateSessionTime(payload: { sessionId: string; date: string; start: string }) {
      if (!this.schedule) return

      const session = this.schedule.study_plan.find((s) => s.sessionId === payload.sessionId)

      if (session) {
        session.date = payload.date
        session.start = payload.start
        session.end = calculateEndTime(payload.start, session.duration) // Recalculate end
        this.isPlanDirty = true // Mark plan as modified
      } else {
        console.error('Session not found for update:', payload.sessionId)
      }
    },

    /**
     * NEW: Moves a session from the scheduled plan to the unscheduled list.
     */
    unscheduleSession(payload: { sessionId: string }) {
      if (!this.schedule) return

      const index = this.schedule.study_plan.findIndex((s) => s.sessionId === payload.sessionId)

      if (index > -1) {
        // Remove from study_plan
        const [session] = this.schedule.study_plan.splice(index, 1)

        // Update status and add to unscheduled_plan
        session.isScheduled = false
        this.schedule.unscheduled_plan.push(session)
        this.isPlanDirty = true // Mark plan as modified
      } else {
        console.error('Session not found for unscheduling:', payload.sessionId)
      }
    },

    /**
     * MODIFIED: Moves an unscheduled item to the scheduled plan with new details.
     */
    scheduleItemManually(payload: { sessionId: string; date: string; start: string }) {
      if (!this.schedule) return

      const index = this.schedule.unscheduled_plan.findIndex(
        (i) => i.sessionId === payload.sessionId,
      )

      if (index > -1) {
        // Remove from unscheduled_plan
        const [itemToSchedule] = this.schedule.unscheduled_plan.splice(index, 1)

        // Update properties and status
        itemToSchedule.date = payload.date
        itemToSchedule.start = payload.start
        itemToSchedule.end = calculateEndTime(payload.start, itemToSchedule.duration)
        itemToSchedule.isScheduled = true

        // Add to the main study plan
        this.schedule.study_plan.push(itemToSchedule)
        this.isPlanDirty = true // Mark plan as modified
      } else {
        console.error('Could not find the item to schedule manually.')
      }
    },

    async acceptAndSavePlan() {
      if (!this.schedule) return

      this.isLoading = true
      try {
        await scheduleService.saveSchedule(this.schedule)
        this.isPlanDirty = false
        this.isNewPlan = false 
        this.clearPlan()
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
      try {
        // Assume you have an updateSchedule method in your service
        await scheduleService.updateSchedule(this.schedule)
        this.isPlanDirty = false // Reset dirty flag after successful save
        // No need to set isNewPlan, it's already false
      } catch (err) {
        this.error = 'Failed to update the plan.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    clearPlan() {
      this.$reset()
      this.fetchExistingSchedule()
    },
  },
})
