<script setup lang="ts">
import { RouterView } from 'vue-router'
import LoadingSpinner from '@/components/Loading.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMessaging, onMessage } from 'firebase/messaging'
import { app as firebaseApp } from '@/firebase/firebase'

const isLoading = ref(false)
const router = useRouter()
const latestNotification = ref<string | null>(null)

function getBaseRoute(path: string) {
  const segments = path.split('/').filter(Boolean)
  return '/' + (segments[0] ?? '')
}

onMounted(() => {
  router.beforeEach((to, from, next) => {
    if (getBaseRoute(to.path) !== getBaseRoute(from.path)) {
      isLoading.value = true
    }
    next()
  })

  router.afterEach((to, from) => {
    if (getBaseRoute(to.path) !== getBaseRoute(from.path)) {
      setTimeout(() => {
        isLoading.value = false
      }, 500)
    }
  })

  // FCM Foreground listener
  const messaging = getMessaging(firebaseApp)
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('FCM received in Vue component:', payload)
    const title = payload.data?.title || payload.notification?.title
    const body = payload.data?.body || payload.notification?.body

    if (title && body) {
      latestNotification.value = `${title}: ${body}`
    }
  })

  // Cleanup when component unmounts
  onUnmounted(() => unsubscribe())
})
</script>
<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <RouterView />
  </div>
</template>
