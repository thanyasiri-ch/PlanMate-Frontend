<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStudySetupStore } from '@/stores/studySetup'
import type { AssignmentDTO, ExamDTO, TopicDTO, CourseResponseDTO } from '@/types'
import { ExamType } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import cloneDeep from 'lodash/cloneDeep'

const store = useStudySetupStore()

// --- State ---
const selectedCourseCode = ref<string>('')
const selectedExamType = ref<ExamType>(ExamType.MIDTERM)
const isEditing = ref(false)
const isLoading = ref(false)

// This local ref will hold a clone of the course details for editing,
// preventing direct mutation of the global store state until saved.
const localCourseDetails = ref<CourseResponseDTO | null>(null)

const editableExam = ref<ExamDTO | null>(null)

// --- Computed Properties ---

// This computed property now smartly returns either the local editing copy or the pristine store version.
const currentCourseData = computed<CourseResponseDTO | null>(() => {
  if (isEditing.value) {
    return localCourseDetails.value
  }
  return store.term.courses.find((c) => c.courseCode === selectedCourseCode.value) ?? null
})

const coursesForSelection = computed(() => store.term.courses.filter((c) => c.courseCode && c.name))

const hasCourses = computed(() => coursesForSelection.value.length > 0)

const selectedCourse = computed(
  () =>
    coursesForSelection.value.find((course) => course.courseCode === selectedCourseCode.value) ??
    null,
)

const selectedExamDetails = computed(() => {
  const course = currentCourseData.value
  if (!course) return null

  // In edit mode, the source of truth is `editableExam`.
  if (isEditing.value) {
    // Find the exam in the local data that matches the selected type
    return (
      localCourseDetails.value?.exams?.find((exam) => exam.type === selectedExamType.value) ?? null
    )
  }

  // In view mode, get it from the store data.
  return (course.exams ?? []).find((exam) => exam.type === selectedExamType.value) ?? null
})

const filteredTopics = computed(() => {
  const course = currentCourseData.value
  const exam = selectedExamDetails.value
  if (!course || !exam) return []
  return (course.topics ?? []).filter((topic) => topic.examType === exam.type)
})

const filteredAssignments = computed(() => {
  const course = currentCourseData.value
  const exam = selectedExamDetails.value
  if (!course || !exam) return []
  return (course.assignments ?? []).filter((assignment) => assignment.examType === exam.type)
})

// --- Lifecycle & Watchers ---
onMounted(async () => {
  // First, ensure term data is loaded, as termId is needed for course details
  await store.fetchAndSetTerm() // Make sure this populates store.term and its termId

  if (hasCourses.value) {
    selectedCourseCode.value = coursesForSelection.value[0].courseCode ?? ''
  }
  await fetchAndInitializeCourse()
})

watch([selectedCourseCode, selectedExamType], async () => {
  // When the selection changes, if we are in edit mode, we must also update our editableExam ref.
  if (isEditing.value) {
    const confirm = window.confirm(
      'You have unsaved changes. Are you sure you want to switch? Your changes will be lost.',
    )
    if (confirm) {
      handleCancelEdit() // This will exit edit mode and then fetchAndInitializeCourse will run again.
    } else {
      // Revert selection if user cancels
      const previousCourseCode = currentCourseData.value?.courseCode ?? ''
      await nextTick()
      selectedCourseCode.value = previousCourseCode
      return
    }
  }
  await fetchAndInitializeCourse()
  // After fetching, if we are in edit mode, sync the editable exam
  if (isEditing.value) {
    syncEditableExam()
  }
})

// A helper function to find and set the exam being edited.
function syncEditableExam() {
  if (!isEditing.value || !localCourseDetails.value) {
    editableExam.value = null
    return
  }

  // Ensure exams array exists
  localCourseDetails.value.exams ??= []
  let examToEdit = localCourseDetails.value.exams.find((e) => e.type === selectedExamType.value)

  // If an exam of the selected type doesn't exist, create a default one for the form.
  if (!examToEdit) {
    examToEdit = {
      id: uuidv4(),
      type: selectedExamType.value,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
    }
    // Add the new exam to our local data.
    localCourseDetails.value.exams.push(examToEdit)
  }

  editableExam.value = examToEdit
}

