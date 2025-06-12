
<template>
  <div>
    <h2>Availability</h2>
    <!-- Select date/time ranges -->
    <button @click="emit('back')">Back</button>
    <button @click="saveSetup">Next</button>
  </div>
</template>

<script setup lang="ts">
import { useStudySetupStore } from '@/stores/studySetup'
import StudySetupService from '@/services/StudySetupServices'
const emit = defineEmits(['next', 'back'])
const store = useStudySetupStore()

async function saveSetup() {
  await StudySetupService.saveSetup(store.studySetupDTO)
  emit('next')
}
</script>
