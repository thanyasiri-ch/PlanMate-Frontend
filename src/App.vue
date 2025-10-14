<script setup lang="ts">
import { RouterView } from 'vue-router'
import LoadingSpinner from '@/components/Loading.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMessaging, onMessage } from 'firebase/messaging'
import { app as firebaseApp } from '@/firebase/firebase'
import { useGroupStore } from '@/stores/useGroupStore'

const isLoading = ref(false)
const latestNotification = ref<string | null>(null)

const router = useRouter()
const groupStore = useGroupStore()
let progressInterval: ReturnType<typeof setInterval> | null = null

function getBaseRoute(path: string) {
  const segments = path.split('/').filter(Boolean)
  return '/' + (segments[0] ?? '')
}

onMounted(async () => {
  // Router loading transitions
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

  // Firebase Foreground Notification Listener
  const messaging = getMessaging(firebaseApp)
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('FCM received in Vue component:', payload)
    const title = payload.data?.title || payload.notification?.title
    const body = payload.data?.body || payload.notification?.body

    if (title && body) {
      latestNotification.value = `${title}: ${body}`
    }
  })

  // --- Rank Change Auto-Detection ---
  await groupStore.fetchGroup()
  if (groupStore.groups.length > 0) {
    // You can loop through multiple groups if you want
    const groupIds = groupStore.groups.map((g) => g.id)

    // Poll every 60s
    progressInterval = setInterval(async () => {
      for (const id of groupIds) {
        await groupStore.fetchGroupProgress(id)
      }
    }, 60000)
  }

  // Cleanup
  onUnmounted(() => {
    unsubscribe()
    if (progressInterval) clearInterval(progressInterval)
  })
})
</script>
<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <RouterView />
  </div>
</template>
