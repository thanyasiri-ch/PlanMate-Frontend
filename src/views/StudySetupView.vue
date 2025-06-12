<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StepIndicator from '../components/StepIndicator.vue'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const steps = ['term', 'course', 'topic', 'availability', 'generate']

// Compute current step name directly from the route name
const currentStepName = computed(() => route.name as string)

// Move to next step
function nextStep() {
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
    <div class="w-full">
      <div class="flex justify-center py-8">
          <StepIndicator :activeStep="currentStepName" />
      </div>

      <router-view @next="nextStep" @back="prevStep" />
    </div>
  </DefaultLayout>
</template>
