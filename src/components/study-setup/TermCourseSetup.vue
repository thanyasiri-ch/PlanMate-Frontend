<script setup lang="ts">
import { useStudySetupStore } from '@/stores/studySetup'
import { ref, inject, watch, nextTick, type Ref, onMounted } from 'vue'

const store = useStudySetupStore()
const courseListRef = ref<HTMLElement | null>(null)
const isTermEditing = ref(true)
const isCoursesEditing = ref(true)

const stepNavigator = inject<{
  activateStep: (step: string) => void
  subStepIndex: Ref<number>
}>('stepNavigator')

const term = store.term

onMounted(() => {
  if (term.courses.length === 0) {
    term.courses.push({ id: '', name: '', credit: 0, assignments: [], exams: [], topics: [] })
  }
})

watch(
  () => term.courses.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      stepNavigator?.activateStep('course')
    }
  },
)

function validateTerm(): boolean {
  if (!term.name || !term.startDate || !term.endDate) {
    alert('Please fill in all term details: name, start date, and end date.')
    stepNavigator?.activateStep('term')
    return false
  }
  console.log('Term details validated.', {
    name: term.name,
    startDate: term.startDate,
    endDate: term.endDate,
  })
  return true
}

function validateCourses(): boolean {
  if (term.courses.length === 0) {
    alert('Please add at least one course to continue.')
    stepNavigator?.activateStep('course')
    return false
  }
  for (const [index, course] of term.courses.entries()) {
    if (!course.name?.trim()) {
      alert(`Course ${index + 1} is missing a name.`)
      stepNavigator?.activateStep('course')
      return false
    }
    if (!course.credit || course.credit <= 0) {
      alert(`Course "${course.name || `#${index + 1}`}" must have a valid credit value.`)
      stepNavigator?.activateStep('course')
      return false
    }
  }
  console.log('Courses validated.', term.courses)
  return true
}

function toggleTermEditMode() {
  // If we are currently editing, validate before switching to view mode.
  if (isTermEditing.value) {
    if (!validateTerm()) {
      return // Stop if validation fails
    }
  }
  isTermEditing.value = !isTermEditing.value
}

function toggleCoursesEditMode() {
  if (isCoursesEditing.value) {
    if (!validateCourses()) {
      return // Stop if validation fails
    }
  }
  isCoursesEditing.value = !isCoursesEditing.value
}

function addCourse() {
  term.courses.push({ id: '', name: '', credit: 0, assignments: [], exams: [], topics: [] })
  nextTick(() => {
    courseListRef.value?.scrollTo({ top: courseListRef.value.scrollHeight, behavior: 'smooth' })
  })
}

function removeCourse(index: number) {
  term.courses.splice(index, 1)
}

function submit(): boolean {
  if (!term.name || !term.startDate || !term.endDate) {
    alert('Please fill in all term details: name, start date, and end date.')
    stepNavigator?.activateStep('term')
    return false
  }
  if (term.courses.length === 0) {
    alert('Please add at least one course to continue.')
    stepNavigator?.activateStep('course')
    return false
  }
  for (const [index, course] of term.courses.entries()) {
    if (!course.name?.trim()) {
      alert(`Course ${index + 1} is missing a name.`)
      stepNavigator?.activateStep('course')
      return false
    }
    if (!course.credit || course.credit <= 0) {
      alert(`Course "${course.name || `#${index + 1}`}" must have a valid credit value.`)
      stepNavigator?.activateStep('course')
      return false
    }
  }
  console.log('Term and Courses saved to store:', store.term)
  return true
}

defineExpose({ submit })
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="w-2/3 flex flex-col flex-1 space-y-8 overflow-hidden">
      <!-- Term Section -->
      <div
        @click="isTermEditing ? stepNavigator?.activateStep('term') : null"
        class="bg-white rounded-2xl p-6 sm:p-8 transition-all duration-300 border-2"
        :class="{
          'border-[#5856D6]': stepNavigator?.subStepIndex.value === 0,
          'border-transparent': stepNavigator?.subStepIndex.value !== 0,
          'cursor-pointer': isTermEditing,
          'cursor-default': !isTermEditing,
        }"
      >
        <form @submit.prevent="submit">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-extrabold text-gray-700">Term</h3>
            <button
              @click.stop="toggleTermEditMode"
              type="button"
              class="text-gray-500 hover:text-[#5856D6] p-2 rounded-full hover:bg-purple-100 transition-colors"
              title="Toggle Term edit mode"
            >
              <svg
                v-if="!isTermEditing"
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
              <svg v-else class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-4 items-end">
            <div class="md:col-span-2">
              <label for="term" class="block text-sm font-medium text-gray-700 mb-1"
                >Term Name</label
              >
              <input
                type="text"
                id="term"
                v-model="term.name"
                class="w-full h-10 border bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm px-3 transition-colors disabled:border-transparent disabled:cursor-not-allowed"
                placeholder="e.g., 1/2025"
                required
                :disabled="!isTermEditing"
              />
            </div>

            <div class="md:col-span-2">
              <label for="start-date" class="block text-sm font-medium text-gray-700 mb-1"
                >Start Date</label
              >
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    class="w-5 h-5 text-[#5856D6]"
                    :class="{ 'opacity-50': !isTermEditing }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="date"
                  id="start-date"
                  v-model="term.startDate"
                  class="block w-full h-10 pl-10 pr-3 py-2 border bg-[#F1EFFF] font-semibold rounded-xl focus:outline-none sm:text-sm transition-colors disabled:border-transparent disabled:cursor-not-allowed"
                  :class="[
                    {
                      'text-gray-400': !term.startDate,
                      'text-[#5856D6]': term.startDate
                    },
                    isTermEditing ? 'border-[#5856D6]' : 'border-transparent',
                  ]"
                  :disabled="!isTermEditing"
                />
              </div>
            </div>

            <div class="md:col-span-2">
              <label for="end-date" class="block text-sm font-medium text-gray-700 mb-1"
                >End Date</label
              >
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    class="w-5 h-5 text-[#5856D6]"
                    :class="{ 'opacity-50': !isTermEditing }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="date"
                  id="end-date"
                  v-model="term.endDate"
                  class="block w-full h-10 pl-10 pr-3 py-2 border bg-[#F1EFFF] font-semibold rounded-xl focus:outline-none sm:text-sm transition-colors disabled:border-transparent disabled:cursor-not-allowed"
                  :class="[
                    {
                      'text-gray-400': !term.endDate,
                      'text-[#5856D6]': term.endDate
                    },
                    isTermEditing ? 'border-[#5856D6]' : 'border-transparent',
                  ]"
                  :disabled="!isTermEditing"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Courses Section -->
      <div
        @click="isCoursesEditing ? stepNavigator?.activateStep('course') : null"
        class="flex-1 overflow-hidden bg-white rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 border-2"
        :class="{
          'border-[#5856D6]': stepNavigator?.subStepIndex.value === 1,
          'border-transparent': stepNavigator?.subStepIndex.value !== 1,
          'cursor-pointer': isCoursesEditing,
          'cursor-default': !isCoursesEditing,
        }"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-extrabold text-gray-900">Courses</h3>
          <button
            @click.stop="toggleCoursesEditMode"
            type="button"
            class="text-gray-500 hover:text-[#5856D6] p-2 rounded-full hover:bg-purple-100 transition-colors"
            title="Toggle Courses edit mode"
          >
            <svg
              v-if="!isCoursesEditing"
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
            <svg v-else class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div
          class="hidden sm:grid grid-cols-12 gap-4 text-gray-500 font-semibold text-sm mb-2 px-1"
        >
          <div class="col-span-3">Course ID</div>
          <div class="col-span-6">Course Name</div>
          <div class="col-span-2">Credit</div>
          <div v-if="isCoursesEditing" class="col-span-1 text-right">Delete</div>
        </div>

        <div ref="courseListRef" class="flex-1 min-h-0 overflow-y-auto space-y-4 mb-4 rounded-xl">
          <div v-for="(c, index) in term.courses" :key="index" class="grid grid-cols-12 gap-4">
            <input
              v-model="c.id"
              type="text"
              class="col-span-3 h-8 px-3 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm disabled:border-transparent disabled:cursor-not-allowed"
              placeholder="e.g. CS101"
              :disabled="!isCoursesEditing"
            />
            <input
              v-model="c.name"
              type="text"
              class="col-span-6 h-8 px-3 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm disabled:border-transparent disabled:cursor-not-allowed"
              placeholder="e.g. Computer Science"
              :disabled="!isCoursesEditing"
            />
            <input
              v-model.number="c.credit"
              type="number"
              class="col-span-2 h-8 px-3 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm d disabled:border-transparent disabled:cursor-not-allowed"
              placeholder="e.g. 3"
              :disabled="!isCoursesEditing"
            />
            <div v-if="isCoursesEditing" class="col-span-1 flex justify-end items-center">
              <button
                @click="removeCourse(index)"
                type="button"
                class="flex items-center justify-center w-9 h-9 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                title="Delete course"
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
            <div v-else class="col-span-1"></div>
          </div>
        </div>

        <div v-if="isCoursesEditing" class="flex justify-center">
          <button
            @click="addCourse"
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1 bg-[#5856D6] text-white font-bold rounded-xl shadow-md hover:bg-[#4b49b4] transition-colors"
          >
            <svg
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
