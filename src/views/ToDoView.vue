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

const setupStore = useStudySetupStore()
const todoStore = useSessionStore()
const focusStore = useFocusSessionStore()
const router = useRouter()

const selectedTaskId = ref<string | null>(null)
const isFocusing = ref(false)

type EnrichedSession = SessionDTO & {
  courseCode: string
  courseName: string
  topicName: string | null
  assignmentName: string | null
  displayName: string
  progress: string
  type: SessionDTO['type']
}

const selectedDateGroup = ref<'today' | 'tomorrow' | 'upcoming'>('today')

const sessionMap = ref<Record<'today' | 'tomorrow' | 'upcoming', EnrichedSession[]>>({
  today: [],
  tomorrow: [],
  upcoming: [],
})

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
    // If your startFocusSession expects StartFocusSessionDTO,
    // pass the expected shape, example: { sessionId: string }
    await focusStore.startFocusSession({ sessionId: selectedTaskId.value })

    todoStore.setEnrichedSession(task)
    router.push({
      path: '/focus-mode',
    })
  } catch {
    alert('Error starting focus session')
  } finally {
    isFocusing.value = false
  }
}

const groupedTasks = computed(() => {
  const pendingGroups: Record<string, EnrichedSession[]> = {}
  const completedGroups: Record<string, EnrichedSession[]> = {}

  for (const task of tasks.value) {
    if (task.isCompleted) {
      // group by course name
      const courseKey = task.courseName || 'No Course'
      if (!completedGroups[courseKey]) {
        completedGroups[courseKey] = []
      }
      completedGroups[courseKey].push(task)
    } else {
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
    completed: Object.entries(completedGroups).map(([courseName, tasks]) => ({
      courseName,
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
              <button @click="scrollToCompleted" class="text-sm text-blue-600 hover:underline">
                Completed
              </button>

              <!-- Date filter -->
              <select
                v-model="selectedDateGroup"
                class="border border-gray-300 rounded-xl px-3 py-1 text-sm text-gray-600"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-4 text-[15px] text-gray-700 overflow-auto">
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
              <h3 class="text-gray-600 font-semibold text-sm mb-2">Completed Sessions</h3>

              <div
                v-for="{ courseName, tasks } in groupedTasks.completed"
                :key="courseName"
                class="mb-4"
              >
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
