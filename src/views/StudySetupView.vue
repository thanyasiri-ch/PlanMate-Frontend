<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StepIndicator from '../components/StepIndicator.vue'
import { computed, ref, provide, type Ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()
const childComponent = ref<{ submit?: () => boolean } | null>(null)

const steps = ['term', 'course', 'topic', 'availability', 'generate Plan']

const subStepIndex = ref(0) // 0 = term, 1 = course

watch(
  () => route.path,
  (newPath) => {
    const currentPathEnd = newPath.split('/').pop() ?? ''
    const index = steps.indexOf(currentPathEnd)
    subStepIndex.value = index > -1 ? index : 0;
  },
  {
    // This makes sure the index is correct on initial page load
    immediate: true,
  }
)

const currentStepIndex = computed(() => {
  const base = route.name as string
  if (base === 'term') {
    return subStepIndex.value
  }
  const index = steps.indexOf(base)
  return index === -1 ? 0 : index
})

function activateStep(stepName: string) {
  if (steps.includes(stepName)) {
    router.push(`/study-setup/${stepName}`)
  }
}

function nextStep() {
  if (childComponent.value?.submit && !childComponent.value.submit()) return

  const currentIndex = currentStepIndex.value // Use the computed index

  // If we are on step 'term' (index 0), next takes us to 'course' (index 1)
  if (currentIndex === 0) {
    subStepIndex.value = 1
    return
  }

  if (currentIndex < steps.length - 1) {
    const nextStepName = steps[currentIndex + 1]
    activateStep(nextStepName)
  }
}

function prevStep() {
  const currentIndex = currentStepIndex.value // Use the computed index

  // If we are on step 'course' (index 1), back takes us to 'term' (index 0)
  if (currentIndex === 1) {
    subStepIndex.value = 0
    return
  }

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
        <StepIndicator :activeStepIndex="currentStepIndex" @step-click="activateStep" />
      </div>

      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          ref="childComponent"
          class="flex-1 overflow-hidden"
        />
      </router-view>

      <!-- Shared navigation buttons across all steps -->
      <div class="flex justify-between items-center mt-8 mb-20 mx-80">
        <button
          @click="prevStep"
          class="px-6 py-2 text-sm font-semibold text-white bg-gray-400 rounded-full shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          Back
        </button>
        <button
          @click="nextStep"
          class="px-6 py-2 text-sm font-semibold text-white bg-green-500 rounded-full shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Next
        </button>
      </div>
    </div>
  </DefaultLayout>
</template>
