import apiClient from './AxiosClient'
import type { NotificationRequest } from '@/types'

export const notificationService = {
  getNotifications: () => {
    return apiClient.get('/notification')
  },

  saveToken: (token: string) => {
    return apiClient.post('/notification/token', { token })
  },

  sendNotification: (request: NotificationRequest) => {
    return apiClient.post('/notification/send', request)
  },

  markAsRead: (id: number) => {
    return apiClient.patch(`/notification/${id}/read`)
  },
}
