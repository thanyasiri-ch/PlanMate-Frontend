<script setup lang="ts">
import { ref } from 'vue'

const showNotifications = ref(false)

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}
</script>

<template>
  <div class="relative">
    <!-- Notification bell button -->
    <button @click="toggleNotifications" class="text-gray-500 hover:text-gray-700 relative">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022 23.848 23.848 0 005.455 1.31m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>

      <!-- Optional badge for unread count -->
      <span
        class="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"
      ></span>
    </button>

    <!-- Notification Dropdown -->
    <div
      v-if="showNotifications"
      class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-300 z-10"
    >
      <div class="p-3">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-semibold text-gray-800">Notifications</h3>
          <button
            class="text-sm text-blue-500 hover:underline"
            @click="showNotifications = false"
          >
            Close
          </button>
        </div>

        <ul class="space-y-2 max-h-60 overflow-y-auto">
          <!-- Example notifications -->
          <li class="p-2 rounded-md hover:bg-gray-100">
            <p class="text-sm text-gray-700">
              📨 New message from <span class="font-medium">Admin</span>
            </p>
            <span class="text-xs text-gray-500">2 min ago</span>
          </li>
          <li class="p-2 rounded-md hover:bg-gray-100">
            <p class="text-sm text-gray-700">✅ Task completed successfully</p>
            <span class="text-xs text-gray-500">10 min ago</span>
          </li>
          <li class="p-2 rounded-md hover:bg-gray-100">
            <p class="text-sm text-gray-700">⚠️ Server downtime reported</p>
            <span class="text-xs text-gray-500">1 hour ago</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
