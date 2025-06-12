<script setup lang="ts">
defineProps<{ currentStep: number }>()
</script>

<template>
  <div class="flex space-x-4 justify-center mb-6">
    <div v-for="n in 5" :key="n" class="step" :class="{ active: n <= currentStep }">
      {{ ['Term', 'Course', 'Topic', 'Availability', 'Generate'][n - 1] }}
    </div>
  </div>
</template>


<style scoped>
.step {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: #e5e7eb;
}
.step.active {
  background: #6366f1;
  color: white;
}
</style>
