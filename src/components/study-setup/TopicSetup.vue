<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue'
import type { CourseDTO, AssignmentDTO, ExamDTO } from '@/types'
import { ExamType } from '@/types'

const selectedCourseId = ref<string>('955102')
const selectedExamType = ref<ExamType>(ExamType.MIDTERM)

// Controls edit mode for the entire component
const isEditing = ref(false)

const stepNavigator = inject<{
  activateStep: (step: string) => void
  subStepIndex: Ref<number>
}>('stepNavigator')

// --- MOCK DATA ---
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
    assignments: [],
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

// --- HANDLER FUNCTIONS ---
const addTopic = () => {
  if (!selectedCourse.value) return

  selectedCourse.value.topics.push({
    name: '',
    difficulty: 1,
    confidence: 1,
    estimatedStudyTime: 0,
    examType: selectedExamType.value,
  })
}

const deleteTopic = (topicToDelete: any) => {
  if (!selectedCourse.value) return
  const index = selectedCourse.value.topics.indexOf(topicToDelete)
  if (index > -1) {
    selectedCourse.value.topics.splice(index, 1)
  }
}

const addAssignment = () => {
  if (!selectedCourse.value) return
  const today = new Date().toISOString().split('T')[0]

  selectedCourse.value.assignments.push({
    name: '',
    dueDate: today,
    dueTime: '23:59',
    estimatedTime: 60,
    associatedTopicTitles: [],
    completed: false,
  })
}

const deleteAssignment = (assignmentToDelete: any) => {
  if (!selectedCourse.value) return
  const index = selectedCourse.value.assignments.indexOf(assignmentToDelete)
  if (index > -1) {
    selectedCourse.value.assignments.splice(index, 1)
  }
}

