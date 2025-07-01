<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import type { SessionDTO } from '@/types'

const props = defineProps({
  // The session item to edit. It should be the "enriched" version from the parent.
  item: {
    type: Object as PropType<SessionDTO | null>,
    required: true,
  },
  // Controls the visibility of the modal.
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'save'])

// Local state for the form inputs.
const editDate = ref('')
const editStart = ref('')

// This `watch` effect syncs the local form state
// with the prop whenever a new item is passed to the modal.
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      editDate.value = newItem.date
      editStart.value = newItem.start
    }
  },
)

function handleSave() {
  if (props.item) {
    emit('save', {
      ...props.item,
      date: editDate.value,
      start: editStart.value,
    })
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h2 class="text-xl font-bold text-gray-800">
        {{ item?.isScheduled ? 'Edit Session' : 'Schedule Item' }}
      </h2>

      <p class="mt-1 text-sm text-gray-500">
        {{ item?.topicName || item?.assignmentName }}
      </p>

      <div class="mt-6 space-y-4">
        <div>
          <label for="session-date" class="block text-sm font-medium text-gray-700">Date</label>
          <input
            id="session-date"
            v-model="editDate"
            type="date"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="session-start" class="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            id="session-start"
            v-model="editStart"
            type="time"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div class="mt-8 flex justify-end gap-x-3">
        <button
          @click="handleClose"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>
