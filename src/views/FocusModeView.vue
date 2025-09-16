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
import { useFriends } from '@/stores/useFriends'
import type { Invitation, SessionType } from '@/types'
import dayjs from 'dayjs'
import { db } from '@/firebase/firebase.ts'
import { ref as dbRef, onValue, get } from 'firebase/database'
import { getCurrentUser } from '@/services/auth'
import FriendsPanel from '@/components/FriendsPanel.vue'
import EggSprite from '@/components/EggSprite.vue'
import ModalAlert from '@/components/ModalAlert.vue'
import { storeToRefs } from 'pinia'

const router = useRouter()
const focusStore = useFocusSessionStore()
const friendsStore = useFriends()

// --- Session State ---
const firebaseFocusSession = ref<any | null>(null)
const focusSession = computed(() => focusStore.activeSession)
const isInitialLoad = ref(true)

// --- Timer State ---
const timeLeft = ref(0)
let timer: number | null = null

// --- Egg Animation ---
const currentFrame = ref(0)
let frameInterval: number | null = null

// --- Computed Session Helpers ---
const totalSeconds = computed(() => {
  if (firebaseFocusSession.value?.duration) {
    return firebaseFocusSession.value.duration * 60
  }
  return 0
})

// --- Points Calculations ---
const TASK_WEIGHT = 10
const HOUR_WEIGHT = 5

const earnedPoints = computed(() => {
  if (isShortSession.value) return 0
  const focusHours = elapsedSeconds.value / 3600
  const rawPoints = focusHours * HOUR_WEIGHT
  return Number(rawPoints.toFixed(2))
})

const potentialFullPoints = computed(() => {
  const focusHours = (focusSession.value?.session?.duration || 0) / 60
  return Number((TASK_WEIGHT + focusHours * HOUR_WEIGHT).toFixed(2))
})

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const isMySessionPaused = computed(() => firebaseFocusSession.value?.status === 'PAUSED')

const elapsedSeconds = computed(() => {
  if (!firebaseFocusSession.value) return 0
  const planned = (firebaseFocusSession.value.duration || 0) * 60
  return Math.max(0, planned - timeLeft.value)
})

const isShortSession = computed(() => elapsedSeconds.value < 300) // less than 5 min

function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : 'less than a minute'
}

// --- Egg Frame Logic ---
function getFrameIndexFor(remainingSec: number, totalSec: number): number {
  if (totalSec <= 0) return 11

  const elapsed = Math.max(0, totalSec - remainingSec)
  const phaseDuration = totalSec / 4
  const phase = Math.min(3, Math.floor(elapsed / (phaseDuration || 1)))
  const nowMs = Date.now()

  if (phase === 0) return Math.floor(nowMs / 400) % 3
  if (phase === 1) return 3 + (Math.floor(nowMs / 400) % 3)
  if (phase === 2) {
    const progress = (elapsed - phaseDuration * 2) / (phaseDuration || 1)
    return 6 + Math.min(2, Math.floor(Math.max(0, Math.min(1, progress)) * 3))
  }
  if (remainingSec <= 0) return 11
  const progress4 = (elapsed - phaseDuration * 3) / (phaseDuration || 1)
  return 9 + Math.min(2, Math.floor(Math.max(0, Math.min(1, progress4)) * 3))
}

const currentFrameIndex = computed(() => getFrameIndexFor(timeLeft.value, totalSeconds.value))

watch(currentFrameIndex, (v) => (currentFrame.value = v))

onMounted(() => {
  frameInterval = window.setInterval(() => {
    currentFrame.value = currentFrameIndex.value
  }, 200)
})

onUnmounted(() => {
  if (frameInterval) clearInterval(frameInterval)
  if (timer) clearInterval(timer)
})

