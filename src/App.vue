<script setup lang="ts">
import { RouterView } from 'vue-router'
import LoadingSpinner from '@/components/Loading.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const isLoading = ref(false)
const router = useRouter()

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
})
</script>
<template>
  <div>
    <LoadingSpinner v-if="isLoading" />
    <RouterView />
  </div>
</template>
