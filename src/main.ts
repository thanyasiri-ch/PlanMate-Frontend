import './assets/main.css'
import "nprogress/nprogress.css"

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

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // Enable persisted state for Pinia
app.use(pinia) // Must come before using the store

const authStore = useAuthStore()

authStore.checkAuthStatus()

onAuthStateChanged(auth, async (user) => {
  if (user && !authStore.isLoggedIn) {
    const idToken = await user.getIdToken();
    const appUser = formatUser(user); // keep consistent user format
    authStore.setAuth(appUser, idToken);
  } else if (!user) {
    authStore.logout();
  }
});

app.use(router)
app.mount('#app')
