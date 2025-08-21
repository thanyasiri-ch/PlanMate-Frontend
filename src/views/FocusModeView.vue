<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  UserPlusIcon,
  XMarkIcon,
  PauseIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
} from '@heroicons/vue/24/solid'
import { useFocusSessionStore } from '@/stores/focusSession'
import type { SessionType } from '@/types'
import dayjs from 'dayjs'
import { db } from '@/firebase/firebase.ts'
import { ref as dbRef, onValue, get } from 'firebase/database'
import { getCurrentUser } from '@/services/auth'
import defaultImage from '@/assets/images/default_image.webp'
import egg1 from '@/assets/images/egg1.png'
import egg2 from '@/assets/images/egg2.png'
import egg3 from '@/assets/images/egg3.png'
import egg4 from '@/assets/images/egg4.png'
import egg5 from '@/assets/images/egg5.png'
import egg6 from '@/assets/images/egg6.png'
import egg7 from '@/assets/images/egg7.png'
import egg8 from '@/assets/images/egg8.png'
import egg9 from '@/assets/images/egg9.png'
import egg10 from '@/assets/images/egg10.png'
import egg11 from '@/assets/images/egg11.png'
import egg12 from '@/assets/images/egg12.png'

const eggs = [egg1, egg2, egg3, egg4, egg5, egg6, egg7, egg8, egg9, egg10, egg11, egg12]

const router = useRouter()

const timeLeft = ref(0)

const isInitialLoad = ref(true);
const focusStore = useFocusSessionStore()
const firebaseFocusSession = ref<any | null>(null)

const currentFrame = ref(0)
let frameInterval: number | null = null

const focusSession = computed(() => focusStore.activeSession)

const totalSeconds = computed(() => {
  if (focusSession.value && typeof focusSession.value.session?.duration === 'number') {
    return Math.max(0, focusSession.value.session.duration * 60)
  }
  if (firebaseFocusSession.value && typeof firebaseFocusSession.value.duration === 'number') {
    return Math.max(0, firebaseFocusSession.value.duration * 60)
  }
  return 0
})

function getFrameIndexFor(remainingSec: number, totalSec: number): number {
  if (totalSec <= 0) {
    return 11
  }

  const elapsed = Math.max(0, totalSec - remainingSec)
  const phaseDuration = totalSec / 4
  const phase = Math.min(3, Math.floor(elapsed / (phaseDuration || 1)))

  const nowMs = Date.now()

  if (phase === 0) {
    const frameIdx = Math.floor(nowMs / 400) % 3
    return frameIdx
  }

  if (phase === 1) {
    const frameIdx = 3 + (Math.floor(nowMs / 400) % 3)
    return frameIdx
  }

  if (phase === 2) {
    const progress = Math.min(1, Math.max(0, (elapsed - phaseDuration * 2) / (phaseDuration || 1))) // 0..1
    const sub = Math.floor(progress * 3) // 0,1,2
    return 6 + Math.min(2, sub)
  }

  if (remainingSec <= 0) return 11
  const progress4 = Math.min(1, Math.max(0, (elapsed - phaseDuration * 3) / (phaseDuration || 1)))
  const sub4 = Math.floor(progress4 * 3) // 0..2
  return 9 + Math.min(2, sub4)
}

const currentFrameIndex = computed(() => {
  return getFrameIndexFor(timeLeft.value, totalSeconds.value)
})

watch(currentFrameIndex, (v) => {
  currentFrame.value = v
})

onMounted(() => {
  frameInterval = window.setInterval(() => {
    currentFrame.value = currentFrameIndex.value
  }, 200)
})

onUnmounted(() => {
  if (frameInterval) {
    clearInterval(frameInterval)
    frameInterval = null
  }
})

// Computed values from store
const taskName = computed(() => focusSession.value?.displayName ?? 'Unnamed Task')
const taskType = computed(() => focusSession.value?.sessionType ?? 'Unknown Type')
let timer: number | null = null
let friendsTimer: number | null = null

