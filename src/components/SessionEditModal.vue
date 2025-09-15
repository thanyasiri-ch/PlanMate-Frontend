<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue'
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
  existingSessions: {
    type: Array as PropType<SessionDTO[]>,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'save'])

// Local state for the form inputs.
const editDate = ref('')
const editStart = ref('')
const overlapError = ref<string>('')

const getEndTime24h = (start: string, duration: number): string => {
  if (!start || !duration) return ''
  const [hours, minutes] = start.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  date.setMinutes(date.getMinutes() + duration)
  return date.toTimeString().slice(0, 5) // คืนค่าเป็น "HH:mm"
}

const computedEndTime = computed(() => {
  if (!editStart.value || !props.item?.duration) {
    return '--:--'
  }
  const endTime24 = getEndTime24h(editStart.value, props.item.duration)
  const [hours, minutes] = endTime24.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = ((hours + 11) % 12) + 1
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`
})

// This `watch` effect syncs the local form state
// with the prop whenever a new item is passed to the modal.
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      editDate.value = newItem.date || new Date().toISOString().split('T')[0]
      editStart.value = newItem.start || '09:00'
      overlapError.value = ''
    }
  },
  { immediate: true },
)

function handleSave() {
  overlapError.value = ''
  if (!props.item) return

  const newStart = editStart.value
  const newEnd = getEndTime24h(newStart, props.item.duration)
  const newDate = editDate.value

  for (const existingSession of props.existingSessions) {
    if (existingSession.sessionId === props.item.sessionId || existingSession.date !== newDate) {
      continue
    }

    const existingStart = existingSession.start
    const existingEnd = existingSession.end

    if (newStart < existingEnd && newEnd > existingStart) {
      overlapError.value = `Time conflicts with "${
        existingSession.topicName || existingSession.assignmentName
      }" (${existingStart} - ${existingEnd}).`
      return
    }
  }

  emit('save', {
    ...props.item,
    date: editDate.value,
    start: editStart.value,
    end: getEndTime24h(editStart.value, props.item.duration),
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/25"
    @click.self="handleClose"
  >
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h2 class="text-xl font-bold text-gray-800">
        {{ item?.isScheduled ? 'Edit Session' : 'Schedule Item' }}
      </h2>

      <p class="mt-1 text-base font-bold text-indigo-500">
        {{ item?.topicName || item?.assignmentName }}
      </p>

      <div class="mt-6 space-y-4">
        <div>
          <label for="session-date" class="block text-sm font-medium text-gray-700">Date</label>
          <input
            id="session-date"
            v-model="editDate"
            type="date"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-1 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="session-start" class="block text-sm font-medium text-gray-700"
            >Start Time</label
          >
          <input
            id="session-start"
            v-model="editStart"
            type="time"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-1 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="session-end" class="block text-sm font-medium text-gray-700">End Time</label>
          <div
            id="session-end"
            class="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 px-3 py-1 text-sm text-gray-500 shadow-sm">
            {{ computedEndTime }}
          </div>
        </div>
        <p class="text-xs text-gray-500">
          Duration: {{ item?.duration }} minutes
        </p>
      </div>

      <div v-if="overlapError" class="mt-4 rounded-md bg-red-50 p-3">
        <p class="text-sm font-medium text-red-700">{{ overlapError }}</p>
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
