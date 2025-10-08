import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { notificationService } from '@/services/NotificationService'
import { app } from './firebase'

const messaging = getMessaging(app)

export async function registerFcmToken() {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'BMvkD_DKSa905WnkdUGJ0nv1ojW3iI5Q-XA4GLpv6t3J1WObcH1rgPimrPu17ZQjJ-YXgNOgRZTeecDNAjNBqkA',
    })
    if (token) {
      console.log('FCM Token:', token)
      await notificationService.saveToken(token)
    } else {
      console.warn('No registration token available.')
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
  }
}

onMessage(messaging, (payload) => {
  console.log('Notification received in foreground:', payload)
})
