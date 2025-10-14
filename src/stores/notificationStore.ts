/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationService } from '@/services/NotificationService'
import type { Notification } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length)

  async function fetchNotifications() {
    loading.value = true
    try {
      const res = await notificationService.getNotifications()
      notifications.value = res.data.sort(
        (a: Notification, b: Notification) =>
          new Date(b.time).getTime() - new Date(a.time).getTime(),
      )
      error.value = null
    } catch (err: any) {
      console.error('Error fetching notifications', err)
      error.value = 'Failed to load notifications'
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: number) {
    try {
      await notificationService.markAsRead(id)

      // update local state
      const target = notifications.value.find((n) => n.id === id)
      if (target) target.isRead = true
    } catch (err: any) {
      console.error('Error marking notification as read', err)
      error.value = 'Failed to mark as read'
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  }
})
