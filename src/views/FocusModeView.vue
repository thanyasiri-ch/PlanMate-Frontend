<script setup lang="ts">
import studentImage from '@/assets/images/students.png'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { UserPlusIcon, XMarkIcon, PauseIcon, PlayIcon } from '@heroicons/vue/24/solid'
import { useFocusSessionStore } from '@/stores/focusSession'
import type { SessionType } from '@/types'

const route = useRoute()
const router = useRouter()

const timeLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const isPaused = ref(false)

const focusStore = useFocusSessionStore()
const focusSession = focusStore.enrichedSession

const taskName = computed(() => focusSession?.displayName ?? 'Unknown Task')
const taskType = computed(() => focusSession?.type ?? 'Unknown Type')

function handleTimerEnd() {
  const focusSessionId = route.query.focusSessionId as string
  if (focusSessionId) {
    focusStore
      .endSession()
      .then(() => {
        alert('Session complete! Well done 🎉')
        router.push({ name: 'todo' })
      })
      .catch(() => {
        alert('Failed to end session properly.')
      })
  } else {
    router.push({ name: 'todo' })
  }
}

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

function startTimer() {
  if (timer) return
  timer = setInterval(() => {
    if (isPaused.value) return

    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer!)
      timer = null
      handleTimerEnd()
    }
  }, 1000)
}

function togglePause() {
  isPaused.value = !isPaused.value
}

function closeFocus() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  router.push({ name: 'todo' })
}

onMounted(() => {
  const durationInMinutes = focusSession?.duration ?? 25
  timeLeft.value = durationInMinutes * 60
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  selectedFriends.value.forEach((friend) => {
    if (friend.timer) clearInterval(friend.timer)
  })
})

const showFriendPanel = ref(false)

const onlineFriends = ref([
  { id: 1, name: 'Ploy', avatar: 'https://i.pravatar.cc/100?img=1' },
  { id: 2, name: 'Bas', avatar: 'https://i.pravatar.cc/100?img=2' },
  { id: 3, name: 'Mark', avatar: 'https://i.pravatar.cc/100?img=3' },
])

function toggleFriendPanel() {
  showFriendPanel.value = !showFriendPanel.value
}

function closeFriendPanel() {
  showFriendPanel.value = false
}

const selectedFriends = ref<
  {
    id: number
    name: string
    avatar: string
    timeLeft: number
    timer: ReturnType<typeof setInterval> | null
  }[]
>([])

function addFriendToScreen(friend: { id: number; name: string; avatar: string }) {
  if (selectedFriends.value.some((f) => f.id === friend.id)) return

  const newFriend = {
    ...friend,
    timeLeft: (focusSession?.duration ?? 25) * 60,
    timer: null,
  }

  newFriend.timer = setInterval(() => {
    const target = selectedFriends.value.find((f) => f.id === friend.id)
    if (target && target.timeLeft > 0) {
      target.timeLeft--
    } else {
      if (target?.timer) clearInterval(target.timer)
    }
  }, 1000)

  selectedFriends.value.push(newFriend)
}

function removeFriendFromScreen(friendId: number) {
  const index = selectedFriends.value.findIndex((f) => f.id === friendId)
  if (index !== -1) {
    if (selectedFriends.value[index].timer) {
      clearInterval(selectedFriends.value[index].timer!)
    }
    selectedFriends.value.splice(index, 1)
  }
}

const formatFriendTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatSessionType(type: SessionType): string {
  const words = type.split('_').map((word) => {
    return word.charAt(0) + word.slice(1).toLowerCase()
  })
  return words.join(' ')
}
</script>