// Formatted timer
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Computed property to determine if the local timer should be paused
const isMySessionPaused = computed(() => {
  return firebaseFocusSession.value?.status === 'PAUSED'
})

onMounted(async () => {
  try {
    await focusStore.fetchActiveFocusSession()
    if (!focusSession.value) {
      router.push({ name: 'todo' })
      return
    }

    const currentUserId = (await getCurrentUser())?.uid
    if (!currentUserId) {
      router.push({ name: 'todo' })
      return
    }

    // Subscribe to session data for real-time updates
    const mySessionRef = dbRef(db, `focusSessions/${focusSession.value.id}`)
    onValue(mySessionRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        isInitialLoad.value = false;


        firebaseFocusSession.value = data;
        const status = data.status;
        const elapsedSeconds = data.elapsedSeconds ?? 0;
        const plannedDuration = data.duration * 60;

        if (status === 'FOCUSING') {
          stopTimer()
          const now = dayjs()
          const startedAt = dayjs(data.startedAt)
          const timeSinceResume = now.diff(startedAt, 'second')
          timeLeft.value = Math.max(0, plannedDuration - (elapsedSeconds + timeSinceResume))
          startTimer()
        } else if (status === 'PAUSED') {
          timeLeft.value = Math.max(0, plannedDuration - elapsedSeconds)
          stopTimer()
        }
      } else {
        if (!isInitialLoad.value) {
            handleTimerEnd();
        }
      }
    })

    // Fetch and subscribe to friends' data
    const userRef = dbRef(db, `activeUsers/${currentUserId}`)
    const userSnap = await get(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.val()
      const groupsData = userData.groups
      let groupIds: string[] = []
      if (Array.isArray(groupsData)) {
        groupIds = groupsData.reduce((acc, val, index) => {
          if (val === true) acc.push(index.toString())
          return acc
        }, [] as string[])
      } else if (typeof groupsData === 'object' && groupsData !== null) {
        groupIds = Object.keys(groupsData)
      }
      if (groupIds.length > 0) {
        subscribeToFriends(groupIds, currentUserId)
      }
    }
  } catch (e) {
    console.error('Failed to fetch focus session or user data', e)
    router.push({ name: 'todo' })
  }
})

function handleTimerEnd() {
  if (focusSession.value?.id) {
    focusStore
      .endFocusSession()
      .then(() => {
        showCompletionModal.value = true
      })
      .catch(() => {
        alert('Failed to end session properly.')
        router.push({ name: 'todo' })
      })
  } else {
    router.push({ name: 'todo' })
  }
}

function startTimer() {
  if (timer) return
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      handleTimerEnd()
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startFriendsTimer() {
  if (friendsTimer) return
  friendsTimer = setInterval(() => {
    selectedFriends.value.forEach((friend) => {
      if (friend.status === 'FOCUSING' && friend.timeLeft > 0) {
        friend.timeLeft--
      }
    })
  }, 1000)
}

async function togglePause() {
  const sessionId = focusSession.value?.id
  if (!sessionId) return

  if (isMySessionPaused.value) {
    await focusStore.resumeFocusSession(sessionId)
  } else {
    await focusStore.pauseFocusSession(sessionId)
  }
}

async function closeFocus() {
  if (focusSession.value?.id) {
    try {
      await focusStore.endFocusSession()
    } catch {
      alert('Failed to end session properly.')
    }
  }
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  router.push({ name: 'todo' })
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (friendsTimer) clearInterval(friendsTimer)
  if (frameInterval) {
    clearInterval(frameInterval)
    frameInterval = null
  }
})

// --- Friends Panel ---
const showFriendPanel = ref(false)
type FriendItem = {
  id: string
  name: string
  image: string
  timeLeft: number
  status?: string
  sessionDuration?: number
}
const onlineFriends = ref<FriendItem[]>([])

watch(
  onlineFriends,
  (newFriendsList) => {
    selectedFriends.value.forEach((selectedFriend, index) => {
      const updatedData = newFriendsList.find((f) => f.id === selectedFriend.id)
      if (updatedData) {
        selectedFriends.value[index] = { ...selectedFriend, ...updatedData }
      }
    })
  },
  { deep: true },
)