// --- Data Fetching and Initialization ---
async function fetchAndInitializeCourse() {
  if (isEditing.value) {
    const confirm = window.confirm(
      'You have unsaved changes. Are you sure you want to switch? Your changes will be lost.',
    )
    if (confirm) {
      handleCancelEdit() // Discard changes before switching
    } else {
      // Revert selection if user cancels
      const previousCourseCode = currentCourseData.value?.courseCode ?? ''
      await nextTick()
      selectedCourseCode.value = previousCourseCode
      return
    }
  }

  const courseCode = selectedCourseCode.value
  if (!courseCode) return

  // Ensure termId is available from the store before fetching course details
  if (!store.term.termId || store.term.termId === 0) {
    console.warn('Term ID is not available. Cannot fetch course details.')
    // Optionally, attempt to fetch term here again or show an error
    return
  }

  isLoading.value = true
  try {
    // Corrected: Pass both termId and courseCode
    await store.fetchCourseDetails(store.term.termId, courseCode)
  } catch (err) {
    console.warn(`Could not load details for course: ${courseCode}`, err)
  } finally {
    isLoading.value = false
  }
}

// --- Edit Mode and Save/Cancel Logic ---
function enterEditMode() {
  const courseFromStore = store.term.courses.find((c) => c.courseCode === selectedCourseCode.value)
  if (!courseFromStore) {
    console.error('Cannot enter edit mode: course not found in store.')
    return
  }

  // Create a deep clone for safe editing
  localCourseDetails.value = cloneDeep(courseFromStore)

  // Ensure essential arrays exist on the local copy
  localCourseDetails.value.exams ??= []
  localCourseDetails.value.topics ??= []
  localCourseDetails.value.assignments ??= []

  isEditing.value = true
  syncEditableExam()
}

function handleCancelEdit() {
  localCourseDetails.value = null // Discard the local copy
  editableExam.value = null
  isEditing.value = false
}

async function handleSave() {
  if (!localCourseDetails.value || !validateCourseDetails(localCourseDetails.value)) return

  // The localCourseDetails ref now contains all the correct, updated data for exams, topics, and assignments.

  console.debug(
    '--- DEBUG: Payload about to be sent to backend ---',
    cloneDeep(localCourseDetails.value),
  )

  try {
    await store.saveCourseDetails(localCourseDetails.value.courseCode, localCourseDetails.value)

    isEditing.value = false
    localCourseDetails.value = null
    editableExam.value = null
    alert('Course details saved successfully!')

    // Fetch fresh data from the server to ensure UI is in sync
    await fetchAndInitializeCourse()
  } catch (err) {
    console.error('Failed to save course details:', err)
    alert('There was an error saving your course data. Please check the console.')
  }
}

// --- Validation ---
function validateCourseDetails(course: CourseResponseDTO): boolean {
  for (const topic of course.topics ?? []) {
    if (!topic.name.trim()) {
      alert(`A topic name cannot be empty.`)
      return false
    }
  }
  for (const assignment of course.assignments ?? []) {
    if (!assignment.name.trim()) {
      alert(`An assignment name cannot be empty.`)
      return false
    }
  }
  return true
}

// --- Local Data Handlers (operate on the localCourseDetails copy) ---
function addTopic() {
  if (!isEditing.value || !localCourseDetails.value) return
  const exam = selectedExamDetails.value // Relies on computed property which now points to local data
  if (!exam) return

  const newTopic: TopicDTO = {
    id: uuidv4(),
    name: '',
    difficulty: 1,
    confidence: 1,
    estimatedStudyTime: 60,
    examType: exam.type,
  }
  localCourseDetails.value.topics ??= []
  console.log('Adding new topic:', newTopic)
  localCourseDetails.value.topics.push(newTopic)
}

function deleteTopic(topic: TopicDTO) {
  if (!isEditing.value || !localCourseDetails.value) return
  if (!localCourseDetails.value.topics) return
  localCourseDetails.value.topics = localCourseDetails.value.topics.filter((t) => t.id !== topic.id)
}

function addAssignment() {
  if (!isEditing.value || !localCourseDetails.value) return
  const exam = selectedExamDetails.value
  if (!exam) return

  const newAssignment: AssignmentDTO = {
    id: uuidv4(),
    name: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '23:59',
    estimatedTime: 60,
    associatedTopicIds: [],
    completed: false,
    examType: exam.type,
  }
  localCourseDetails.value.assignments ??= []
  console.log('Adding new assignment:', newAssignment)
  localCourseDetails.value.assignments.push(newAssignment)
}

function deleteAssignment(assignment: AssignmentDTO) {
  if (!isEditing.value || !localCourseDetails.value) return
  if (!localCourseDetails.value.assignments) return
  localCourseDetails.value.assignments = localCourseDetails.value.assignments.filter(
    (a) => a.id !== assignment.id,
  )
}

