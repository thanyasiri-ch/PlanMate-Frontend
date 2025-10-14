<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/useSessionStore'
import { useFocusSessionStore } from '@/stores/focusSession'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import book1 from '../assets/images/book1.png'
import book2 from '../assets/images/book2.png'
import book3 from '../assets/images/book3.png'
import { SessionType, type SessionDTO } from '@/types'
import { useStudySetupStore } from '@/stores/studySetup'
import ModalConfirm from '@/components/ModalConfirm.vue'

const setupStore = useStudySetupStore()
const todoStore = useSessionStore()
const focusStore = useFocusSessionStore()
const router = useRouter()

const selectedTaskId = ref<string | null>(null)
const isFocusing = ref(false)
const TASK_WEIGHT = 50
const HOUR_WEIGHT = 30

type EnrichedSession = SessionDTO & {
  courseCode: string
  courseName: string
  topicName: string | null
  assignmentName: string | null
  displayName: string
  progress: string
  type: SessionDTO['type']
}

const selectedDateGroup = ref<'overdue' | 'today' | 'tomorrow' | 'upcoming'>('today')

const sessionMap = ref<Record<'overdue' | 'today' | 'tomorrow' | 'upcoming', EnrichedSession[]>>({
  overdue: [],
  today: [],
  tomorrow: [],
  upcoming: [],
})

// Modal alert state
const showModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')

const handleModalClose = () => {
  showModal.value = false
  if (modalTitle.value === 'You already have an active focus session.') {
    router.push('/focus-mode')
  }
}

const motivationMessages = [
  "Time to grow. Let's focus on",
  'Ready to start? Get ready for',
  "Let's get it done! Focus on",
  'A little progress each day adds up to big results. Focus on',
  "Don't stop until you're proud. Let's focus on",
]

const randomMotivation = ref(motivationMessages[0])
const frames = [book1, book2, book3]
const currentFrame = ref(0)

const tasks = computed(() => sessionMap.value[selectedDateGroup.value] || [])

const currentTask = computed(() => tasks.value.find((t) => t.sessionId === selectedTaskId.value))

const currentTaskProgress = computed(() => {
  if (!currentTask.value) return '0/0'
  const { sessionNumber, totalSessionsInGroup } = currentTask.value
  return `${sessionNumber}/${totalSessionsInGroup}`
})

const progressDots = computed(() => (taskProgress: string) => {
  const [completed, total] = taskProgress.split('/').map(Number)
  return Array.from({ length: total }, (_, i) => i < completed)
})

const completedTasks = computed(() => {
  const groups: Record<string, ReturnType<typeof todoStore.enrichSession>[]> = {}
  for (const task of todoStore.completedSessions) {
    const courseKey = task.courseName || 'No Course'
    if (!groups[courseKey]) groups[courseKey] = []
    groups[courseKey].push(task)
  }
  return Object.entries(groups).map(([courseName, tasks]) => ({
    courseName,
    tasks: tasks.sort((a, b) => (a.start || '').localeCompare(b.start || '')),
  }))
})

onMounted(async () => {
  // Wait for course/term/topic data to be available
  await setupStore.fetchAndSetTerm()

  // Now safe to fetch and enrich sessions
  await todoStore.fetchSessions()

  // Assign sessions to local state (enrich with required properties)
  const enrichSession = (session: any): EnrichedSession => ({
    ...session,
    courseCode: session.courseCode ?? '',
    courseName: session.courseName ?? '',
    topicName: session.topicName ?? null,
    assignmentName: session.assignmentName ?? null,
    displayName: session.displayName ?? '',
    progress: `${session.sessionNumber}/${session.totalSessionsInGroup}`,
    duration: session.duration ?? '',
  })

  function sortSessionsByDateAndTime(sessions: SessionDTO[]) {
    return sessions
      .slice()
      .map(enrichSession)
      .sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '')
        if (dateCompare !== 0) return dateCompare
        return (a.start || '').localeCompare(b.start || '')
      })
  }

  sessionMap.value = {
    overdue: sortSessionsByDateAndTime(todoStore.sessions.overdue),
    today: sortSessionsByDateAndTime(todoStore.sessions.today),
    tomorrow: sortSessionsByDateAndTime(todoStore.sessions.tomorrow),
    upcoming: sortSessionsByDateAndTime(todoStore.sessions.upcoming),
  }

  const randomIndex = Math.floor(Math.random() * motivationMessages.length)
  randomMotivation.value = motivationMessages[randomIndex]
})

watch(selectedDateGroup, (newVal) => {
  console.log(`[DEBUG] Switched to group: ${newVal}`, sessionMap.value[newVal])
})

const animateOnce = () => {
  currentFrame.value = 0
  let frameIndex = 1
  const animInterval = setInterval(() => {
    if (frameIndex < frames.length) {
      currentFrame.value = frameIndex
      frameIndex++
    } else {
      clearInterval(animInterval)
    }
  }, 400)
}

watch(selectedTaskId, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null) {
    animateOnce()
  }
})

