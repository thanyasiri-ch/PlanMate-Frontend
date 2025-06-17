<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StepIndicator from '../components/StepIndicator.vue'
import { ref, provide, type Ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()

const steps = ['term', 'course', 'topic', 'availability', 'generate Plan']

const subStepIndex = ref(0) // 0 = term, 1 = course

watch(
  () => route.path,
  (newPath) => {
    const currentPathEnd = newPath.split('/').pop() ?? ''
    const index = steps.indexOf(currentPathEnd)
    // When the route is /study-setup/course, this will correctly set the subStepIndex to 1.
    // When it's /study-setup/term, it will be 0.
    subStepIndex.value = index > -1 ? index : 0;
  },
  {
    // makes sure the index is correct on initial page load
    immediate: true,
  }
)

function activateStep(stepName: string) {
  if (steps.includes(stepName)) {
    router.push(`/study-setup/${stepName}`)
  }
}

function nextStep() {
  const currentIndex = subStepIndex.value
  if (currentIndex < steps.length - 1) {
    const nextStepName = steps[currentIndex + 1]
    activateStep(nextStepName)
  }
}

function prevStep() {
  const currentIndex = subStepIndex.value
  if (currentIndex > 0) {
    const prevStepName = steps[currentIndex - 1]
    activateStep(prevStepName)
  }
}

// Provide the navigator object to all child routes
provide('stepNavigator', {
  activateStep,
  subStepIndex: subStepIndex as Ref<number>,
})
</script>
<template>
  <DefaultLayout>
    <div class="h-full flex flex-col overflow-hidden">
      <div class="flex justify-center mb-12">
        <StepIndicator :activeStepIndex="subStepIndex" @step-click="activateStep" />
      </div>

      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          ref="childComponent"
          class="flex-1 overflow-hidden"
        />
      </router-view>

      <!-- Shared navigation buttons across all steps -->
      <div class="flex justify-between items-center mt-8 mb-20 mx-auto w-full max-w-sm">
        <button
          @click="prevStep"
          :disabled="subStepIndex === 0"
          class="w-12 h-12 flex items-center justify-center text-xl font-bold text-white bg-gray-400 rounded-full shadow-md transition-colors hover:bg-gray-500 focus:outline-none disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Previous Step"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="nextStep"
          :disabled="subStepIndex >= steps.length - 1"
          class="w-12 h-12 flex items-center justify-center text-xl font-bold text-white bg-[#766BDE] rounded-full shadow-md transition-colors hover:bg-[#423C9A] focus:outline-none disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          title="Next Step"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </DefaultLayout>
</template>