function subscribeToFriends(groupIds: string[], currentUserId: string) {
  groupIds.forEach((groupId) => {
    const groupRef = dbRef(db, `activeGroups/${groupId}`)
    onValue(groupRef, (snapshot) => {
      const members = snapshot.val() || {}
      const memberIds = Object.keys(members).filter((uid) => uid !== currentUserId)

      onlineFriends.value = memberIds.map((uid) => ({
        id: uid,
        name: 'Loading...',
        image: '',
        timeLeft: 0,
        status: 'UNKNOWN',
        sessionDuration: 0,
      }))

      memberIds.forEach((uid) => {
        const userRef = dbRef(db, `activeUsers/${uid}`)
        onValue(userRef, (snap) => {
          const userData = snap.val()
          const friendIndex = onlineFriends.value.findIndex((f) => f.id === uid)
          if (!userData || friendIndex === -1) return

          onlineFriends.value[friendIndex].name = userData.name
          onlineFriends.value[friendIndex].image = userData.image || defaultImage

          if (userData.focusSessionId) {
            const sessionRef = dbRef(db, `focusSessions/${userData.focusSessionId}`)
            onValue(sessionRef, (sessionSnap) => {
              const session = sessionSnap.val()
              const idx = onlineFriends.value.findIndex((f) => f.id === uid)
              if (!session || idx === -1) return

              const plannedDuration = session.duration * 60
              const elapsedSeconds = session.elapsedSeconds ?? 0
              let remainingTime = 0

              if (session.status === 'FOCUSING') {
                const now = dayjs()
                const startedAt = dayjs(session.startedAt)
                const timeSinceResume = now.diff(startedAt, 'second')
                remainingTime = Math.max(0, plannedDuration - (elapsedSeconds + timeSinceResume))
              } else if (session.status === 'PAUSED') {
                remainingTime = Math.max(0, plannedDuration - elapsedSeconds)
              } else {
                remainingTime = 0
              }

              onlineFriends.value[idx].timeLeft = remainingTime
              onlineFriends.value[idx].status = session.status
              onlineFriends.value[idx].sessionDuration = plannedDuration

              startFriendsTimer()
            })
          } else {
            onlineFriends.value[friendIndex].status = 'ONLINE'
            onlineFriends.value[friendIndex].timeLeft = 0
            onlineFriends.value[friendIndex].sessionDuration = 0
          }
        })
      })
    })
  })
}

function toggleFriendPanel() {
  showFriendPanel.value = !showFriendPanel.value
}

function closeFriendPanel() {
  showFriendPanel.value = false
}

const selectedFriends = ref<FriendItem[]>([])

function addFriendToScreen(friend: FriendItem) {
  if (selectedFriends.value.some((f) => f.id === friend.id)) return
  selectedFriends.value.push({ ...friend })
}

function removeFriendFromScreen(friendId: string) {
  const index = selectedFriends.value.findIndex((f) => f.id === friendId)
  if (index !== -1) {
    selectedFriends.value.splice(index, 1)
  }
}

const formatFriendTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatSessionType(type: SessionType | string): string {
  if (!type) return ''
  const words = type.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase())
  return words.join(' ')
}

const showEndSessionModal = ref(false)
const showCompletionModal = ref(false)

function confirmEndSession() {
  showEndSessionModal.value = true
}

function cancelEndSession() {
  showEndSessionModal.value = false
}

async function endSessionConfirmed() {
  showEndSessionModal.value = false
  await closeFocus()
}

function closeCompletionModal() {
  showCompletionModal.value = false
  router.push({ name: 'todo' })
}

function getEggImageForFriend(friend: FriendItem) {
  const total = friend.sessionDuration ?? 0
  const rem = friend.timeLeft ?? 0
  const idx = getFrameIndexFor(rem, total)
  return eggs[idx] ?? eggs[0]
}

