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
    subStepIndex.value = index > -1 ? index : 0
  },
  {
    // makes sure the index is correct on initial page load
    immediate: true,
  },
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
      <div class="flex justify-center mb-17">
        <StepIndicator :activeStepIndex="subStepIndex" @step-click="activateStep" />
      </div>

      <router-view v-slot="{ Component }">
        <component :is="Component" ref="childComponent" class="flex-1 overflow-hidden" />
      </router-view>

      <!-- Shared navigation buttons across all steps -->
      <div class="flex justify-center items-center gap-x-100 mt-8 mb-16 mx-auto w-full max-w-sm">
        <button
          @click="prevStep"
          :disabled="subStepIndex === 0"
          class="px-6 py-2 text-white font-semibold bg-gray-600 rounded-full shadow-md transition-colors hover:bg-gray-700 focus:outline-none disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          @click="nextStep"
          :disabled="subStepIndex >= steps.length - 1"
          class="px-6 py-2 text-white font-semibold bg-[#57C490] rounded-full shadow-md transition-colors hover:bg-[#589778] focus:outline-none disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </DefaultLayout>
</template>
