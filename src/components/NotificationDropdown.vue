<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notificationStore'
import type { NotificationType } from '@/types'

const router = useRouter()
const store = useNotificationStore()
const { notifications, unreadCount, loading } = storeToRefs(store)

const showNotifications = ref(false)

onMounted(() => {
  store.fetchNotifications()
})

function getIcon(type: NotificationType): string {
  switch (type) {
    case 'GENERAL': return '💬'
    case 'DEADLINE': return '🗓️'
    case 'RANKING': return '🏅'
    case 'STREAK': return '⚡'
    default: return '💬'
  }
}

function getColor(type: NotificationType): string {
  switch (type) {
    case 'GENERAL': return 'text-blue-500'
    case 'DEADLINE': return 'text-red-500'
    case 'RANKING': return 'text-yellow-500'
    case 'STREAK': return 'text-orange-500'
    default: return 'text-gray-500'
  }
}

function getUrgencyBorder(type: NotificationType): string {
  switch (type) {
    case 'DEADLINE': return 'border-red-400 bg-red-50 hover:bg-red-100'
    case 'STREAK': return 'border-orange-400 bg-orange-50 hover:bg-orange-100'
    case 'RANKING': return 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
    case 'GENERAL': return 'border-blue-400 bg-blue-50 hover:bg-blue-100'
    default: return 'border-gray-400 bg-gray-50 hover:bg-gray-100'
  }
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function closeDropdown() {
  showNotifications.value = false
}

function markAsRead(id: number, type: string) {
  store.markAsRead(id)
  if (type === 'DEADLINE' || type === 'STREAK') router.push('/focus-mode')
  else if (type === 'RANKING') router.push('/group')
}
</script>

<template>
  <div class="relative font-inter">
    <!-- Notification Bell Icon -->
    <button
      @click="toggleNotifications"
      class="text-gray-500 hover:text-gray-700 relative p-1 transition-colors rounded-full"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022 23.848 23.848 0 005.455 1.31m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"
      ></span>
    </button>

    <!-- Notification Dropdown -->
    <transition name="slide-fade">
      <div
        v-if="showNotifications"
        class="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transform origin-top-right"
      >
        <div class="p-4">
          <!-- Header -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">
              Notifications
              <span v-if="unreadCount > 0" class="text-sm font-semibold text-red-500 ml-1">
                ({{ unreadCount }} new)
              </span>
            </h3>
            <button
              @click="closeDropdown"
              class="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
              aria-label="Close notifications"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Notification List -->
          <ul class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <li
              v-for="item in notifications"
              :key="item.id"
              @click="markAsRead(item.id, item.type)"
              class="p-3 rounded-lg flex items-start space-x-3 transition-all cursor-pointer"
              :class="{
                'border-l-4 shadow-sm': !item.isRead,
                [getUrgencyBorder(item.type)]: !item.isRead,
                'hover:bg-gray-100 text-gray-600 bg-white': item.isRead,
                'border-gray-200 border': item.isRead,
              }"
            >
              <div class="flex-shrink-0 pt-0.5 text-xl" :class="getColor(item.type)">
                {{ getIcon(item.type) }}
              </div>

              <div class="flex-grow">
                <p class="text-sm text-gray-800 leading-snug font-medium">
                  {{ item.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">{{ item.content }}</p>
                <span class="text-xs text-gray-400 mt-0.5 block">
                  {{ new Date(item.time).toLocaleString() }}
                </span>
              </div>

              <div
                v-if="!item.isRead"
                class="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"
              ></div>
            </li>

            <li
              v-if="notifications.length === 0 && !loading"
              class="text-center text-gray-400 text-sm p-4"
            >
              You're all caught up! 🎉
            </li>

            <li v-if="loading" class="text-center text-gray-400 text-sm p-4">
              Loading notifications...
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px) scale(0.95);
  opacity: 0;
}
</style>
