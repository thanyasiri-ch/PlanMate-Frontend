/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { scheduleService } from '@/services/ScheduleService'
import type { ScheduleDTO } from '@/types'

export const useGeneratedPlanStore = defineStore('generatedPlan', {
  state: () => ({
    schedule: null as ScheduleDTO | null,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchExistingSchedule() {
      this.isLoading = true
      this.error = null
      try {
        const response = await scheduleService.getSchedule()
        this.schedule = response.data
      } catch (err: any) {
        // A 404 error is expected if no schedule exists, so we don't treat it as a failure.
        if (err.response && err.response.status !== 404) {
          this.error = 'Failed to load your existing schedule.'
          console.error(err)
        } else {
          // If it's a 404, it just means no plan exists. Clear the state.
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
      } catch (err) {
        this.error = 'Failed to generate a study plan. Please try again.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async acceptAndSavePlan() {
      if (!this.schedule) return

      this.isLoading = true
      try {
        await scheduleService.saveSchedule(this.schedule)
        this.clearPlan()
      } catch (err) {
        this.error = 'Failed to save the plan.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    clearPlan() {
      this.$reset()
    },
  },
})