const startFocus = async () => {
  if (!selectedTaskId.value) return

  const task = currentTask.value
  if (!task) return

  isFocusing.value = true
  try {
    await focusStore.startFocusSession(selectedTaskId.value)

    todoStore.setEnrichedSession(task)
    router.push({ path: '/focus-mode' })
  } catch (err: any) {
    // extract backend error message
    const errorMsg = err.response?.data || err.message || 'Error starting focus session'

    if (errorMsg === 'You already have an active focus session.') {
      modalTitle.value = errorMsg
      modalMessage.value = 'Go to the focus page to continue?'
      showModal.value = true
    } else {
      modalTitle.value = 'Error'
      modalMessage.value = 'Unable to start session. Please try again.'
      showModal.value = true
    }
  } finally {
    isFocusing.value = false
  }
}

const groupedTasks = computed(() => {
  const pendingGroups: Record<string, EnrichedSession[]> = {}

  for (const task of tasks.value) {
    if (task.isCompleted == false) {
      // group by date
      const dateKey = task.date || 'Undated'
      if (!pendingGroups[dateKey]) {
        pendingGroups[dateKey] = []
      }
      pendingGroups[dateKey].push(task)
    }
  }

  return {
    pending: Object.entries(pendingGroups).map(([date, tasks]) => ({
      date,
      tasks: tasks.sort((a, b) => (a.start || '').localeCompare(b.start || '')),
    })),
  }
})

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function scrollToCompleted() {
  const section = document.getElementById('completed-section')
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
}

