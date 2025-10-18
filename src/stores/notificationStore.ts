/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationService } from '@/services/NotificationService'
import type { Notification, NotificationRequest } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length)
  const markingAll = ref(false)

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

  async function sendNotification(request: NotificationRequest) {
    try {
      await notificationService.sendNotification(request)
      fetchNotifications()
    } catch (err: any) {
      console.error('Error sending notification', err)
      error.value = 'Failed to send notification'
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

  async function markAllAsRead() {
    if (markingAll.value) return
    markingAll.value = true

    const unread = notifications.value.filter((n) => !n.isRead)
    if (unread.length === 0) return

    unread.forEach((n) => (n.isRead = true))
    try {
      await Promise.all(unread.map((n) => notificationService.markAsRead(n.id)))
    } finally {
      markingAll.value = false
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markingAll,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification,
  }
})
