<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StepIndicator from '../components/StepIndicator.vue'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()
const childComponent = ref<{ submit?: () => boolean } | null>(null)

const steps = ['term', 'course', 'topic', 'availability', 'generate']

// Compute current step name directly from the route name
const currentStepName = computed(() => route.name as string)

// Move to next step
function nextStep() {
  // Check if a method needs to be called on the current step's component
  if (childComponent.value && typeof childComponent.value.submit === 'function') {
    // Call the child's submit function and only proceed if it returns true
    const canProceed = childComponent.value.submit()
    if (!canProceed) {
        return // Stop navigation if the child's validation fails
    }
  }

  const currentIndex = steps.indexOf(currentStepName.value)
  if (currentIndex < steps.length - 1) {
    router.push({ name: steps[currentIndex + 1] })
  }
}

// Move to previous step
function prevStep() {
  const currentIndex = steps.indexOf(currentStepName.value)
  if (currentIndex > 0) {
    router.push({ name: steps[currentIndex - 1] })
  }
}
</script>

<template>
  <DefaultLayout>
    <div class="h-full flex flex-col overflow-hidden">
      <div class="flex justify-center mb-12">
          <StepIndicator :activeStep="currentStepName" />
      </div>

      <router-view ref="childComponent" @next="nextStep" @back="prevStep" class="flex-1 overflow-hidden" />

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
