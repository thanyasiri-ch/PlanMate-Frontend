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
pinia.use(piniaPluginPersistedstate) // Enable persisted state for Pinia
app.use(pinia) // Must come before using the store

const authStore = useAuthStore()

authStore.checkAuthStatus()

onAuthStateChanged(auth, async (user) => {
  if (user && !authStore.isLoggedIn) {
    const idToken = await user.getIdToken()
    const appUser = formatUser(user) // keep consistent user format
    authStore.setAuth(appUser, idToken)
  } else if (!user) {
    authStore.logout()
  }
})

app.use(router)
app.mount('#app')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(async (registration) => {
      console.log('SW registered:', registration)

      const messaging = getMessaging(firebaseApp)

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return
      }

      const token = await getToken(messaging, {
        vapidKey:
          'BMvkD_DKSa905WnkdUGJ0nv1ojW3iI5Q-XA4GLpv6t3J1WObcH1rgPimrPu17ZQjJ-YXgNOgRZTeecDNAjNBqkA',
        serviceWorkerRegistration: registration, // link SW to this token
      })

      console.log('🔹 Web FCM token:', token)
      await notificationService.saveToken(token)

      onMessage(messaging, (payload) => {
        console.log('Foreground notification:', payload)

        const title = payload.data?.title
        const body = payload.data?.body

        if (title && body) {
          new Notification(title, {
            body: body,
          })
        } else {
          console.warn('Notification payload missing title or body:', payload)
        }
      })
    })
    .catch((err) => console.error('SW registration failed:', err))
}