// --- Session Setup ---
onMounted(async () => {
  try {
    await focusStore.fetchActiveFocusSession()
    if (!focusSession.value) return router.push({ name: 'todo' })

    const currentUserId = (await getCurrentUser())?.uid
    if (!currentUserId) return router.push({ name: 'todo' })

    // Subscribe to session updates
    const mySessionRef = dbRef(db, `focusSessions/${focusSession.value.id}`)
    onValue(mySessionRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        if (!isInitialLoad.value) handleTimerEnd()
        return
      }
      isInitialLoad.value = false
      firebaseFocusSession.value = data

      const elapsedSeconds = data.elapsedSeconds ?? 0
      const plannedDuration = data.duration * 60

      if (data.status === 'FOCUSING') {
        stopTimer()
        const now = dayjs()
        const startedAt = dayjs(data.startedAt)
        const timeSinceResume = now.diff(startedAt, 'second')
        timeLeft.value = Math.max(0, plannedDuration - (elapsedSeconds + timeSinceResume))
        startTimer()
      } else if (data.status === 'PAUSED') {
        timeLeft.value = Math.max(0, plannedDuration - elapsedSeconds)
        stopTimer()
      }
    })

    // Subscribe to friends
    const userRef = dbRef(db, `activeUsers/${currentUserId}`)
    const userSnap = await get(userRef)
    if (userSnap.exists()) {
      const groupsData = userSnap.val().groups
      let groupIds: string[] = []
      if (Array.isArray(groupsData)) {
        groupIds = groupsData
          .map((val, idx) => (val === true ? idx.toString() : null))
          .filter((v): v is string => v !== null)
      } else if (typeof groupsData === 'object') {
        groupIds = Object.keys(groupsData)
      }
      if (groupIds.length > 0) friendsStore.subscribeToFriends(groupIds, currentUserId)
    }
  } catch (e) {
    console.error('Failed to fetch focus session or user data', e)
    router.push({ name: 'todo' })
  }
})

// --- Timer Controls ---
function startTimer() {
  if (timer) return
  timer = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else {
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

function handleTimerEnd() {
  if (focusSession.value?.id) {
    focusStore
      .endFocusSession()
      .then(() => (showCompletionModal.value = true))
      .catch(() => {
        alert('Failed to end session properly.')
        router.push({ name: 'todo' })
      })
  } else {
    router.push({ name: 'todo' })
  }
}

// --- User Actions ---
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
  stopTimer()
  router.push({ name: 'todo' })
}

// --- Formatting Helpers ---
function formatSessionType(type: SessionType | string): string {
  if (!type) return ''
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

// --- Modal State ---
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

// --- Focus Request Modal ---
const requestingFriend = ref<Invitation | null>(null) // invitation sent TO me
const pendingInvite = ref<{ id: string; name: string } | null>(null) // invitation I sent
const { activeSession, selectedFriends } = storeToRefs(friendsStore)
const inSharedRoom = computed(() => selectedFriends.value.length > 0 || !!activeSession.value)

async function handleRequestFocus(friend: any) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return

  try {
    await friendsStore.inviteFriend(friend.id)
    // Optimistic UI for inviter → show "invite sent"
    pendingInvite.value = { id: friend.id, name: friend.name }
    // auto-hide after 5s
    setTimeout(() => (pendingInvite.value = null), 5000)
  } catch {
    alert('Failed to send invite.')
  }
}

async function acceptRequestHandler() {
  if (!requestingFriend.value) return
  await friendsStore.joinRoom(requestingFriend.value.roomId)
  await friendsStore.declineInvitation(requestingFriend.value.id) // clean up
  requestingFriend.value = null
}

async function declineRequestHandler() {
  if (!requestingFriend.value) return
  await friendsStore.declineInvitation(requestingFriend.value.id)
  requestingFriend.value = null
}

async function handleLeaveRoom() {
  const user = await getCurrentUser()
  if (!user) return

  const userRef = dbRef(db, `activeUsers/${user.uid}`)
  const snapshot = await get(userRef)

  if (!snapshot.exists()) return

  const { sharedRoomId } = snapshot.val()
  if (sharedRoomId) {
    await friendsStore.leaveRoom(sharedRoomId)
  }
}

onMounted(async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return

  friendsStore.subscribeToInvitations()

  friendsStore.autoDetectSharedRoom()

  watch(
    () => friendsStore.invitations,
    (invitations) => {
      if (invitations.length > 0) {
        // Always pick the latest incoming invite
        const latest = invitations[invitations.length - 1]
        requestingFriend.value = latest
      } else {
        requestingFriend.value = null
      }
    },
    { immediate: true, deep: true },
  )
})

// --- Task Info ---
const taskName = computed(() => focusSession.value?.displayName ?? 'Unnamed Task')
const taskType = computed(() => focusSession.value?.sessionType ?? 'Unknown Type')
</script>

