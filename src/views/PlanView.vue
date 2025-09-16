<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGeneratedPlanStore } from '@/stores/generatedPlan'
import { useStudySetupStore } from '@/stores/studySetup'
import { SessionType, type SessionDTO } from '@/types'
import SessionEditModal from '@/components/SessionEditModal.vue'
import NotificationModal from '@/components/NotificationModal.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const planStore = useGeneratedPlanStore()
const setupStore = useStudySetupStore()

// --- State for the Session Edit Modal ---
const isEditModalOpen = ref(false)
const editingSession = ref<SessionDTO | null>(null)

// --- State for the Notification Modal ---
const isNotificationOpen = ref(false)
const notificationStatus = ref<'success' | 'error'>('success')
const notificationTitle = ref('')
const notificationMessage = ref('')

onMounted(() => {
  setupStore.fetchAndSetTerm().then(() => {
    planStore.fetchExistingSchedule()
  })
})

// --- Functions to control the Notification Modal ---
function showNotification(status: 'success' | 'error', title: string, message: string) {
  notificationStatus.value = status
  notificationTitle.value = title
  notificationMessage.value = message
  isNotificationOpen.value = true
}

function closeNotification() {
  isNotificationOpen.value = false
}

// --- Functions to control the Edit Modal ---
function openEditModal(item: SessionDTO) {
  editingSession.value = item
  isEditModalOpen.value = true
}

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
  closeEditModal()
}

function closeEditModal() {
  isEditModalOpen.value = false
  editingSession.value = null
}

// --- Helper functions ---
async function handleGenratePlan() {
  await planStore.generatePlan()
  if (planStore.error) {
    showNotification('error', 'Save Failed', planStore.error)
    console.error('Error generating plan:', planStore.error)
  }
}

async function handleAcceptAndSave() {
  await planStore.acceptAndSavePlan()
  if (planStore.error) {
    showNotification('error', 'Save Failed', planStore.error)
  } else {
    showNotification('success', 'Plan Saved!', 'Your new study plan has been successfully saved.')
    await planStore.fetchExistingSchedule()
  }
}

