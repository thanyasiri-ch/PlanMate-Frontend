<script setup lang="ts">
import { ref, computed, onMounted, watch, watchEffect } from 'vue'
import { useStudySetupStore } from '@/stores/studySetup'
import type { AssignmentDTO, ExamDTO, TopicDTO, CourseDTO } from '@/types'
import { ExamType } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import cloneDeep from 'lodash/cloneDeep'

const store = useStudySetupStore()

// --- State ---
const selectedCourseCode = ref<string>('')
const selectedExamType = ref<ExamType>(ExamType.MIDTERM)
const isEditing = ref(false)
const isLoading = ref(true)

const localCourseDetails = ref<CourseDTO | null>(null)
const editableExam = ref<ExamDTO | null>(null)

// --- Computed Properties ---
const currentCourseData = computed<CourseDTO | null>(() => {
  if (isEditing.value) {
    return localCourseDetails.value
  }
  return store.term.courses.find((c) => c.courseCode === selectedCourseCode.value) ?? null
})

const coursesForSelection = computed(() => store.term.courses.filter((c) => c.courseCode && c.name))
const hasCourses = computed(() => coursesForSelection.value.length > 0)

const selectedExamDetails = computed(() => {
  const course = currentCourseData.value
  if (!course) return null
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
  isLoading.value = true
  try {
    await store.fetchAndSetTerm()
    if (hasCourses.value) {
      selectedCourseCode.value = coursesForSelection.value[0].courseCode ?? ''
    }
  } catch (err) {
    console.error('Failed to load term data on mount:', err)
    alert('Could not load study data. Please try again later.')
  } finally {
    isLoading.value = false
  }
})

watch(selectedCourseCode, (newCourseCode) => {
  if (!newCourseCode) return
  if (isEditing.value) {
    const confirm = window.confirm(
      'You have unsaved changes. Are you sure you want to switch? Your changes will be lost.',
    )
    if (confirm) {
      handleCancelEdit()
    } else {
      selectedCourseCode.value = currentCourseData.value?.courseCode ?? ''
      return
    }
  }
  const course = store.term.courses.find((c) => c.courseCode === newCourseCode)
  if (!course) return
  const hasMidterm = course.exams?.some((e) => e.type === ExamType.MIDTERM)
  if (hasMidterm) {
    selectedExamType.value = ExamType.MIDTERM
  } else {
    const hasFinal = course.exams?.some((e) => e.type === ExamType.FINAL)
    if (hasFinal) {
      selectedExamType.value = ExamType.FINAL
    }
  }
})

watch([selectedCourseCode, selectedExamType], (newValues, oldValues) => {
  if (isEditing.value && newValues[0] !== oldValues[0]) {
    return
  }
  if (isEditing.value) {
    syncEditableExam()
  }
})