<template>
  <div class="flex flex-col h-screen bg-sky-50 text-slate-800 p-6 md:p-8 relative overflow-hidden">
    <div class="absolute top-6 left-6 right-6 flex justify-between items-center">
      <button
        @click="friendsStore.toggleFriendPanel"
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

    <!-- Friends Panel -->
    <FriendsPanel
      :show="friendsStore.showFriendPanel"
      :online-friends="friendsStore.onlineFriends"
      :selected-friends="friendsStore.selectedFriends"
      @close="friendsStore.closeFriendPanel"
      @request-focus="handleRequestFocus"
      @remove-friend="friendsStore.removeFriendFromScreen"
    />

    <main class="flex flex-col items-center text-center mt-22">
      <h1 class="text-7xl md:text-8xl font-bold text-slate-700 tabular-nums">
        {{ formattedTime }}
      </h1>
      <p class="text-xl md:text-2xl text-slate-500 mt-2">
        Focusing on:
        <span class="font-semibold">{{ taskName }} ({{ formatSessionType(taskType) }})</span>
      </p>
    </main>

    <!-- Focus Request Modal -->
    <div v-if="requestingFriend" class="fixed top-8 left-1/2 -translate-x-1/2 z-50">
      <div class="inline-block bg-black/30 backdrop-blur-lg rounded-4xl px-3 py-2 shadow-lg">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 flex items-center justify-center bg-sky-500 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="text-base font-medium text-white">
              {{ requestingFriend.fromName }} is asking to study together.
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="declineRequestHandler"
              class="px-4 py-1.5 text-sm rounded-2xl bg-gray-200/80 text-gray-900 hover:bg-gray-300/90"
            >
              Decline
            </button>
            <button
              @click="acceptRequestHandler"
              class="px-4 py-1.5 text-sm rounded-2xl bg-sky-500 text-white hover:bg-sky-600"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Invite Toast (only for inviter) -->
    <div v-if="pendingInvite" class="fixed top-8 right-8 z-50">
      <div class="bg-sky-500 text-white px-4 py-2 rounded-2xl shadow-lg">
        Invite sent to <strong>{{ pendingInvite.name }}</strong> 🎉
      </div>
    </div>

    <footer class="flex flex-col items-center justify-end gap-10">
      <div
        v-if="firebaseFocusSession"
        class="flex flex-row justify-center items-end gap-6 flex-wrap"
      >
        <!-- User Egg -->
        <EggSprite
          is-user
          :time-left="timeLeft"
          :total-seconds="totalSeconds"
          :status="isMySessionPaused ? 'PAUSED' : 'FOCUSING'"
          :in-shared-room="inSharedRoom"
          @leave="handleLeaveRoom"
        />

        <!-- Friends’ Eggs -->
        <EggSprite
          v-for="friend in friendsStore.selectedFriends"
          :key="friend.id"
          :friend="friend"
          :status="friend.status"
          :time-left="friend.timeLeft"
          :total-seconds="friend.sessionDuration ? friend.sessionDuration * 60 : 0"
          :timer="
            friend.status === 'PAUSED'
              ? '⏸ Paused'
              : friend.status === 'FOCUSING'
                ? friendsStore.formatFriendTime(friend.timeLeft)
                : friend.name
          "
        />
      </div>

      <!-- Loading Sprite -->
      <div v-else class="flex flex-row justify-center items-end gap-6 flex-wrap">
        <div class="sprite bg-slate-100 rounded-lg animate-pulse"></div>
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

    <!-- End Session Modal -->
    <transition name="fade-in">
      <div
        v-if="showEndSessionModal"
        class="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-left border border-slate-200 animate-fade-in"
        >
          <div class="flex items-start gap-4">
            <!-- Switch icon based on isShortSession -->
            <component
              :is="isShortSession ? ExclamationTriangleIcon : TrophyIcon"
              :class="
                isShortSession
                  ? 'h-8 w-8 text-red-500 flex-shrink-0 mt-1'
                  : 'h-8 w-8 text-yellow-500 flex-shrink-0 mt-1'
              "
            />
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Are you sure?</h2>
              <p class="text-md text-slate-500 mt-2">
                <template v-if="isShortSession">
                  Your focus time is
                  <span class="text-red-600 font-semibold">too short to be saved</span>. Ending now
                  will discard your progress.
                </template>
                <template v-else>
                  Ending now will save your progress, and you’ll earn
                  <strong class="text-slate-700">{{ formatMinutes(elapsedSeconds) }}</strong>
                  focus duration (+<strong class="text-green-600">{{ earnedPoints }}</strong> pts).
                </template>
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
              :class="
                isShortSession
                  ? 'flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md'
                  : 'flex-1 px-4 py-3 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors shadow-md'
              "
            >
              {{ isShortSession ? 'End Session' : 'Finish' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Completion Modal -->
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
            <div class="text-center">
              <h2 class="text-2xl font-bold text-slate-800">Session Complete!</h2>
              <p class="text-md text-slate-500 mt-2">
                Great work focusing on
                <strong class="text-slate-700">{{ taskName }}</strong
                >. Time for a well-deserved break!
              </p>

              <p class="text-lg font-semibold text-green-600 mt-4">
                +{{ potentialFullPoints }} pts earned!
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

  <!-- Error Alert -->
  <ModalAlert
    v-if="friendsStore.error"
    title="Error"
    :message="friendsStore.error"
    type="error"
    @close="friendsStore.error = ''"
  />
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
