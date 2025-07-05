<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue' // <-- Import ref
import { useGeneratedPlanStore } from '@/stores/generatedPlan'
import { useStudySetupStore } from '@/stores/studySetup'
import { SessionType, type SessionDTO } from '@/types'
import SessionEditModal from '@/components/SessionEditModal.vue' // <-- Import the modal

const planStore = useGeneratedPlanStore()
const setupStore = useStudySetupStore()

// --- NEW: State for controlling the modal ---
const isModalOpen = ref(false)
const editingSession = ref<SessionDTO | null>(null)

onMounted(() => {
  setupStore.fetchAndSetTerm().then(() => {
    planStore.fetchExistingSchedule()
  })
})

// --- NEW: Function to open the modal with the selected item ---
function openEditModal(item: SessionDTO) {
  editingSession.value = item
  isModalOpen.value = true
}

// --- NEW: Function to handle the 'save' event from the modal ---
function handleSave(updatedItem: SessionDTO) {
  if (updatedItem.isScheduled) {
    // If it's an existing session, update its time
    planStore.updateSessionTime({
      sessionId: updatedItem.sessionId,
      date: updatedItem.date,
      start: updatedItem.start,
    })
  } else {
    // If it's an unscheduled item, schedule it
    planStore.scheduleItemManually({
      sessionId: updatedItem.sessionId,
      date: updatedItem.date,
      start: updatedItem.start,
    })
  }
  closeModal()
}

// --- NEW: Function to close the modal ---
function closeModal() {
  isModalOpen.value = false
  editingSession.value = null
}

// --- Helper functions ---
function getSessionTypeStyles(type: SessionType) {
  switch (type) {
    case SessionType.CORE_STUDY:
      return 'bg-blue-100 text-blue-800'
    case SessionType.ASSIGNMENT:
      return 'bg-green-100 text-green-800'
    case SessionType.OVERVIEW:
      return 'bg-purple-100 text-purple-800'
    case SessionType.FINAL_REVIEW:
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function enrichSession(session: any) {
  const course = setupStore.term.courses.find((c) => c.courseId === session.courseId)
  const topic = course?.topics?.find((t) => t.id === session.topicId)
  const assignment = course?.assignments?.find((a) => a.id === session.assignmentId)
  return {
    ...session,
    courseCode: course?.courseCode || 'N/A',
    courseName: course?.name || 'N/A',
    topicName: topic?.name || null,
    assignmentName: assignment?.name || null,
  }
}

// --- Computed properties ---
const enrichedStudyPlan = computed(() => {
  if (!planStore.schedule?.study_plan) return []
  return planStore.schedule.study_plan
    .map(enrichSession)
    .slice()
    .sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date)
      if (dateComparison !== 0) return dateComparison
      return a.start.localeCompare(b.start)
    })
})

const enrichedUnscheduledPlan = computed(() => {
  if (!planStore.schedule?.unscheduled_plan) return []
  return planStore.schedule.unscheduled_plan.slice().map(enrichSession)
})