function getAssociatedTopics(assignment: AssignmentDTO): TopicDTO[] {
  const course = currentCourseData.value
  // Guard against missing data
  if (!course || !course.topics || !assignment.associatedTopicIds) {
    return []
  }

  // Create a fast lookup map for topics by their ID
  const topicsMap = new Map(course.topics.map((topic) => [topic.id, topic]))

  // Map the array of IDs to an array of full TopicDTO objects
  return assignment.associatedTopicIds
    .map((topicId) => topicsMap.get(topicId))
    .filter((topic): topic is TopicDTO => topic !== undefined) // Filter out any potential undefined values
}

// You can also create a convenience function to get just the names
function getAssociatedTopicNames(assignment: AssignmentDTO): string[] {
  return getAssociatedTopics(assignment).map((topic) => topic.name)
}

// --- Formatters (No changes needed) ---
function formatDueDate(assignment: AssignmentDTO): string {
  const date = new Date(`${assignment.dueDate}T${assignment.dueTime}`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}

function formatExamDate(exam: ExamDTO): string {
  const start = new Date(`${exam.date}T${exam.startTime}`)
  const end = new Date(`${exam.date}T${exam.endTime}`)
  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
  return `${dateStr} ・ ${startTime} - ${endTime}`
}
</script>
<template>
  <div class="h-screen flex flex-col items-center">
    <div class="w-5/6 flex flex-col flex-1 overflow-hidden">
      <div class="flex-1 flex bg-white rounded-2xl p-6 sm:p-8 overflow-hidden">
        <div v-if="hasCourses" class="flex gap-6 flex-1 overflow-hidden">
          <div class="flex flex-col gap-2">
            <!-- Exam Type Selection -->
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

            <!-- Course Selection -->
            <button
              v-for="course in coursesForSelection"
              :key="course.courseCode"
              @click="selectedCourseCode = course.courseCode"
              :class="[
                'font-bold py-3 px-6 rounded-lg rounded-l-none text-left text-base transition-colors duration-200 border-l-15',
                course.courseCode === selectedCourseCode
                  ? 'bg-[#8A98DD]/25 border-[#8A98DD]'
                  : 'bg-gray-100 hover:bg-purple-50 text-gray-600 border-transparent',
              ]"
            >
              {{ course.name }}
            </button>
          </div>

          <!-- Course Details -->
          <div class="flex-1 overflow-y-auto pr-4" v-if="selectedCourse">
            <div class="flex justify-between items-center mb-4">
              <!-- Course Title -->
              <div class="flex items-baseline gap-4">
                <h2 class="text-xl font-bold text-gray-800">{{ selectedCourse.courseCode }}</h2>
                <h2 class="text-xl font-bold text-gray-800">{{ selectedCourse.name }}</h2>
              </div>
              <div v-if="isEditing" class="flex items-center space-x-2">
                <!-- Cancle Button -->
                <button
                  @click="handleCancelEdit"
                  type="button"
                  class="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
                  title="Cancel"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <!-- Save Button -->
                <button
                  @click="handleSave"
                  type="button"
                  class="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-100"
                  title="Save Course"
                >
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <!-- Edit Button -->
              <button
                v-else
                @click="enterEditMode"
                type="button"
                class="text-gray-500 hover:text-[#5856D6] p-2 rounded-full hover:bg-purple-100"
                title="Edit Course"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
                  />
                </svg>
              </button>
            </div>

            <!-- Exam Details -->
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

            <!-- Topics Section -->
            <div class="space-y-2">
              <div class="grid grid-cols-12 gap-4 text-sm text-gray-500 font-semibold px-4">
                <div class="col-span-4">Name</div>
                <div class="col-span-2">Difficulty</div>
                <div class="col-span-2">Confidence</div>
                <div class="col-span-3 text-right">Study Time</div>
                <div class="col-span-1"></div>
              </div>
              <div
                v-for="topic in filteredTopics"
                :key="topic.id"
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

            <!-- Assignments Section -->
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
                  v-for="assignment in filteredAssignments"
                  :key="assignment.id"
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
                          :value="topic.id"
                          v-model="assignment.associatedTopicIds"
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
                        v-for="topic in assignment.associatedTopicIds"
                        :key="topic"
                        class="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium"
                      >
                        {{ getAssociatedTopicNames(assignment).join(', ') }}
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

        <!-- No Courses Found Message -->
        <div
          v-else
          class="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl"
        >
          <h2 class="text-2xl font-bold text-gray-700">No Courses Found</h2>
          <p class="mt-2 text-gray-500">
            Please go back to the 'Term & Course Setup' step to add at least one course.
          </p>
          <router-link
            to="/study-setup/term"
            class="mt-6 inline-block px-6 py-2 text-sm font-semibold text-black bg-[#FFC84A] rounded-full shadow-md hover:bg-[#fbc331]"
          >
            Go to Course Setup
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
