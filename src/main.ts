import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@/services/AxiosInterceptorSetup'
import { auth } from '@/firebase/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const app = createApp(App)

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await user.getIdToken()
    localStorage.setItem('access_token', idToken)
  } else {
    localStorage.removeItem('access_token')
  }
})

app.use(createPinia())
app.use(router)

app.mount('#app')
