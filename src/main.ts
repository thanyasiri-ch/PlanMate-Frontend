import './assets/main.css'
import 'nprogress/nprogress.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

import '@/services/AxiosInterceptorSetup'
import { auth } from '@/firebase/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from '@/stores/auth'
import { formatUser } from '@/services/auth'

import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { app as firebaseApp } from '@/firebase/firebase'
import { notificationService } from '@/services/NotificationService'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

const authStore = useAuthStore()
authStore.checkAuthStatus()

onAuthStateChanged(auth, async (user) => {
  if (user && !authStore.isLoggedIn) {
    const idToken = await user.getIdToken()
    const appUser = formatUser(user)
    authStore.setAuth(appUser, idToken)
  } else if (!user) {
    authStore.logout()
  }
})

app.use(router)
app.mount('#app')

// ------------------ FCM setup ------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(async (registration) => {
      console.log('Service Worker registered:', registration)

      const messaging = getMessaging(firebaseApp)

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey:
          'BMvkD_DKSa905WnkdUGJ0nv1ojW3iI5Q-XA4GLpv6t3J1WObcH1rgPimrPu17ZQjJ-YXgNOgRZTeecDNAjNBqkA',
        serviceWorkerRegistration: registration,
      })
      console.log('🔹 Web FCM token:', token)
      await notificationService.saveToken(token)

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground notification:', payload)

        const title = payload.data?.title || payload.notification?.title
        const body = payload.data?.body || payload.notification?.body

        if (title && body) {
          new Notification(title, { body, icon: '/logo-small.png' })
        } else {
          console.warn('Notification payload missing title or body:', payload)
        }
      })
    })
    .catch((err) => console.error('SW registration failed:', err))
}
