<script setup lang="ts">
import { useStudySetupStore } from '@/stores/studySetup'
import type { TermDTO, CourseDTO } from '@/types'
import { ref, nextTick } from 'vue'

const emit = defineEmits(['next'])
const store = useStudySetupStore()
const courseListRef = ref<HTMLElement | null>(null)

// --- Component State ---
const term = ref<TermDTO>({
  name: '',
  startDate: '',
  endDate: '',
  courses: [{ id: '', name: '', credit: 0, topics: [], assignments: [], exams: [] }],
})

const course = ref<CourseDTO>({
  id: '',
  name: '',
  credit: 0,
  topics: [],
  assignments: [],
  exams: [],
})

// Methods
function addCourse() {
  term.value.courses.push({
    ...course.value,
    credit: Number(course.value.credit),
    topics: [],
    assignments: [],
    exams: [],
  })

  course.value = { id: '', name: '', credit: 0, topics: [], assignments: [], exams: [] }

  // Scroll to bottom after DOM updates
  nextTick(() => {
    if (courseListRef.value) {
      courseListRef.value.scrollTop = courseListRef.value.scrollHeight - courseListRef.value.clientHeight
    }
  })
}

function removeCourse(index: number) {
  term.value.courses.splice(index, 1)
}

function submit(): boolean {
  console.log('SUBMITTING: submit() function in child component was called.')
  if (term.value.courses.length === 0) {
    alert('Please add at least one course to continue.')
    return false
  }
  store.setTerm(term.value)
  emit('next')
  return true
}
</script>

<template>
  <div class="bg-[#DCD7FF] flex flex-col items-center">
    <div class="w-3xl flex flex-col flex-1 space-y-8 overflow-hidden">

      <!-- Term Form -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <form @submit.prevent="submit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Term Name -->
            <div class="flex items-center gap-4">
              <label for="term" class="text-md font-extrabold text-gray-700 whitespace-nowrap">Term</label>
              <input
                type="text"
                id="term"
                v-model="term.name"
                class="w-1/2 h-8 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm px-3"
                placeholder="e.g., 1/2025"
                required
              />
            </div>
            <div class="hidden sm:block"></div>

            <!-- Start Date -->
            <div>
              <label for="start-date" class="block text-sm font-medium text-gray-700">Start</label>
              <div class="relative mt-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-[#5856D6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="date"
                  id="start-date"
                  v-model="term.startDate"
                  class="block w-full h-8 pl-10 pr-3 py-2 border border-[#5856D6] bg-[#F1EFFF] font-semibold rounded-xl focus:outline-none sm:text-sm"
                  :class="{
                    'text-gray-400': !term.startDate,
                    'text-[#5856D6]': term.startDate,
                  }"
                />
              </div>
            </div>

            <!-- End Date -->
            <div>
              <label for="end-date" class="block text-sm font-medium text-gray-700">End</label>
              <div class="relative mt-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-[#5856D6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="date"
                  id="end-date"
                  v-model="term.endDate"
                  class="block w-full h-8 pl-10 pr-3 py-2 border border-[#5856D6] bg-[#F1EFFF] font-semibold rounded-xl focus:outline-none sm:text-sm"
                  :class="{
                    'text-gray-400': !term.endDate,
                    'text-[#5856D6]': term.endDate,
                  }"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Courses Section -->
      <div class="flex-1 overflow-hidden bg-white rounded-2xl p-6 sm:p-8 flex flex-col">
        <h3 class="text-md font-extrabold text-gray-900 mb-3">Courses</h3>

        <!-- Table Header -->
        <div class="hidden sm:grid grid-cols-12 gap-4 text-gray-500 font-semibold text-sm mb-2 px-1">
          <div class="col-span-3">Course ID</div>
          <div class="col-span-6">Course Name</div>
          <div class="col-span-2">Credit</div>
          <div class="col-span-1 text-right">Delete</div>
        </div>

        <!-- Scrollable Course List -->
        <div ref="courseListRef" class="flex-1 min-h-0 overflow-y-auto space-y-4 mb-4 rounded-xl">
          <div
            v-for="(c, index) in term.courses"
            :key="index"
            class="grid grid-cols-12 gap-4 mb-2"
          >
            <input
              v-model="c.id"
              type="text"
              class="col-span-3 h-8 px-3 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm"
              placeholder="e.g. CS101"
            />
            <input
              v-model="c.name"
              type="text"
              class="col-span-6 h-8 px-3 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm"
              placeholder="e.g. Computer Science"
            />
            <input
              v-model.number="c.credit"
              type="number"
              class="col-span-2 h-8 px-3 border border-[#5856D6] bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm"
              placeholder="e.g. 3"
            />
            <div class="col-span-1 flex justify-end items-center">
              <button
                @click="removeCourse(index)"
                type="button"
                class="flex items-center justify-center w-9 h-9 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                title="Delete course"
              >
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Add Course Button -->
        <div class="flex justify-center">
          <button
            @click="addCourse"
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1 bg-[#5856D6] text-white font-bold rounded-xl shadow-md hover:bg-[#4b49b4] transition-colors"
          >
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
