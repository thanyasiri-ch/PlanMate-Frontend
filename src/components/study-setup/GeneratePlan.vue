<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// --- 1. DATA STRUCTURE (matches your DTO) ---
// Use placeholder data to build the UI first.
const studyPlan = ref([
  // Example for a specific date: 2025-07-01
  {
    sessionId: '1',
    courseCode: 'CS101',
    topicName: 'Introduction to Algorithms',
    assignmentName: null,
    duration: 60,
    type: 'STUDY',
    scheduled: true,
    date: '2025-07-01',
    start: '10:00',
    end: '11:00',
    completed: false,
  },
  {
    sessionId: '2',
    courseCode: 'MA203',
    topicName: null,
    assignmentName: 'Problem Set 1',
    duration: 90,
    type: 'ASSIGNMENT',
    scheduled: true,
    date: '2025-07-01',
    start: '14:00',
    end: '15:30',
    completed: false,
  },
  // Example for another date: 2025-07-02
  {
    sessionId: '3',
    courseCode: 'CS101',
    topicName: 'Data Structures',
    assignmentName: null,
    duration: 45,
    type: 'STUDY',
    scheduled: true,
    date: '2025-07-02',
    start: '11:00',
    end: '11:45',
    completed: false,
  },
])

const unscheduledPlan = ref([
  {
    sessionId: '4',
    courseCode: 'PHY201',
    topicName: 'Kinematics',
    assignmentName: null,
    duration: 60,
    type: 'STUDY',
    scheduled: false,
    date: null,
    start: null,
    end: null,
    completed: false,
  },
  {
    sessionId: '5',
    courseCode: 'CS101',
    topicName: 'Big O Notation',
    assignmentName: null,
    duration: 30,
    type: 'STUDY',
    scheduled: false,
    date: null,
    start: null,
    end: null,
    completed: false,
  },
  {
    sessionId: '5',
    courseCode: 'CS101',
    topicName: 'Big O Notation',
    assignmentName: null,
    duration: 30,
    type: 'STUDY',
    scheduled: false,
    date: null,
    start: null,
    end: null,
    completed: false,
  },
])

// A computed property to group the study plan by date
const groupedStudyPlan = computed(() => {
  // This logic correctly groups sessions by date
  return studyPlan.value.reduce(
    (acc, session) => {
      const date = session.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(session)
      return acc
    },
    {} as Record<string, typeof studyPlan.value>,
  )
})

// --- 2. API CALL ---
// onMounted(async () => {
//   // Replace with your actual API call
//   const response = await fetch('/api/schedule');
//   const data = await response.json();
//   studyPlan.value = data.studyPlan;
//   unscheduledPlan.value = data.unscheduledPlan;
// });

function acceptPlan() {
  console.log('Saving plan...', {
    studyPlan: studyPlan.value,
    unscheduledPlan: unscheduledPlan.value,
  })
  // TODO: POST the current state of studyPlan and unscheduledPlan back to your server
}

function regeneratePlan() {
  console.log('Regenerating plan...')
  // TODO: Logic to re-trigger the plan generation
}
</script>

<template>
  <div class="h-screen w-5/6 mx-auto flex flex-col bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-2xl">
    <div class="flex-shrink-0 mb-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Your Generated Study Plan</h1>
      <div class="flex gap-x-3">
        <button
          @click="regeneratePlan"
          class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          Regenerate
        </button>
        <button
          @click="acceptPlan"
          class="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700"
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
              <div
                v-for="session in sessions"
                :key="session.sessionId"
                class="flex items-center gap-x-4 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div class="font-mono text-sm text-indigo-600 w-20 text-center">
                  <div>{{ session.start }}</div>
                  <div class="text-gray-400">-</div>
                  <div>{{ session.end }}</div>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">
                    {{ session.topicName || session.assignmentName }}
                  </p>
                  <p class="text-sm text-gray-500">{{ session.courseCode }}</p>
                </div>
                <div
                  class="text-xs font-medium px-2 py-1 rounded-full"
                  :class="
                    session.type === 'STUDY'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  "
                >
                  {{ session.type }}
                </div>
                <div class="flex gap-x-2">
                  <button class="text-gray-400 hover:text-indigo-600" title="Edit Session">
                    ✏️
                  </button>
                  <button class="text-gray-400 hover:text-red-600" title="Delete Session">
                    🗑️
                  </button>
                </div>
              </div>
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
            v-for="item in unscheduledPlan"
            :key="item.sessionId"
            class="p-3 rounded-lg border bg-yellow-50 border-yellow-200"
          >
            <p class="font-semibold text-gray-800">{{ item.topicName || item.assignmentName }}</p>
            <p class="text-sm text-gray-500">
              {{ item.courseCode }} • Est. {{ item.duration }} mins
            </p>
            <div class="mt-2">
              <button
                class="w-full text-center px-3 py-1.5 bg-white border rounded-md text-xs font-semibold hover:bg-gray-100"
              >
                Schedule Manually
              </button>
            </div>
          </div>
          <div v-if="unscheduledPlan.length === 0" class="text-center py-10">
            <p class="text-gray-500">No unscheduled items. Good job!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