function getSessionTypeStyles(type: SessionType) {
  switch (type) {
    case SessionType.CORE_STUDY:
      return 'bg-blue-100 text-blue-800'
    case SessionType.ASSIGNMENT:
      return 'bg-orange-100 text-orange-800'
    case SessionType.OVERVIEW:
      return 'bg-purple-100 text-purple-800'
    case SessionType.FINAL_REVIEW:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatSessionType(type: SessionType): string {
  const words = type.split('_').map((word) => {
    return word.charAt(0) + word.slice(1).toLowerCase()
  })
  return words.join(' ')
}

function calculatePotentialPoints(session: EnrichedSession) {
  if (!session?.duration) return 0
  const focusHours = session.duration / 60
  const rawPoints = TASK_WEIGHT + focusHours * HOUR_WEIGHT
  return Number(rawPoints.toFixed(2))
}
</script>

<template>
  <DefaultLayout>
    <div class="h-full overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-7 gap-6 h-full px-10 pt-4 pb-8 box-border">
        <!-- Task List -->
        <section
          class="col-span-3 bg-white rounded-2xl p-6 flex flex-col h-full overflow-auto shadow-md"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-[20px] font-semibold text-gray-800">To-do list</h2>

            <div class="flex gap-3 items-center">
              <!-- Completed navigation -->
              <button
                v-if="completedTasks.length > 0"
                @click="scrollToCompleted"
                class="text-sm font-medium text-blue-600 hover:font-semibold transform transition duration-200 ease-in-out hover:scale-105 active:scale-95"
              >
                Completed
              </button>

              <!-- Date filter -->
              <div class="relative inline-block">
                <select
                  v-model="selectedDateGroup"
                  class="appearance-none block w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-2 pr-8 rounded-xl shadow-sm text-sm text-gray-700 cursor-pointer transition-colors"
                >
                  <option value="overdue">Overdue</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="upcoming">Upcoming</option>
                </select>

                <div
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                >
                  <svg
                    class="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-4 text-[15px] text-gray-700 overflow-auto">
            <!-- Show no session message -->
            <div
              v-if="groupedTasks.pending.length === 0"
              class="flex items-center justify-center h-40 text-gray-400 text-sm"
            >
              No sessions for {{ selectedDateGroup }}
            </div>

            <!-- Pending tasks by date -->
            <div v-for="{ date, tasks } in groupedTasks.pending" :key="date">
              <div
                class="bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full w-fit mb-2 mt-4"
              >
                {{ formatFullDate(date) }}
              </div>

              <label
                v-for="task in tasks"
                :key="task.sessionId"
                class="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors mb-2"
                :class="{
                  'bg-gray-100 shadow-sm': selectedTaskId === task.sessionId,
                  'hover:bg-gray-50': selectedTaskId !== task.sessionId,
                }"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <input
                    type="radio"
                    name="task"
                    :value="task.sessionId"
                    v-model="selectedTaskId"
                    class="accent-black h-4 w-4"
                  />
                  <div class="flex flex-col truncate w-full max-w-[250px]">
                    <span class="font-semibold text-gray-800 truncate block">
                      {{ task.start }} - {{ task.end }}
                      <span class="mx-2 text-gray-300">|</span>
                      {{ task.displayName || 'Untitled' }}
                    </span>
                    <span class="text-sm text-gray-500 truncate block">
                      {{ task.courseName }}
                    </span>
                  </div>
                </div>

                <div>
                  <div
                    class="text-xs text-gray-500 p-1 px-2 mb-2 rounded-xl"
                    :class="getSessionTypeStyles(task.type)"
                  >
                    {{ formatSessionType(task.type) }}
                  </div>

                  <div class="flex justify-end gap-1">
                    <div
                      v-for="(isCompleted, index) in progressDots(
                        `${task.sessionNumber}/${task.totalSessionsInGroup}`,
                      )"
                      :key="index"
                      class="w-3 h-3 rounded-full"
                      :class="{ 'bg-[#7486FB]': isCompleted, 'bg-gray-300': !isCompleted }"
                    ></div>
                  </div>
                </div>
              </label>
            </div>

            <!-- Completed task by course -->
            <div id="completed-section" class="mt-6">
              <h3
                v-if="completedTasks.length > 0"
                class="text-gray-700 font-semibold text-base mb-2 pb-1 border-b-2 border-gray-200"
              >
                Completed Sessions
              </h3>

              <div v-for="{ courseName, tasks } in completedTasks" :key="courseName" class="mb-4">
                <div class="text-gray-500 font-medium mb-2">{{ courseName }}</div>

                <label
                  v-for="task in tasks"
                  :key="task.sessionId"
                  class="flex items-center justify-between p-4 mb-2 rounded-xl bg-green-50 border border-green-200"
                >
                  <!-- Left -->
                  <div class="flex items-center gap-3 overflow-hidden">
                    <input type="checkbox" checked disabled class="accent-green-500 h- w-4" />
                    <div class="flex flex-col truncate w-full max-w-[250px]">
                      <span class="font-semibold text-green-800 truncate block">
                        {{ task.start }} - {{ task.end }}
                        <span class="mx-2 text-green-300">|</span>
                        {{ task.displayName || 'Untitled' }}
                      </span>
                      <span class="text-sm text-green-500 truncate block">
                        {{ task.courseName }}
                      </span>
                    </div>
                  </div>

                  <!-- Right -->
                  <div class="flex flex-col items-end">
                    <div
                      class="text-xs text-gray-500 p-1 px-2 mb-2 rounded-xl"
                      :class="getSessionTypeStyles(task.type)"
                    >
                      {{ formatSessionType(task.type) }}
                    </div>
                    <div class="flex justify-end gap-1">
                      <div
                        v-for="(isCompleted, index) in progressDots(
                          `${task.sessionNumber}/${task.totalSessionsInGroup}`,
                        )"
                        :key="index"
                        class="w-3 h-3 rounded-full"
                        :class="{ 'bg-[#277851]': isCompleted, 'bg-gray-300': !isCompleted }"
                      ></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Focus Preview & Start -->
        <div class="col-span-4 flex flex-col items-center justify-center h-full">
          <div v-if="!selectedTaskId" class="text-gray-500 text-lg text-center animate-fade-in">
            <p>Select a task from the left panel to start Focus Mode</p>
          </div>

          <div v-else class="text-center space-y-8 animate-fade-in">
            <p class="text-xl font-medium text-gray-600">{{ randomMotivation }}</p>
            <div class="space-y-4">
              <h1 class="text-5xl font-extrabold text-[#4455c0e0]">
                {{ currentTask?.displayName || 'Untitled' }}
              </h1>
              <h3 class="text-2xl font-extrabold text-[#343e83e0]">
                {{ currentTask?.duration }} mins ({{
                  currentTask?.type ? formatSessionType(currentTask.type) : 'Session'
                }})
              </h3>
              <div class="flex justify-center items-center gap-2">
                <div
                  v-for="(isCompleted, index) in progressDots(currentTaskProgress)"
                  :key="index"
                  class="w-4 h-4 rounded-full shadow-sm"
                  :class="{ 'bg-[#4455c0d7]': isCompleted, 'bg-gray-100': !isCompleted }"
                ></div>
              </div>
              <p class="text-lg text-green-600 font-semibold">
                Complete this session to earn +{{ calculatePotentialPoints(currentTask!) }} points!
              </p>
            </div>

            <div class="book-frame-container">
              <img :src="frames[currentFrame]" alt="Books animation" class="book-frame-image" />
            </div>

            <button
              @click="startFocus"
              :disabled="isFocusing"
              class="relative w-36 h-36 mt-16 rounded-full bg-[#fdecc3d6] hover:bg-[#f8dd9ad3] transition-colors"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="w-32 h-32 rounded-full bg-[#FBCC69] flex items-center justify-center text-white text-xl font-bold"
                >
                  Start Focus
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>

  <!-- Active session modal -->
  <ModalConfirm
    v-if="showModal && modalTitle === 'You already have an active focus session.'"
    :title="modalTitle"
    :message="modalMessage"
    confirm-text="Continue Focusing"
    cancel-text="Stay Here"
    @confirm="handleModalClose"
    @cancel="showModal = false"
  />

  <!-- Error modal (red buttons) -->
  <ModalConfirm
    v-else-if="showModal && modalTitle === 'Error'"
    :title="modalTitle"
    :message="modalMessage"
    confirm-text="OK"
    :confirm-color="'#FF4433'"
    :confirm-hover-color="'#E03B2A'"
    :cancel-text="''"
    @confirm="showModal = false"
  />
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
.book-frame-container {
  width: 200px;
  height: 188px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}
.book-frame-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
</style>
