<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGeneratedPlanStore } from '@/stores/generatedPlan'
import { useStudySetupStore } from '@/stores/studySetup'
import { SessionType } from '@/types'

const planStore = useGeneratedPlanStore()
const setupStore = useStudySetupStore()

onMounted(() => {
  // Fetch the term/course data first, as it's needed to display names
  setupStore.fetchAndSetTerm().then(() => {
    // After the setup data is loaded, fetch the existing schedule
    planStore.fetchExistingSchedule()
  })
})

function getSessionTypeStyles(type: SessionType) {
  switch (type) {
    case SessionType.CORE_STUDY:
      return 'bg-blue-100 text-blue-800' // For primary study sessions
    case SessionType.ASSIGNMENT:
      return 'bg-green-100 text-green-800' // For assignments
    case SessionType.OVERVIEW:
      return 'bg-purple-100 text-purple-800' // For introductory sessions
    case SessionType.FINAL_REVIEW:
      return 'bg-orange-100 text-orange-800' // For important reviews
    default:
      return 'bg-gray-100 text-gray-800' // A fallback for any other type
  }
}

// A helper function to find names and dates from IDs
function enrichSession(session: any) {
  const course = setupStore.term.courses.find((c) => c.courseId === session.courseId)
  const topic = course?.topics?.find((t) => t.id === session.topicId)
  const assignment = course?.assignments?.find((a) => a.id === session.assignmentId)

  return {
    ...session, // Keep original data
    courseCode: course?.courseCode || 'N/A',
    topicName: topic?.name || null,
    assignmentName: assignment?.name || null,
  }
}

// Create a reactive, enriched version of the scheduled plan for display
const enrichedStudyPlan = computed(() => {
  if (!planStore.schedule?.study_plan) return []

  return planStore.schedule.study_plan
    .map(enrichSession) // 1. First, enrich the data with names
    .slice() // 2. Create a copy to avoid mutating the store's state
    .sort((a, b) => {
      // 3. Sort the copied array
      // First, compare by date
      const dateComparison = a.date.localeCompare(b.date)
      if (dateComparison !== 0) {
        return dateComparison
      }
      // If dates are the same, compare by start time
      return a.start.localeCompare(b.start)
    })
})

// Create a reactive, enriched version of the unscheduled plan
const enrichedUnscheduledPlan = computed(() => {
  if (!planStore.schedule?.unscheduled_plan) return []
  return planStore.schedule.unscheduled_plan.map(enrichSession)
})

// Group the enriched plan by date for the template
const groupedStudyPlan = computed(() => {
  if (!planStore.schedule) return {}

  // 1. Get all exams and format them
  const examsAsEvents = setupStore.term.courses.flatMap((course) =>
    (course.exams || []).map((exam) => ({
      ...exam,
      displayType: 'EXAM',
      courseCode: course.courseCode,
      name: `${course.courseCode} ${exam.type}`,
    })),
  )

  // 2. Combine the already-enriched-and-sorted study plan with the exams
  const allEvents = [
    ...enrichedStudyPlan.value.map((s) => ({ ...s, displayType: 'SESSION' })),
    ...examsAsEvents,
  ]

  // 3. Sort the final combined list
  allEvents.sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date)
    if (dateComparison !== 0) return dateComparison
    return (a.start || a.startTime).localeCompare(b.start || b.startTime)
  })

  // 4. Group the final list by date
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
        <div class="flex gap-x-3">
          <button
            @click="planStore.clearPlan"
            class="px-4 py-2 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Discard
          </button>
          <button
            @click="planStore.acceptAndSavePlan"
            class="px-4 py-2 bg-[#FFC84A] rounded-2xl text-sm font-bold text-gray-700 hover:bg-indigo-700"
          >
            Accept & Save Plan
          </button>
        </div>
      </div>

      <div class="flex-1 flex gap-x-8 overflow-hidden">
        <div class="w-full lg:w-2/3 flex-1 bg-white rounded-2xl p-6 overflow-y-auto">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Scheduled Sessions</h2>
          <div class="space-y-6">
            <div v-for="(sessions, date) in groupedStudyPlan" :key="date">
              <h3 class="font-semibold text-gray-500 pb-2 border-b">
                {{ new Date(date + 'T00:00:00').toDateString() }}
              </h3>
              <div class="mt-4 space-y-3">
                <template v-for="item in sessions" :key="item.sessionId || item.id">
                  <div
                    v-if="item.displayType === 'EXAM'"
                    class="flex items-center gap-x-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-800"
                  >
                    <div class="font-mono text-sm font-semibold w-20 text-center">
                      <div>{{ item.startTime }}</div>
                      <div class="text-red-400">-</div>
                      <div>{{ item.endTime }}</div>
                    </div>
                    <div class="flex-1">
                      <p class="font-bold">{{ item.name }}</p>
                      <p class="text-sm">{{ item.courseCode }}</p>
                    </div>
                    <div class="text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white">
                      EXAM
                    </div>
                  </div>

                  <div
                    v-else
                    class="flex items-center gap-x-4 p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div class="font-mono text-sm text-indigo-600 w-20 text-center">
                      <div>{{ item.start }}</div>
                      <div class="text-gray-400">-</div>
                      <div>{{ item.end }}</div>
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold text-gray-800">
                        {{ item.topicName || item.assignmentName }}
                      </p>
                      <p class="text-sm text-gray-500 mt-1">{{ item.courseCode }}</p>
                      <p class="text-xs text-gray-400 mt-1">
                        <span v-if="item.totalSessionsInGroup > 1"
                          >Session {{ item.sessionNumber }} of
                          {{ item.totalSessionsInGroup }} •</span
                        >
                        {{ item.duration }} mins
                      </p>
                    </div>
                    <div
                      class="text-xs font-medium px-2 py-1 rounded-full"
                      :class="getSessionTypeStyles(item.type)"
                    >
                      {{ item.type.replace('_', ' ') }}
                    </div>
                    <div class="flex gap-x-2">
                      <!-- Edit Button with Colored Pencil Icon -->
                      <button class="text-blue-500" title="Edit Session">
                        <svg
                          class="h-5 w-5"
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

                      <!-- Delete Button with Colored Trash Icon -->
                      <button class="text-red-500" title="Delete Session">
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
  </div>
</template>