function getEggImageForUser() {
  const idx = currentFrameIndex.value
  return eggs[idx] ?? eggs[0]
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
        class="p-2 rounded-full hover:bg-slate-200 transition-colors"
        aria-label="Close Focus Mode"
        @click="confirmEndSession"
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
                  :src="friend.image"
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

    <main class="flex flex-col items-center text-center mt-22">
      <h1 class="text-7xl md:text-8xl font-bold text-slate-700 tabular-nums">
        {{ formattedTime }}
      </h1>
      <p class="text-xl md:text-2xl text-slate-500 mt-2">
        Focusing on:
        <span class="font-semibold">{{ taskName }} ({{ formatSessionType(taskType) }})</span>
      </p>
    </main>

    <footer class="flex flex-col items-center justify-end gap-20">
      <div class="flex flex-row justify-center items-end gap-6 flex-wrap">
        <div class="flex flex-col items-center text-center">
          <div
            class="sprite"
            :style="{
              backgroundImage: `url(${getEggImageForUser()})`,
              animationPlayState: isMySessionPaused ? 'paused' : 'running',
            }"
          ></div>
          <p class="text-md font-semibold text-slate-700 -mt-10">You</p>
          <p class="text-sm font-mono text-slate-500 bg-slate-200/70 rounded px-2 py-0.5 invisible">
            &nbsp;
          </p>
        </div>

        <div v-for="friend in selectedFriends" :key="friend.id" class="flex flex-col items-center">
          <div
            class="sprite"
            :style="{
              backgroundImage: `url(${getEggImageForFriend(friend)})`,
              animationPlayState: friend.status === 'FOCUSING' ? 'running' : 'paused',
            }"
          ></div>
          <p class="mt-2 text-md font-semibold text-slate-600">{{ friend.name }}</p>
          <p class="text-sm font-mono text-slate-500 bg-slate-200/70 rounded px-2 py-0.5">
            <span v-if="friend.status === 'PAUSED'">⏸ Paused</span>
            <span v-else-if="friend.status === 'FOCUSING'">{{
              formatFriendTime(friend.timeLeft)
            }}</span>
            <span v-else>&nbsp;</span>
          </p>
        </div>
      </div>

      <button
        @click="togglePause"
        class="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-1"
      >
        <template v-if="isMySessionPaused">
          <PlayIcon class="h-6 w-6 text-green-500" />
          <span class="text-lg font-semibold text-slate-700">Resume</span>
        </template>
        <template v-else>
          <PauseIcon class="h-6 w-6 text-orange-500" />
          <span class="text-lg font-semibold text-slate-700">Pause</span>
        </template>
      </button>
    </footer>

    <transition name="fade-in">
      <div
        v-if="showEndSessionModal"
        class="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-left border border-slate-200 animate-fade-in"
        >
          <div class="flex items-start gap-4">
            <ExclamationTriangleIcon class="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Are you sure?</h2>
              <p class="text-md text-slate-500 mt-2">
                Ending the session will save your progress, but your focus time will be shorter than
                scheduled.
              </p>
            </div>
          </div>

          <div class="flex justify-between gap-4 mt-6">
            <button
              @click="cancelEndSession"
              class="flex-1 px-4 py-3 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="endSessionConfirmed"
              class="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-in">
      <div
        v-if="showCompletionModal"
        class="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-200 animate-fade-in"
        >
          <div class="flex flex-col items-center gap-4">
            <TrophyIcon class="h-16 w-16 text-yellow-500" />
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Session Complete!</h2>
              <p class="text-md text-slate-500 mt-2">
                Great work focusing on <strong class="text-slate-700">{{ taskName }}</strong
                >. Time for a well-deserved break!
              </p>
            </div>
          </div>

          <div class="mt-6">
            <button
              @click="closeCompletionModal"
              class="w-full px-4 py-3 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors shadow-md"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.sprite {
  width: 204px;
  height: 326px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  animation: shake 0.5s ease-in-out infinite; /* สำหรับสั่น */
}

@keyframes shake {
  0%,
  100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-2px, 1px);
  }
  50% {
    transform: translate(2px, -1px);
  }
  75% {
    transform: translate(-1px, 2px);
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
.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.3s ease;
}

.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>
