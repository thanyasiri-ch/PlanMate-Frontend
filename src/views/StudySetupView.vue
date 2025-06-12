<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StepIndicator from '../components/StepIndicator.vue'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const steps = ['term', 'course', 'topic', 'availability', 'generate']
const stepIndex = computed(() => steps.indexOf(route.name as string))

function nextStep() {
  if (stepIndex.value < steps.length - 1) {
    router.push({ name: steps[stepIndex.value + 1] })
  }
}

function prevStep() {
  if (stepIndex.value > 0) {
    router.push({ name: steps[stepIndex.value - 1] })
  }
}
</script>

<template>
  <DefaultLayout>
    <div>
      <StepIndicator :currentStep="stepIndex" />
      <router-view @next="nextStep" @back="prevStep" />
    </div>
  </DefaultLayout>
</template>
