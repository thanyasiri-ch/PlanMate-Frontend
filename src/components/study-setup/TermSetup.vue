<script setup lang="ts">
import { useStudySetupStore } from '@/stores/studySetup'
const store = useStudySetupStore()
const emit = defineEmits(['next'])

function submit() {
  store.setTerm({ name: 'Spring 2025', startDate: '2025-01-01', endDate: '2025-05-20', courses: [] })
  emit('next')
}
</script>

<template>
  <div>
    <h2>Term Info</h2>
    <!-- Term inputs (name, startDate, endDate) -->
    <button @click="submit">Next</button>
  </div>
</template>
