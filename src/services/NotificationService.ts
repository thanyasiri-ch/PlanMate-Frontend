import apiClient from './AxiosClient'
import type { Notification } from '@/types'

export const notificationService = {
  saveToken: (token: string) => {
    return apiClient.post('/notification/token', { token })
  },

  sendNotification: (request: Notification) => {
    return apiClient.post('/notification/send', request)
  },
}
