<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CourseDTO, AssignmentDTO, ExamDTO } from '@/types'
import { ExamType } from '@/types'

const selectedCourseId = ref<string>('955102') // Default selected course
const selectedExamType = ref<ExamType>(ExamType.MIDTERM)

// --- MOCK DATA ---
// This data would typically come from an API call
const courses = ref<CourseDTO[]>([
  {
    id: '955102',
    name: 'Digital Literacy',
    credit: 3,
    topics: [
      {
        name: 'Introduction',
        difficulty: 1,
        confidence: 1,
        estimatedStudyTime: 30,
        examType: ExamType.MIDTERM,
      },
      {
        name: 'System testing',
        difficulty: 3,
        confidence: 3,
        estimatedStudyTime: 90,
        examType: ExamType.MIDTERM,
      },
      {
        name: 'Docker CI',
        difficulty: 2,
        confidence: 2,
        estimatedStudyTime: 90,
        examType: ExamType.MIDTERM,
      },
      {
        name: 'Final Project Topic',
        difficulty: 3,
        confidence: 1,
        estimatedStudyTime: 120,
        examType: ExamType.FINAL,
      },
    ],
    assignments: [
      {
        name: 'Introduction',
        dueDate: '2025-06-28',
        dueTime: '07:00',
        estimatedTime: 30,
        associatedTopicTitles: ['Introduction'],
        completed: true,
      },
      {
        name: 'System testing',
        dueDate: '2025-06-28',
        dueTime: '07:00',
        estimatedTime: 90,
        associatedTopicTitles: ['System testing'],
        completed: false,
      },
      {
        name: 'Docker CI',
        dueDate: '2025-06-28',
        dueTime: '07:00',
        estimatedTime: 90,
        associatedTopicTitles: ['Docker CI'],
        completed: false,
      },
    ],
    exams: [
      { type: ExamType.MIDTERM, date: '2025-07-20', startTime: '09:00', endTime: '12:00' },
      { type: ExamType.FINAL, date: '2025-09-15', startTime: '13:00', endTime: '16:00' },
    ],
  },
  {
    id: '955201',
    name: 'Citizenship',
    credit: 3,
    topics: [
      {
        name: 'Civic Duties',
        difficulty: 1,
        confidence: 3,
        estimatedStudyTime: 45,
        examType: ExamType.MIDTERM,
      },
      {
        name: 'Modern Governance',
        difficulty: 2,
        confidence: 2,
        estimatedStudyTime: 75,
        examType: ExamType.FINAL,
      },
    ],
    assignments: [
      {
        name: 'Essay on Civic Duty',
        dueDate: '2025-07-10',
        dueTime: '23:59',
        estimatedTime: 120,
        associatedTopicTitles: ['Civic Duties'],
        completed: false,
      },
    ],
    exams: [
      { type: ExamType.MIDTERM, date: '2025-07-22', startTime: '10:00', endTime: '12:00' },
      { type: ExamType.FINAL, date: '2025-09-18', startTime: '10:00', endTime: '12:00' },
    ],
  },
  {
    id: '955301',
    name: 'Advanced Programming',
    credit: 4,
    topics: [
      {
        name: 'Async/Await',
        difficulty: 3,
        confidence: 2,
        estimatedStudyTime: 120,
        examType: ExamType.MIDTERM,
      },
      {
        name: 'WebSockets',
        difficulty: 3,
        confidence: 1,
        estimatedStudyTime: 120,
        examType: ExamType.MIDTERM,
      },
      {
        name: 'Microservices',
        difficulty: 3,
        confidence: 1,
        estimatedStudyTime: 180,
        examType: ExamType.FINAL,
      },
    ],
    assignments: [
      {
        name: 'WebSocket Chat App',
        dueDate: '2025-08-01',
        dueTime: '17:00',
        estimatedTime: 300,
        associatedTopicTitles: ['WebSockets'],
        completed: false,
      },
    ],
    exams: [
      { type: ExamType.MIDTERM, date: '2025-07-25', startTime: '14:00', endTime: '17:00' },
      { type: ExamType.FINAL, date: '2025-09-20', startTime: '14:00', endTime: '17:00' },
    ],
  },
])

// --- COMPUTED PROPERTIES ---

// Find the currently selected course object from the array
const selectedCourse = computed(() =>
  courses.value.find((course) => course.id === selectedCourseId.value),
)

// Filter the topics of the selected course based on the active exam type
const filteredTopics = computed(() => {
  if (!selectedCourse.value) return []
  return selectedCourse.value.topics.filter((topic) => topic.examType === selectedExamType.value)
})

// Find the exam details for the selected course and exam type
const selectedExamDetails = computed(() => {
  if (!selectedCourse.value) return null
  return selectedCourse.value.exams.find((exam) => exam.type === selectedExamType.value) || null
})

// --- HELPER FUNCTIONS ---

// Formats the due date and time for display
const formatDueDate = (assignment: AssignmentDTO): string => {
  const date = new Date(`${assignment.dueDate}T${assignment.dueTime}`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}

// Formats the exam date and time range for display
const formatExamDate = (exam: ExamDTO): string => {
  const startDate = new Date(`${exam.date}T${exam.startTime}`)
  const endDate = new Date(`${exam.date}T${exam.endTime}`)

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }

  const datePart = startDate.toLocaleDateString('en-US', dateOptions)
  const startTimePart = startDate.toLocaleTimeString('en-US', timeOptions)
  const endTimePart = endDate.toLocaleTimeString('en-US', timeOptions)

  return `${datePart} ・ ${startTimePart} - ${endTimePart}`
}
</script>