async function handleUpdate() {
  await planStore.updateSchedule()
  if (planStore.error) {
    showNotification('error', 'Update Failed', planStore.error)
  } else {
    showNotification('success', 'Update Successful!', 'Your schedule changes have been saved.')
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
  if (!planStore.schedule) return []

  // Regular scheduled sessions
  const scheduled = (planStore.schedule.study_plan || []).map((s) => ({
    ...enrichSession(s),
    isSuggested: false,
  }))

  // Suggested but not confirmed yet
  const suggested = (planStore.schedule.unscheduled_plan || [])
    .filter((u) => u.date)
    .map((s) => ({
      ...enrichSession(s),
      date: s.date,
      start: s.start,
      end: s.end,
      isSuggested: true,
    }))

  // Merge & sort
  return [...scheduled, ...suggested].sort((a, b) => {
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

  // 1. Get exams as events
  const examsAsEvents = setupStore.term.courses.flatMap((course) =>
    (course.exams || []).map((exam) => ({
      ...exam,
      displayType: 'EXAM',
      courseCode: course.courseCode,
      courseName: `${course.name}`,
    })),
  )

  // 2. Get assignment deadlines as events
  const assignmentsAsEvents = setupStore.term.courses.flatMap((course) =>
    (course.assignments || [])
      .filter((a) => a.dueDate)
      .map((assignment) => ({
        ...assignment,
        displayType: 'ASSIGNMENT_DUE',
        courseCode: course.courseCode,
        courseName: course.name,
        date: assignment.dueDate,
        time: assignment.dueTime || '23:59',
      })),
  )

  // 3. Combine sessions, exams, and deadlines
  const allEvents = [
    ...enrichedStudyPlan.value.map((s) => ({ ...s, displayType: 'SESSION' })),
    ...examsAsEvents,
    ...assignmentsAsEvents,
  ]

  // 4. Sort all events chronologically
  allEvents.sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date)
    if (dateComparison !== 0) return dateComparison
    const timeA = a.start || a.startTime || a.time || '00:00'
    const timeB = b.start || b.startTime || b.time || '00:00'
    return timeA.localeCompare(timeB)
  })

  // 5. Group events by date
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

function confirmSuggested(item: SessionDTO) {
  planStore.scheduleItemManually({
    sessionId: item.sessionId,
    date: item.date,
    start: item.start,
  })
}
</script>
<template>
  <DefaultLayout>
    <div class="h-full overflow-hidden">
      <div
        class="min-h-[80vh] w-5/6 mx-auto flex flex-col bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-2xl mt-5"
      >
        <div v-if="planStore.isLoading" class="flex-1 flex items-center justify-center">
          <p class="text-xl font-semibold text-gray-500 animate-pulse">Loading...</p>
        </div>
        <div v-else-if="planStore.schedule" class="flex-1 flex flex-col">
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
                @click="handleAcceptAndSave"
                class="px-4 py-2 bg-[#FBCC69] rounded-2xl text-sm font-bold text-gray-700 hover:bg-[#ffa51f]"
              >
                Accept & Save Plan
              </button>
              <button
                v-else
                @click="handleUpdate"
                class="px-4 py-2 bg-green-500 rounded-2xl text-sm font-bold text-white hover:bg-green-600"
              >
                Update Schedule
              </button>
            </div>
          </div>
          <div class="flex-1 flex gap-x-8 overflow-hidden">
            <div class="w-full lg:w-2/3 bg-white rounded-2xl p-6 overflow-y-auto max-h-[70vh]">
              <h2 class="text-lg font-semibold text-gray-700 mb-4">Scheduled Sessions</h2>
              <div class="space-y-6">
                <div v-for="(sessions, date) in groupedStudyPlan" :key="date">
                  <h3
                    class="font-semibold text-yellow-700 pl-5 py-1 border-b rounded-t-lg bg-[#FBCC69]/30 border-yellow-700"
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
                          <p class="font-bold">{{ item.courseCode }} - {{ item.courseName }}</p>
                        </div>
                        <div class="text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white">
                          EXAM
                        </div>
                      </div>
                      <div
                        v-else-if="item.displayType === 'ASSIGNMENT_DUE'"
                        class="flex items-center gap-x-4 p-4 rounded-xl bg-orange-100 border border-orange-200 text-orange-800"
                      >
                        <div class="text-sm font-semibold text-center w-24">
                          Due {{ item.dueTime }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-bold truncate">{{ item.name }}</p>
                          <p class="text-sm">{{ item.courseCode }} {{ item.courseName }}</p>
                        </div>
                        <div
                          class="text-xs font-bold px-2 py-1 rounded-full bg-orange-500 text-white"
                        >
                          ASSIGNMENT
                        </div>
                      </div>
                      <div
                        v-else
                        class="flex items-center justify-between gap-4 p-4 rounded-xl border shadow-sm"
                        :class="[
                          item.isCompleted
                            ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                            : item.isSuggested
                              ? 'bg-indigo-50 border-indigo-300'
                              : 'bg-gray-50 border-gray-200',
                        ]"
                      >
                        <!-- Time -->
                        <div class="text-center w-24">
                          <div
                            class="text-sm font-medium"
                            :class="item.isSuggested ? 'text-indigo-700' : 'text-[#7486FB]'"
                          >
                            {{ item.start }} - {{ item.end }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">{{ item.duration }} mins</div>
                        </div>

                        <!-- Details -->
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

                        <!-- Type badge or Completed -->
                        <div
                          v-if="item.isCompleted"
                          class="text-xs font-medium px-2 py-1 rounded-full bg-green-500 text-white"
                        >
                          COMPLETED
                        </div>
                        <div
                          v-else-if="!item.isSuggested"
                          class="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
                          :class="getSessionTypeStyles(item.type)"
                        >
                          {{ item.type.replace('_', ' ') }}
                        </div>

                        <!-- Action buttons -->
                        <div class="flex gap-2">
                          <!-- Suggested confirm -->
                          <button
                            v-if="item.isSuggested && !item.isCompleted"
                            @click="confirmSuggested(item)"
                            class="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600"
                          >
                            Confirm
                          </button>

                          <!-- Normal sessions: edit + delete -->
                          <template v-else-if="!item.isCompleted && !item.isSuggested">
                            <button
                              @click="openEditModal(item)"
                              class="text-[#4454C0]/70 hover:text-[#4454C0]/80 transition-colors"
                              title="Edit Session"
                            >
                              <!-- edit icon -->
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
                            <button
                              @click="planStore.unscheduleSession({ sessionId: item.sessionId })"
                              class="text-red-500 hover:text-red-600 transition-colors"
                              title="Delete Session"
                            >
                              <!-- delete icon -->
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
                          </template>
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
            <div
              class="hidden lg:block lg:w-1/3 bg-white rounded-2xl p-6 overflow-y-auto max-h-[70vh] shadow-sm"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Unscheduled Items</h2>
              <p v-if="enrichedUnscheduledPlan.length > 0" class="text-sm text-gray-500 mb-6">
                Review the suggested time or schedule them manually.
              </p>

              <div class="space-y-4">
                <div
                  v-for="item in enrichedUnscheduledPlan"
                  :key="item.sessionId"
                  class="p-4 rounded-xl border border-yellow-300 bg-yellow-50/70 shadow-sm"
                >
                  <!-- Title -->
                  <div class="flex justify-between items-start">
                    <p class="font-semibold text-gray-800">
                      {{ item.topicName || item.assignmentName }}
                    </p>
                    <!-- Suggested time badge -->
                    <span
                      v-if="item.suggestedTime"
                      class="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium"
                    >
                      {{ item.suggestedTime }}
                    </span>
                  </div>

                  <!-- Details -->
                  <p class="mt-1 text-sm text-gray-600">
                    {{ item.courseCode }} •
                    <span v-if="item.totalSessionsInGroup > 1">
                      Session {{ item.sessionNumber }} of {{ item.totalSessionsInGroup }} •
                    </span>
                    Est. {{ item.duration }} mins
                  </p>

                  <!-- Action -->
                  <div class="mt-3 flex justify-end">
                    <button
                      @click="openEditModal(item)"
                      class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      Schedule Manually
                    </button>
                  </div>
                </div>

                <div
                  v-if="enrichedUnscheduledPlan.length === 0"
                  class="text-center py-12 text-gray-500"
                >
                  No unscheduled items. Good job!
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
            @click="handleGenratePlan"
            :disabled="planStore.isLoading"
            class="mt-6 px-6 py-3 bg-[#7486FB] rounded-lg text-base font-semibold text-white hover:bg-[#6977D3] disabled:opacity-50"
          >
            <span v-if="planStore.isLoading">Generating Your Plan...</span>
            <span v-else>Generate My Study Plan</span>
          </button>
        </div>

        <SessionEditModal
          :is-open="isEditModalOpen"
          :item="editingSession"
          :existing-sessions="enrichedStudyPlan"
          @close="closeEditModal"
          @save="handleSave"
        />
        <NotificationModal
          :is-open="isNotificationOpen"
          :status="notificationStatus"
          :title="notificationTitle"
          :message="notificationMessage"
          @close="closeNotification"
        />
      </div>
    </div>
  </DefaultLayout>
</template>