// --- All other functions (syncEditableExam, enterEditMode, handleSave, etc.) ---
function syncEditableExam() {
  if (!isEditing.value || !localCourseDetails.value) {
    editableExam.value = null
    return
  }
  localCourseDetails.value.exams ??= []
  let examToEdit = localCourseDetails.value.exams.find((e) => e.type === selectedExamType.value)
  if (!examToEdit) {
    examToEdit = {
      id: uuidv4(),
      type: selectedExamType.value,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      courseId: localCourseDetails.value.courseId, // assign as number
    } as ExamDTO
    localCourseDetails.value.exams.push(examToEdit)
  }
  editableExam.value = examToEdit
}
function enterEditMode() {
  const courseFromStore = store.term.courses.find((c) => c.courseCode === selectedCourseCode.value)
  if (!courseFromStore) {
    console.error('Cannot enter edit mode: course not found in store.')
    return
  }
  localCourseDetails.value = cloneDeep(courseFromStore)
  localCourseDetails.value.exams ??= []
  localCourseDetails.value.topics ??= []
  localCourseDetails.value.assignments ??= []
  isEditing.value = true
  syncEditableExam()
}
function handleCancelEdit() {
  localCourseDetails.value = null
  editableExam.value = null
  isEditing.value = false
}
async function handleSave() {
  if (!localCourseDetails.value || !validateCourseDetails(localCourseDetails.value)) return
  try {
    await store.saveCourseDetails(localCourseDetails.value.courseCode, localCourseDetails.value)
    isEditing.value = false
    localCourseDetails.value = null
    editableExam.value = null
    alert('Course details saved successfully!')
  } catch (err) {
    console.error('Failed to save course details:', err)
    alert('There was an error saving your course data. Please check the console.')
  }
}
function validateCourseDetails(course: CourseDTO): boolean {
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
function addTopic() {
  if (!isEditing.value || !localCourseDetails.value || !editableExam.value) return
  const newTopic: TopicDTO = {
    id: uuidv4(),
    name: '',
    difficulty: 1,
    confidence: 1,
    estimatedStudyTime: 60,
    examType: editableExam.value.type,
  }
  localCourseDetails.value.topics ??= []
  localCourseDetails.value.topics.push(newTopic)
}
function deleteTopic(topic: TopicDTO) {
  if (!isEditing.value || !localCourseDetails.value?.topics) return
  const index = localCourseDetails.value.topics.findIndex((t) => t.id === topic.id)
  if (index > -1) {
    localCourseDetails.value.topics.splice(index, 1)
  }
}
function addAssignment() {
  if (!isEditing.value || !localCourseDetails.value || !editableExam.value) return
  const newAssignment: AssignmentDTO = {
    id: uuidv4(),
    name: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '23:59',
    estimatedTime: 60,
    associatedTopicIds: [],
    completed: false,
    examType: editableExam.value.type,
  }
  localCourseDetails.value.assignments ??= []
  localCourseDetails.value.assignments.push(newAssignment)
}
function deleteAssignment(assignment: AssignmentDTO) {
  if (!isEditing.value || !localCourseDetails.value?.assignments) return
  const index = localCourseDetails.value.assignments.findIndex((a) => a.id === assignment.id)
  if (index > -1) {
    localCourseDetails.value.assignments.splice(index, 1)
  }
}
function getAssociatedTopics(assignment: AssignmentDTO): TopicDTO[] {
  const course = currentCourseData.value
  if (!course || !course.topics || !assignment.associatedTopicIds) return []
  const topicsMap = new Map(course.topics.map((topic) => [topic.id, topic]))
  return assignment.associatedTopicIds
    .map((topicId) => topicsMap.get(topicId))
    .filter((topic): topic is TopicDTO => topic !== undefined)
}
function getAssociatedTopicNames(assignment: AssignmentDTO): string[] {
  return getAssociatedTopics(assignment).map((topic) => topic.name)
}
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

// --- DEBUGGING BLOCK (PLACE AT THE END) ---
// By placing this at the end, all variables and computed properties above are guaranteed to be initialized.
watchEffect(() => {
  console.group('--- DEBUG 3: Component State & Computed Properties ---')
  const course = currentCourseData.value
  console.log('Selected Course Code:', selectedCourseCode.value)
  console.log('Selected Exam Type:', selectedExamType.value)
  console.log('currentCourseData:', cloneDeep(course))
  if (course) {
    console.log('>>> Raw `exams` array in this course:', cloneDeep(course.exams))
    console.log('>>> Raw `assignments` array in this course:', cloneDeep(course.assignments))
  }
  console.log(
    '>>> selectedExamDetails (this controls the exam display):',
    cloneDeep(selectedExamDetails.value),
  )
  console.log('>>> filteredTopics:', cloneDeep(filteredTopics.value))
  console.log('>>> filteredAssignments:', cloneDeep(filteredAssignments.value))
  console.groupEnd()
})
</script>
<template>
  <div class="h-screen flex flex-col items-center">
    <div class="w-5/6 flex flex-col flex-1 overflow-hidden">
      <div class="flex-1 flex bg-white rounded-2xl p-6 sm:p-8 overflow-hidden">
        <div v-if="hasCourses" class="flex gap-6 flex-1 overflow-hidden">
          <div class="flex flex-col gap-2">
            <div class="flex bg-[#FFF1D1] rounded-full w-min mb-2">
              <button
                @click="selectedExamType = ExamType.MIDTERM"
                :class="[
                  'py-1 px-6 rounded-full text-sm',
                  selectedExamType === ExamType.MIDTERM
                    ? 'bg-[#FBCC69] text-[#2F2159] shadow font-bold'
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
                    ? 'bg-[#FBCC69] text-[#2F2159] shadow font-bold'
                    : 'bg-[#FFF1D1] text-[#A3A3A3] font-md',
                ]"
              >
                Final
              </button>
            </div>

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

          <div class="flex-1 overflow-y-auto pr-4" v-if="currentCourseData">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-baseline gap-4">
                <h2 class="text-xl font-bold text-gray-800">{{ currentCourseData.courseCode }}</h2>
                <h2 class="text-xl font-bold text-gray-800">{{ currentCourseData.name }}</h2>
              </div>
              <div v-if="isEditing" class="flex items-center space-x-2">
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

            <div
              v-if="selectedExamDetails"
              class="p-2 rounded-xl bg-[#fbcd6957] border border-[#FBCC69] mb-4 text-gray-800"
            >
              <div v-if="!isEditing" class="flex items-center gap-4">
                <div class="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
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
                v-for="topic in filteredTopics"
                :key="topic.id"
                class="bg-[#e2ecffa6] rounded-lg p-4 grid grid-cols-12 gap-4 items-center"
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
                        i <= topic.difficulty ? 'text-[#FBCC69]' : 'text-[#FBCC69] opacity-[.4]',
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
                        i <= topic.confidence ? 'text-[#FBCC69]' : 'text-[#FBCC69] opacity-[.4]',
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
                  <span v-else class="font-semibold text-gray-800"
                    >{{ topic.estimatedStudyTime }} min</span
                  >
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
                class="bg-[#e2ecffa6] p-4 rounded-lg space-y-3 mt-2 hover:opacity-75"
              >
                <button
                  @click="addTopic"
                  class="text-[#4454C0] px-3 py-1 text-md font-bold rounded-lg"
                >
                  + Add Topic
                </button>
              </div>
            </div>

            <div class="my-6"></div>

            <div>
              <div
                v-if="isEditing || filteredAssignments.length > 0"
                class="inline-block bg-[#FBCC69] text-[#2F2159] font-semibold py-1 px-4 rounded-full text-sm mb-4"
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
                  class="bg-[#e2ecffa6] rounded-lg p-4 grid grid-cols-12 gap-4 items-center"
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
                      class="h-6 w-6 rounded-full bg-[#FBCC69]"
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
                        v-for="(topicName, index) in getAssociatedTopicNames(assignment)"
                        :key="assignment.associatedTopicIds[index]"
                        class="text-xs bg-[#7486fb38] text-[#5668e0] px-2 py-1 rounded-full font-medium"
                      >
                        {{ topicName }}
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
                    <span v-else class="font-semibold text-gray-800"
                      >{{ assignment.estimatedTime }} min</span
                    >
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
                  class="bg-[#e2ecffa6] p-4 rounded-lg space-y-3 mt-2 hover:opacity-75"
                >
                  <button
                    @click="addAssignment"
                    class="text-[#4454C0] px-3 py-1 text-md font-bold rounded-lg"
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
            class="mt-6 inline-block px-6 py-2 text-sm font-semibold text-black bg-[#FBCC69] rounded-full shadow-md hover:bg-[#fbc331]"
          >
            Go to Course Setup
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
