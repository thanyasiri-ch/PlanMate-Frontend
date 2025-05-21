import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@/services/AxiosInterceptorSetup'
import { auth } from '@/firebase/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia) // Must come before using the store

const authStore = useAuthStore()

authStore.checkAuthStatus()

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await user.getIdToken()
    localStorage.setItem('access_token', idToken)

    authStore.checkAuthStatus()
  } else {
    localStorage.removeItem('access_token')
    authStore.logout()
  }
})

app.use(router)
app.mount('#app')