// --- COMPUTED & HELPER FUNCTIONS ---
const selectedCourse = computed(() =>
  courses.value.find((course) => course.id === selectedCourseId.value),
)
const filteredTopics = computed(() => {
  if (!selectedCourse.value) return []
  return selectedCourse.value.topics.filter((topic) => topic.examType === selectedExamType.value)
})
const filteredAssignments = computed(() => {
  if (!selectedCourse.value) return [];

  // First, create our "checklist" of topic names for the selected exam.
  const relevantTopicNames = new Set(
    selectedCourse.value.topics
      .filter((topic) => topic.examType === selectedExamType.value)
      .map((topic) => topic.name)
  );

  // Filter the assignments based on the mode (viewing or editing).
  return selectedCourse.value.assignments.filter((assignment) => {
    // Check if the assignment is relevant to the current exam section.
    const isRelevant = assignment.associatedTopicTitles.some((topicTitle) =>
      relevantTopicNames.has(topicTitle)
    );

    if (isEditing.value) {
      // In EDIT mode, we have special rules:
      // Show the assignment if it's relevant OR if it's a new, empty assignment.
      const isNew = assignment.associatedTopicTitles.length === 0;
      return isRelevant || isNew;
    } else {
      // In VIEW mode, the rule is simple: just show relevant assignments.
      return isRelevant;
    }
  });
});
const selectedExamDetails = computed(() => {
  if (!selectedCourse.value) return null
  return selectedCourse.value.exams.find((exam) => exam.type === selectedExamType.value) || null
})
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
    <div class="w-5/6 flex flex-col flex-1 overflow-hidden">
      <div
        @click="stepNavigator?.activateStep('topic')"
        class="bg-white rounded-2xl p-6 sm:p-8 flex gap-6 flex-1 overflow-hidden"
        :class="{
          'border-[#5856D6]': stepNavigator?.subStepIndex.value === 0,
          'border-transparent': stepNavigator?.subStepIndex.value !== 0,
        }"
      >
        <div class="flex flex-col gap-2">
          <div class="flex bg-[#FFF1D1] rounded-full w-min mb-2">
            <button
              @click="selectedExamType = ExamType.MIDTERM"
              :class="[
                'py-1 px-6 rounded-full text-sm',
                selectedExamType === ExamType.MIDTERM
                  ? 'bg-[#FFC84A] text-[#2F2159] shadow font-bold'
                  : 'bg-[#FFF1D1] text-[#A3A3A3] font-md',
              ]"
            >
              Midterm
            </button>
            <button
              @click="selectedExamType = ExamType.FINAL"
              :class="[
                'py-1 px-6 rounded-full text-sm',
                selectedExamType === ExamType.FINAL
                  ? 'bg-[#FFC84A] text-[#2F2159] shadow font-bold'
                  : 'bg-[#FFF1D1] text-[#A3A3A3] font-md',
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
              'font-bold py-3 px-6 rounded-lg rounded-l-none text-left text-base transition-colors duration-200 border-l-15',
              course.id === selectedCourseId
                ? 'bg-[#8A98DD]/25 border-[#8A98DD]'
                : 'bg-gray-100 hover:bg-purple-50 text-gray-600 border-transparent',
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
            <button
              @click="isEditing = !isEditing"
              class="text-gray-400 hover:text-purple-600 p-2 rounded-full hover:bg-purple-100"
            >
              <svg
                v-if="isEditing"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
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
            class="p-2 rounded-xl bg-yellow-100 border border-yellow-300 mb-4 text-gray-800"
          >
            <div v-if="!isEditing" class="flex items-center gap-4">
              <div class="flex items-center justify-center w-8 h-8 bg-yellow-200 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-yellow-700"
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
              </div>
              <div>
                <div class="text-sm font-semibold uppercase tracking-wide text-yellow-700">
                  {{ selectedExamType }}
                </div>
                <div class="text-sm font-medium">{{ formatExamDate(selectedExamDetails) }}</div>
              </div>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
              <div class="flex flex-col">
                <label for="exam-date" class="mb-1 text-sm font-medium text-gray-700"
                  >Exam Date</label
                >
                <input
                  id="exam-date"
                  type="date"
                  v-model="selectedExamDetails.date"
                  class="p-2 bg-white border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#5856D6]"
                />
              </div>
              <div class="flex flex-col">
                <label for="start-time" class="mb-1 text-sm font-medium text-gray-700"
                  >Start Time</label
                >
                <input
                  id="start-time"
                  type="time"
                  v-model="selectedExamDetails.startTime"
                  class="p-2 bg-white border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#5856D6]"
                />
              </div>
              <div class="flex flex-col">
                <label for="end-time" class="mb-1 text-sm font-medium text-gray-700"
                  >End Time</label
                >
                <input
                  id="end-time"
                  type="time"
                  v-model="selectedExamDetails.endTime"
                  class="p-2 bg-white border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#5856D6]"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="grid grid-cols-12 gap-4 text-sm text-gray-500 font-semibold px-4">
              <div class="col-span-4">Name</div>
              <div class="col-span-2">Difficulty</div>
              <div class="col-span-2">Confidence</div>
              <div class="col-span-3 text-right">Study Time</div>
              <div class="col-span-1"></div>
            </div>
            <div
              v-for="(topic, index) in filteredTopics"
              :key="index"
              class="bg-purple-50 rounded-lg p-4 grid grid-cols-12 gap-4 items-center"
            >
              <div class="col-span-4">
                <input
                  v-if="isEditing"
                  v-model="topic.name"
                  class="w-full bg-transparent font-semibold text-gray-800 focus:outline-none focus:border-b focus:border-purple-500"
                  type="text"
                  placeholder="Enter topic name"
                />
                <span v-else class="font-semibold text-gray-800">{{ topic.name }}</span>
              </div>
              <div class="col-span-2 flex">
                <template v-for="i in 5" :key="i">
                  <svg
                    @click="isEditing && (topic.difficulty = i)"
                    :class="[
                      'w-5 h-5',
                      isEditing ? 'cursor-pointer' : '',
                      i <= topic.difficulty ? 'text-[#FFC84A]' : 'text-[#FFC84A] opacity-[.4]',
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
              <div class="col-span-2 flex">
                <template v-for="i in 5" :key="i">
                  <svg
                    @click="isEditing && (topic.confidence = i)"
                    :class="[
                      'w-5 h-5',
                      isEditing ? 'cursor-pointer' : '',
                      i <= topic.confidence ? 'text-[#FFC84A]' : 'text-[#FFC84A] opacity-[.4]',
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
              <div class="col-span-3 text-right">
                <input
                  v-if="isEditing"
                  v-model.number="topic.estimatedStudyTime"
                  class="text-right bg-transparent font-semibold text-gray-800 focus:outline-none focus:border-b focus:border-purple-500 w-full"
                  type="number"
                />
                <span v-else class="font-semibold text-gray-800">{{
                  topic.estimatedStudyTime
                }}</span>
              </div>
              <div class="col-span-1 text-right">
                <button
                  v-if="isEditing"
                  @click="deleteTopic(topic)"
                  class="text-red-400 hover:text-red-600 p-1 rounded-full"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-if="isEditing"
              class="bg-purple-50 p-4 rounded-lg space-y-3 mt-2 hover:opacity-75"
            >
              <button
                @click="addTopic"
                class="text-[#5856D6] px-3 py-1 text-md font-bold rounded-lg"
              >
                + Add Topic
              </button>
            </div>
          </div>

          <div class="my-6"></div>

          <div>
            <div
              v-if="isEditing || filteredAssignments.length > 0"
              class="inline-block bg-[#FFC84A] text-[#2F2159] font-semibold py-1 px-4 rounded-full text-sm mb-4"
            >
              Assignment
            </div>

            <div class="space-y-2">
              <div
                v-if="isEditing || filteredAssignments.length > 0"
                class="grid grid-cols-12 gap-4 text-sm text-gray-500 font-semibold px-4"
              >
                <div class="col-span-1">Status</div>
                <div class="col-span-3">Name</div>
                <div class="col-span-3">Associated Topics</div>
                <div class="col-span-3">Due date</div>
                <div class="col-span-1 text-right">Time</div>
                <div class="col-span-1"></div>
              </div>

              <div
                v-for="(assignment, index) in filteredAssignments"
                :key="index"
                class="bg-purple-50 rounded-lg p-4 grid grid-cols-12 gap-4 items-center"
              >
                <div class="col-span-1 flex justify-start">
                  <span
                    v-if="assignment.completed"
                    @click="isEditing && (assignment.completed = false)"
                    class="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white"
                    :class="[isEditing ? 'cursor-pointer' : '']"
                    ><svg
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
                  <span
                    v-else
                    @click="isEditing && (assignment.completed = true)"
                    class="h-6 w-6 rounded-full bg-[#FFC84A]"
                    :class="[isEditing ? 'cursor-pointer' : '']"
                  ></span>
                </div>
                <div class="col-span-3">
                  <input
                    v-if="isEditing"
                    v-model="assignment.name"
                    class="w-full bg-transparent font-semibold text-gray-800 focus:outline-none focus:border-b focus:border-purple-500"
                    type="text"
                    placeholder="Assignment name"
                  />
                  <span v-else class="font-semibold text-gray-800">{{ assignment.name }}</span>
                </div>

                <div class="col-span-3">
                  <div v-if="isEditing" class="w-full p-2 overflow-y-auto max-h-24 h-full">
                    <div
                      v-for="topic in filteredTopics"
                      :key="topic.name"
                      class="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        :id="`topic-${assignment.name}-${topic.name}`"
                        :value="topic.name"
                        v-model="assignment.associatedTopicTitles"
                        class="h-4 w-4 rounded border-gray-300 accent-[#5856D6] shadow-sm cursor-pointer"
                      />
                      <label
                        :for="`topic-${assignment.name}-${topic.name}`"
                        class="text-gray-700 font-normal select-none cursor-pointer"
                      >
                        {{ topic.name }}
                      </label>
                    </div>
                  </div>
                  <div v-else class="flex flex-wrap gap-1">
                    <span
                      v-for="topicTitle in assignment.associatedTopicTitles"
                      :key="topicTitle"
                      class="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium"
                    >
                      {{ topicTitle }}
                    </span>
                  </div>
                </div>

                <div class="col-span-3">
                  <div v-if="isEditing" class="flex flex-col gap-1">
                    <input
                      v-model="assignment.dueDate"
                      type="date"
                      class="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 shadow-sm focus:border-[#5856D6] focus:outline-none focus:ring-1 focus:ring-[#5856D6]"
                    />
                    <input
                      v-model="assignment.dueTime"
                      type="time"
                      class="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 shadow-sm focus:border-[#5856D6] focus:outline-none focus:ring-1 focus:ring-[#5856D6]"
                    />
                  </div>
                  <span v-else class="font-semibold text-gray-600">{{
                    formatDueDate(assignment)
                  }}</span>
                </div>

                <div class="col-span-1 text-right">
                  <input
                    v-if="isEditing"
                    v-model.number="assignment.estimatedTime"
                    class="text-right bg-transparent font-semibold text-gray-800 focus:outline-none focus:border-b focus:border-purple-500 w-full"
                    type="number"
                  />
                  <span v-else class="font-semibold text-gray-800">{{
                    assignment.estimatedTime
                  }}</span>
                </div>
                <div class="col-span-1 text-right">
                  <button
                    v-if="isEditing"
                    @click="deleteAssignment(assignment)"
                    class="text-red-400 hover:text-red-600 p-1 rounded-full"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                v-if="isEditing"
                class="bg-purple-50 p-4 rounded-lg space-y-3 mt-2 hover:opacity-75"
              >
                <button
                  @click="addAssignment"
                  class="text-[#5856D6] px-3 py-1 text-md font-bold rounded-lg"
                >
                  + Add Assignment
                </button>
              </div>
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
