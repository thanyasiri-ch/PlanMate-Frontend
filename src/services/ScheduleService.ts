import apiClient from './AxiosClient'
import type { ScheduleDTO } from '@/types'

export const scheduleService = {
  getSchedule: () => {
    return apiClient.get<ScheduleDTO>('/schedule')
  },

  generateSchedule: () => {
    return apiClient.post<ScheduleDTO>('/schedule/generate')
  },

  saveSchedule: (scheduleData: ScheduleDTO) => {
    return apiClient.post('/schedule', scheduleData)
  },

  updateSchedule: (scheduleData: ScheduleDTO) => {
    return apiClient.put('/schedule', scheduleData)
  }
}
