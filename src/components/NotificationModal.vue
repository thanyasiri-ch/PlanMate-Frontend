<script setup lang="ts">
import { computed } from 'vue'

// Define the component's props for reusability
const props = defineProps({
  // Controls the visibility of the modal
  isOpen: {
    type: Boolean,
    required: true,
  },
  // Determines the style ('success' or 'error')
  status: {
    type: String,
    required: true,
    validator: (value: string) => ['success', 'error'].includes(value),
  },
  // The main title of the modal
  title: {
    type: String,
    required: true,
  },
  // The detailed message to display
  message: {
    type: String,
    required: true,
  },
})

// Define the event the component can emit
const emit = defineEmits(['close'])

// This computed property provides the correct Tailwind CSS classes based on the status
const statusStyles = computed(() => {
  if (props.status === 'success') {
    return {
      iconContainer: 'bg-green-100',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 focus-visible:outline-green-600',
    }
  } else {
    // 'error' status
    return {
      iconContainer: 'bg-red-100',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600',
    }
  }
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-lg"
    @click.self="handleClose"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
        :class="statusStyles.iconContainer"
      >
        <svg
          v-if="status === 'success'"
          class="h-8 w-8"
          :class="statusStyles.icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <svg
          v-if="status === 'error'"
          class="h-8 w-8"
          :class="statusStyles.icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div class="mt-3">
        <h3 class="text-lg font-semibold leading-6 text-gray-900">{{ title }}</h3>
        <div class="mt-2">
          <p class="text-sm text-gray-500">{{ message }}</p>
        </div>
      </div>

      <div class="mt-5">
        <button
          type="button"
          class="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-offset-2"
          :class="statusStyles.button"
          @click="handleClose"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>