const groupedStudyPlan = computed(() => {
  if (!planStore.schedule) return {}
  const examsAsEvents = setupStore.term.courses.flatMap((course) =>
    (course.exams || []).map((exam) => ({
      ...exam,
      displayType: 'EXAM',
      courseCode: course.courseCode,
      name: `${course.name}`,
    })),
  )
  const allEvents = [
    ...enrichedStudyPlan.value.map((s) => ({ ...s, displayType: 'SESSION' })),
    ...examsAsEvents,
  ]
  allEvents.sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date)
    if (dateComparison !== 0) return dateComparison
    return (a.start || a.startTime).localeCompare(b.start || b.startTime)
  })
  return allEvents.reduce(
    (acc, event) => {
      const date = event.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(event)
      return acc
    },
    {} as Record<string, any[]>,
  )
})
</script>
<template>
  <div class="h-screen w-5/6 mx-auto flex flex-col bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-2xl">
    <div v-if="planStore.schedule" class="flex-1 flex flex-col min-h-0">
      <div class="flex-shrink-0 mb-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Your Generated Study Plan</h1>
        <div v-if="planStore.isPlanDirty" class="flex gap-x-3">
          <button
            @click="planStore.clearPlan"
            class="px-4 py-2 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Discard
          </button>
          <button
            v-if="planStore.isNewPlan"
            @click="planStore.acceptAndSavePlan"
            class="px-4 py-2 bg-[#FFC84A] rounded-2xl text-sm font-bold text-gray-700 hover:bg-[#ffa51f]"
          >
            Accept & Save Plan
          </button>
          <button
            v-else
            @click="planStore.updateSchedule"
            class="px-4 py-2 bg-green-500 rounded-2xl text-sm font-bold text-white hover:bg-green-600"
          >
            Update Schedule
          </button>
        </div>
      </div>

      <div class="flex-1 flex gap-x-8 overflow-hidden">
        <div class="w-full lg:w-2/3 flex-1 bg-white rounded-2xl p-6 overflow-y-auto">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Scheduled Sessions</h2>
          <div class="space-y-6">
            <div v-for="(sessions, date) in groupedStudyPlan" :key="date">
              <h3
                class="font-semibold text-yellow-700 pl-5 pt-1 pb-1 border-b rounded-t-lg bg-yellow-200 border-yellow-700"
              >
                {{ new Date(date + 'T00:00:00').toDateString() }}
              </h3>
              <div class="mt-4 space-y-3">
                <template v-for="item in sessions" :key="item.sessionId || item.id">
                  <div
                    v-if="item.displayType === 'EXAM'"
                    class="flex items-center gap-x-4 p-4 rounded-xl bg-red-100 border border-red-200 text-red-800"
                  >
                    <div class="text-sm font-semibold text-center w-24">
                      <div>{{ item.startTime }} - {{ item.endTime }}</div>
                    </div>
                    <div class="flex-1">
                      <p class="font-bold">{{ item.courseCode }} - {{ item.name }}</p>
                    </div>
                    <div class="text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white">
                      EXAM
                    </div>
                  </div>

                  <div
                    v-else
                    class="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 shadow-sm"
                  >
                    <!-- Time & Duration -->
                    <div class="text-center w-24">
                      <div class="text-sm text-indigo-600 font-medium">
                        {{ item.start }} - {{ item.end }}
                      </div>
                      <div class="text-xs text-gray-400 mt-1">{{ item.duration }} mins</div>
                    </div>

                    <!-- Topic / Assignment -->
                    <div class="flex-1 min-w-0">
                      <p class="text-base font-semibold text-gray-800 truncate">
                        {{ item.topicName || item.assignmentName }}
                        <span
                          v-if="item.totalSessionsInGroup > 1"
                          class="text-gray-400 font-normal"
                        >
                          ({{ item.sessionNumber }}/{{ item.totalSessionsInGroup }})
                        </span>
                      </p>
                      <p class="text-sm text-gray-500 mt-0.5">
                        {{ item.courseCode }} {{ item.courseName }}
                      </p>
                    </div>

                    <!-- Session Type Badge -->
                    <div
                      class="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
                      :class="getSessionTypeStyles(item.type)"
                    >
                      {{ item.type.replace('_', ' ') }}
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-2">
                      <!-- Edit -->
                      <button
                        @click="openEditModal(item)"
                        class="text-gray-500 hover:text-gray-600 transition-colors"
                        title="Edit Session"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                          />
                        </svg>
                      </button>

                      <!-- Delete -->
                      <button
                        @click="planStore.unscheduleSession({ sessionId: item.sessionId })"
                        class="text-red-500 hover:text-red-600 transition-colors"
                        title="Delete Session"
                      >
                        <svg
                          class="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div v-if="Object.keys(groupedStudyPlan).length === 0" class="text-center py-10">
              <p class="text-gray-500">No sessions have been scheduled.</p>
            </div>
          </div>
        </div>

        <div class="hidden lg:block lg:w-1/3 bg-white rounded-2xl p-6 overflow-y-auto">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Unscheduled Items</h2>
          <p class="text-sm text-gray-500 mb-4">
            These items couldn't be scheduled automatically. Add them to your plan manually.
          </p>
          <div class="space-y-3">
            <div
              v-for="item in enrichedUnscheduledPlan"
              :key="item.sessionId"
              class="p-3 rounded-lg border bg-yellow-50 border-yellow-200"
            >
              <p class="font-semibold text-gray-800">{{ item.topicName || item.assignmentName }}</p>
              <p class="text-sm text-gray-500">
                {{ item.courseCode }} •
                <span v-if="item.totalSessionsInGroup > 1">
                  Session {{ item.sessionNumber }} of {{ item.totalSessionsInGroup }} •
                </span>
                Est. {{ item.duration }} mins
              </p>
              <div class="mt-2">
                <button
                  @click="openEditModal(item)"
                  class="w-full text-center px-3 py-1.5 bg-white border rounded-md text-xs font-semibold hover:bg-gray-100"
                >
                  Schedule Manually
                </button>
              </div>
            </div>
            <div v-if="enrichedUnscheduledPlan.length === 0" class="text-center py-10">
              <p class="text-gray-500">No unscheduled items. Good job!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
      <h1 class="text-2xl font-bold text-gray-800">Ready to Plan?</h1>
      <p class="mt-2 text-gray-600">
        Click the button below to generate a personalized study schedule.
      </p>
      <button
        @click="planStore.generatePlan"
        :disabled="planStore.isLoading"
        class="mt-6 px-6 py-3 bg-indigo-600 rounded-lg text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        <span v-if="planStore.isLoading">Generating Your Plan...</span>
        <span v-else>Generate My Study Plan</span>
      </button>
      <p v-if="planStore.error" class="mt-4 text-sm text-red-600">{{ planStore.error }}</p>
    </div>

    <SessionEditModal
      :is-open="isModalOpen"
      :item="editingSession"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>