<template>
  <div class="h-screen flex flex-col items-center">
    <div class="w-4/5 flex flex-col flex-1 overflow-hidden">
      <div class="bg-white rounded-2xl p-6 sm:p-8 flex gap-6 flex-1 overflow-hidden">
        <div class="flex flex-col gap-2">
          <div class="flex bg-gray-100 rounded-lg p-1 w-min mb-2">
            <button
              @click="selectedExamType = ExamType.MIDTERM"
              :class="[
                'font-semibold py-1 px-6 rounded-md text-sm',
                selectedExamType === ExamType.MIDTERM
                  ? 'bg-yellow-400 text-yellow-800 shadow'
                  : 'text-gray-500',
              ]"
            >
              Midterm
            </button>
            <button
              @click="selectedExamType = ExamType.FINAL"
              :class="[
                'font-semibold py-1 px-6 rounded-md text-sm',
                selectedExamType === ExamType.FINAL
                  ? 'bg-yellow-400 text-yellow-800 shadow'
                  : 'text-gray-500',
              ]"
            >
              Final
            </button>
          </div>

          <button
            v-for="course in courses"
            :key="course.id"
            @click="selectedCourseId = course.id"
            :class="[
              'font-bold py-3 px-12 rounded-lg text-left text-lg',
              course.id === selectedCourseId
                ? 'bg-purple-200 text-purple-800 shadow'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600',
            ]"
          >
            {{ course.name }}
          </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-4" v-if="selectedCourse">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-baseline gap-4">
              <h2 class="text-xl font-bold text-gray-800">{{ selectedCourse.id }}</h2>
              <h2 class="text-xl font-bold text-gray-800">{{ selectedCourse.name }}</h2>
            </div>
            <button class="text-gray-400 hover:text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
                />
              </svg>
            </button>
          </div>

          <div
            v-if="selectedExamDetails"
            class="flex items-center gap-2 text-md text-gray-500 mb-4 bg-amber-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="font-medium">{{ formatExamDate(selectedExamDetails) }}</span>
          </div>

          <div class="space-y-2">
            <div class="grid grid-cols-12 gap-4 text-sm text-gray-500 font-semibold px-4">
              <div class="col-span-4">Name</div>
              <div class="col-span-3">Difficulty</div>
              <div class="col-span-3">Confidence</div>
              <div class="col-span-2 text-right">Study Time</div>
            </div>

            <div
              v-for="topic in filteredTopics"
              :key="topic.name"
              class="bg-purple-50 rounded-lg p-4 grid grid-cols-12 gap-4 items-center"
            >
              <div class="col-span-4 font-semibold text-gray-800">{{ topic.name }}</div>
              <div class="col-span-3 flex">
                <template v-for="i in 5" :key="i">
                  <svg
                    :class="[
                      'w-5 h-5',
                      i <= topic.difficulty ? 'text-yellow-400' : 'text-gray-300',
                    ]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </template>
              </div>
              <div class="col-span-3 flex">
                <template v-for="i in 5" :key="i">
                  <svg
                    :class="[
                      'w-5 h-5',
                      i <= topic.confidence ? 'text-yellow-400' : 'text-gray-300',
                    ]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </template>
              </div>
              <div class="col-span-2 text-right font-semibold text-gray-800">
                {{ topic.estimatedStudyTime }}
              </div>
            </div>

            <button class="text-purple-600 font-semibold pt-2 px-4">+ Add Topic</button>
          </div>

          <div class="my-6"></div>

          <div>
            <div
              class="inline-block bg-yellow-400 text-yellow-800 font-semibold py-1 px-4 rounded-md text-sm mb-4"
            >
              Assignment
            </div>

            <div class="space-y-2">
              <div class="grid grid-cols-12 gap-4 text-sm text-gray-500 font-semibold px-4">
                <div class="col-span-4">Name</div>
                <div class="col-span-4">Due date</div>
                <div class="col-span-2">Topic</div>
                <div class="col-span-2 text-right">Time</div>
              </div>

              <div
                v-for="assignment in selectedCourse.assignments"
                :key="assignment.name"
                class="bg-purple-50 rounded-lg p-4 grid grid-cols-12 gap-4 items-center"
              >
                <div class="col-span-4 font-semibold text-gray-800">{{ assignment.name }}</div>
                <div class="col-span-4 font-semibold text-gray-600">
                  {{ formatDueDate(assignment) }}
                </div>
                <div class="col-span-2 flex justify-start">
                  <span
                    v-if="assignment.completed"
                    class="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span v-else class="h-6 w-6 rounded-full bg-yellow-400"></span>
                </div>
                <div class="col-span-2 text-right font-semibold text-gray-800">
                  {{ assignment.estimatedTime }}
                </div>
              </div>
              <button class="text-purple-600 font-semibold pt-2 px-4">+ Add Topic</button>
            </div>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-gray-500">
          Select a course to see the details.
        </div>
      </div>
    </div>
  </div>
</template>