<template>
  <div class="flex flex-col h-screen bg-sky-50 text-slate-800 p-6 md:p-8 relative overflow-hidden">
    <div class="absolute top-6 left-6 right-6 flex justify-between items-center">
      <button
        @click="toggleFriendPanel"
        class="p-2 rounded-full hover:bg-slate-200 transition-colors"
        aria-label="Add Friend"
      >
        <UserPlusIcon class="h-6 w-6 text-slate-600" />
      </button>
      <button
        @click="closeFocus"
        class="p-2 rounded-full hover:bg-slate-200 transition-colors"
        aria-label="Close Focus Mode"
      >
        <XMarkIcon class="h-6 w-6 text-slate-600" />
      </button>
    </div>

    <transition name="slide">
      <div
        v-if="showFriendPanel"
        class="absolute top-0 left-0 h-full w-full max-w-xs bg-white border-r border-slate-200 shadow-xl z-50 p-6 flex flex-col"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-700">Friends Online</h2>
          <button
            @click="closeFriendPanel"
            class="p-1 rounded-full hover:bg-slate-200"
            aria-label="Close Friend Panel"
          >
            <XMarkIcon class="h-5 w-5 text-slate-600" />
          </button>
        </div>
        <ul class="space-y-2 overflow-y-auto">
          <li
            v-for="friend in onlineFriends"
            :key="friend.id"
            class="flex items-center justify-between space-x-3 hover:bg-sky-100 p-2 rounded-lg"
          >
            <div class="flex items-center space-x-3 flex-grow">
              <div class="relative">
                <img
                  :src="friend.avatar"
                  alt="Profile"
                  class="w-10 h-10 rounded-full object-cover"
                />
                <span
                  class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                ></span>
              </div>
              <span class="text-slate-800 font-medium">{{ friend.name }}</span>
            </div>
            <button
              v-if="!selectedFriends.some((f) => f.id === friend.id)"
              @click.stop="addFriendToScreen(friend)"
              class="text-sky-500 hover:text-sky-700 p-1 rounded-full hover:bg-sky-100"
              aria-label="Add Friend"
              title="Add Friend"
            >
              <UserPlusIcon class="h-5 w-5" />
            </button>
            <button
              v-else
              @click.stop="removeFriendFromScreen(friend.id)"
              class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
              aria-label="Remove Friend"
              title="Remove Friend"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </li>
        </ul>
      </div>
    </transition>

    <main class="flex-grow flex flex-col items-center justify-center text-center -mt-16">
      <h1 class="text-7xl md:text-8xl font-bold text-slate-700 tabular-nums">
        {{ formattedTime }}
      </h1>
      <p class="text-xl md:text-2xl text-slate-500 mt-2">
        Focusing on: <span class="font-semibold">{{ taskName }} ({{ formatSessionType(taskType) }})</span>
      </p>
    </main>

    <footer class="flex flex-col items-center justify-end gap-8 pb-10">
      <div class="flex flex-row justify-center items-end gap-6 flex-wrap">
        <div class="flex flex-col items-center text-center">
          <div
            class="sprite"
            :style="{
              backgroundImage: `url(${studentImage})`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }"
          ></div>
          <p class="mt-2 text-md font-semibold text-slate-700">You</p>
          <p class="text-sm font-mono text-slate-500 bg-slate-200/70 rounded px-2 py-0.5 invisible">
            &nbsp;
          </p>
        </div>

        <div v-for="friend in selectedFriends" :key="friend.id" class="flex flex-col items-center">
          <div class="sprite" :style="{ backgroundImage: `url(${studentImage})` }"></div>
          <p class="mt-2 text-md font-semibold text-slate-600">{{ friend.name }}</p>
          <p class="text-sm font-mono text-slate-500 bg-slate-200/70 rounded px-2 py-0.5">
            {{ formatFriendTime(friend.timeLeft) }}
          </p>
        </div>
      </div>

      <button
        @click="togglePause"
        class="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-1"
      >
        <template v-if="isPaused">
          <PlayIcon class="h-6 w-6 text-green-500" />
          <span class="text-lg font-semibold text-slate-700">Resume</span>
        </template>
        <template v-else>
          <PauseIcon class="h-6 w-6 text-orange-500" />
          <span class="text-lg font-semibold text-slate-700">Pause</span>
        </template>
      </button>
    </footer>
  </div>
</template>

<style scoped>
.sprite {
  width: 170.67px;
  height: 272px;
  background-image: url('../assets/images/student.png');
  background-repeat: no-repeat;
  background-position: 0 0;
  animation: walk 1s steps(3, start) infinite;
}

@keyframes walk {
  from {
    background-position: -512px 0;
  }
  to {
    background-position: 0 0;
  }
}

/* Friend panel transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
