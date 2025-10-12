<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type NotificationType = 'General' | 'Deadline' | 'Ranking' | 'Streak'

interface Notification {
  id: number
  type: NotificationType
  message: string
  time: string
  read: boolean
}

const showNotifications = ref(false)

const notifications = ref<Notification[]>([
  // Unread Items
  { id: 1, type: 'Deadline', message: 'Assignment for CS204 is due tomorrow!', time: '1h ago', read: false },
  { id: 2, type: 'Ranking', message: 'You moved up to rank #3 in your group!', time: '5h ago', read: false },
  { id: 3, type: 'General', message: 'Focus session completed!', time: '2m ago', read: false },

  // Read Items
  { id: 6, type: 'General', message: 'New member joined your study group', time: '10m ago', read: true },
  { id: 4, type: 'Streak', message: 'Don’t lose your 5-day streak! Keep going!', time: '2d ago', read: true },
  { id: 5, type: 'Deadline', message: 'You have 2 unfinished topics in AI101', time: '3h ago', read: true },
])

const sortedNotifications = computed(() => {
  const sorted = [...notifications.value]
  return sorted.sort((a, b) => {
    if (!a.read && b.read) return -1
    if (a.read && !b.read) return 1
    return b.id - a.id
  })
})

const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

function getIcon(type: NotificationType): string {
  switch (type) {
    case 'General': return '💬'
    case 'Deadline': return '🗓️'
    case 'Ranking': return '🏅'
    case 'Streak': return '⚡'
    default: return '💬'
  }
}

function getColor(type: NotificationType): string {
  switch (type) {
    case 'General': return 'text-blue-500'
    case 'Deadline': return 'text-red-500'
    case 'Ranking': return 'text-yellow-500'
    case 'Streak': return 'text-orange-500'
    default: return 'text-gray-500'
  }
}

function getUrgencyBorder(type: NotificationType): string {
  switch (type) {
    case 'Deadline': return 'border-red-400 bg-red-50 hover:bg-red-100'
    case 'Streak': return 'border-orange-400 bg-orange-50 hover:bg-orange-100'
    case 'Ranking': return 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
    case 'General': return 'border-blue-400 bg-blue-50 hover:bg-blue-100'
    default: return 'border-gray-400 bg-gray-50 hover:bg-gray-100'
  }
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function closeDropdown() {
  showNotifications.value = false
}

function markAsRead(id: number) {
  const item = notifications.value.find(n => n.id === id)
  if (!item) return

  item.read = true
  closeDropdown()

  if (item.type === 'Deadline' || item.type === 'Streak') {
    router.push('/focus-mode')
  } else if (item.type === 'Ranking') {
    router.push('/group')
  }
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Notification List -->
          <ul class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <li
              v-for="item in sortedNotifications"
              :key="item.id"
              @click="markAsRead(item.id)"
              class="p-3 rounded-lg flex items-start space-x-3 transition-all cursor-pointer"
              :class="{
                'border-l-4 shadow-sm': !item.read,
                [getUrgencyBorder(item.type)]: !item.read,
                'hover:bg-gray-100 text-gray-600 bg-white': item.read,
                'border-gray-200 border': item.read,
              }"
            >
              <div class="flex-shrink-0 pt-0.5 text-xl" :class="getColor(item.type)">
                {{ getIcon(item.type) }}
              </div>

              <div class="flex-grow">
                <p
                  class="text-sm text-gray-800 leading-snug"
                  :class="{
                    'font-semibold': !item.read,
                    'font-bold': item.type === 'Deadline' && item.read,
                    'font-medium': item.read && item.type !== 'Deadline'
                  }"
                >
                  {{ item.message }}
                </p>
                <span class="text-xs text-gray-500 mt-0.5 block">{{ item.time }}</span>
              </div>

              <div v-if="!item.read" class="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
            </li>

            <li v-if="sortedNotifications.length === 0" class="text-center text-gray-400 text-sm p-4">
              You're all caught up! 🎉
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
