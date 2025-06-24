<script setup lang="ts">
import { useStudySetupStore } from '@/stores/studySetup'
import { ref, inject, watch, nextTick, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { TermResponseDTO, CourseResponseDTO } from '@/types'
import cloneDeep from 'lodash/cloneDeep'

const route = useRoute()
const store = useStudySetupStore()

// --- REFACTORED STATE MANAGEMENT ---
const localTerm = ref<TermResponseDTO | null>(null)
const isLoading = ref(true)
const courseListRef = ref<HTMLElement | null>(null)

const isTermEditing = ref(false)
const isCoursesEditing = ref(false)

const stepNavigator = inject<{
  activateStep: (string) => void
  subStepIndex: Ref<number>
}>('stepNavigator')

// --- REFACTORED DATA LOADING ---
watch(
  () => route.params.id,
  async (newId) => {
    isLoading.value = true
    const termId = Number(newId)

    if (termId && !isNaN(termId) && termId !== 0) { // Check for non-zero termId
      // --- EDITING AN EXISTING TERM ---
      try {
        console.log(`COMPONENT: Route detected termId: ${termId}. Fetching...`)
        const fetchedTerm = await store.fetchAndSetTerm(termId)
        localTerm.value = cloneDeep(fetchedTerm)
        isTermEditing.value = false
        isCoursesEditing.value = false
      } catch (err) {
        console.error('COMPONENT: Failed to load term data.', err)
        // TODO: Show an error message to the user in the UI, e.g., a toast notification
      }
    } else {
      // --- CREATING A NEW TERM ---
      console.log('COMPONENT: No valid termId in route. Setting up for new term.')
      store.reset() // Ensure the store is clean for a new term
      // Manually initialize localTerm for a new term, ensuring termId is 0
      localTerm.value = {
        termId: 0, // Crucial: Indicate no ID yet
        name: '',
        startDate: '',
        endDate: '',
        courses: [],
      }
      isTermEditing.value = true
      isCoursesEditing.value = true
    }
    isLoading.value = false
  },
  { immediate: true }
)

// Watch for courses being added to scroll the view
watch(
  () => localTerm.value?.courses.length,
  (newLength, oldLength) => {
    if (newLength && oldLength !== undefined && newLength > oldLength) { // Check oldLength is defined
      nextTick(() => { // Wait for DOM update
        stepNavigator?.activateStep('course')
        // Give a little more time for the scroll to happen if needed
        setTimeout(() => {
          courseListRef.value?.scrollTo({ top: courseListRef.value.scrollHeight, behavior: 'smooth' })
        }, 100);
      })
    }
  }
)

// --- REFACTORED VALIDATION ---
function validateTerm(termToValidate: TermResponseDTO | null): boolean {
  if (!termToValidate?.name || !termToValidate.startDate || !termToValidate.endDate) {
    alert('Please fill in all term details: name, start date, and end date.')
    stepNavigator?.activateStep('term')
    return false
  }
  // Add more robust date validation if needed (e.g., startDate < endDate)
  return true
}

function validateCourses(coursesToValidate: CourseResponseDTO[]): boolean {
  if (coursesToValidate.length === 0) {
    alert('Please add at least one course to continue.')
    stepNavigator?.activateStep('course')
    return false
  }
  for (const [index, course] of coursesToValidate.entries()) {
    if (!course.courseCode?.trim()) {
      alert(`Course ${index + 1} is missing a Course Code.`) // Changed from Course ID for clarity
      stepNavigator?.activateStep('course')
      return false
    }
    if (!course.name?.trim()) {
      alert(`Course ${index + 1} is missing a Name.`)
      stepNavigator?.activateStep('course')
      return false
    }
    if (course.credit === null || course.credit === undefined || course.credit <= 0) {
      alert(`Course ${index + 1} has an invalid Credit value.`)
      stepNavigator?.activateStep('course')
      return false
    }
    // Add other course validation checks here...
  }
  return true
}

// --- REFACTORED ACTIONS ---
async function handleSaveTerm() {
  if (!validateTerm(localTerm.value)) return
  if (!localTerm.value) return

  try {
    // Call the new centralized store action that handles create/update
    const savedTerm = await store.saveOrUpdateTerm(localTerm.value)
    // After a successful save, update the local copy to match the now-updated store,
    // especially crucial for new terms where termId is now assigned.
    localTerm.value = cloneDeep(savedTerm) // Use 'savedTerm' directly as it's the latest
    isTermEditing.value = false // Exit edit mode
    // If it was a new term, and we got an ID, we might want to navigate
    // to the URL with the new ID. This is often handled at a higher level (e.g., a "Next" button).
    // router.push({ name: 'setupTerm', params: { id: savedTerm.termId } });
  } catch (err) {
    console.error('Failed to save the term:', err);
    alert('Failed to save the term. Please check the console for details.');
  }
}

function enterTermEditMode() {
    isTermEditing.value = true;
}

function handleCancelTermEdit() {
    // If cancelling a *new* term, might want to navigate away or completely reset.
    // For existing terms, just revert local changes.
    if (localTerm.value?.termId === 0) {
        // If it was a new term and we cancel, maybe navigate back or to a clean state.
        // For now, just reset local state to initial new term values.
        localTerm.value = {
            termId: 0,
            name: '',
            startDate: '',
            endDate: '',
            courses: [],
        };
    } else {
        // For existing terms, revert to the store's current state.
        localTerm.value = cloneDeep(store.term);
    }
    isTermEditing.value = false;
}

async function handleSaveCourses() {
  // Only proceed if term has an ID (i.e., it's been saved at least once)
  if (!localTerm.value || !localTerm.value.termId || localTerm.value.termId === 0) {
    alert('Please save the term details first before saving courses.');
    stepNavigator?.activateStep('term');
    return;
  }
  if (!validateCourses(localTerm.value.courses)) return

  try {
    // Pass the courses from the localTerm
    await store.saveCourses(localTerm.value.courses)
    // After saving courses, it might be good practice to refetch the term
    // to ensure the localTerm reflects any backend updates, though not strictly
    // necessary if `saveCourses` just persists and doesn't return the full term.
    const fetchedTerm = await store.fetchAndSetTerm(localTerm.value.termId);
    localTerm.value = cloneDeep(fetchedTerm); // Update local copy from fresh store state
    isCoursesEditing.value = false
  } catch(err) {
    console.error('Failed to save courses:', err);
    alert('Failed to save courses. Please check the console for details.')
  }
}

function enterCoursesEditMode() {
    isCoursesEditing.value = true;
}

function handleCancelCoursesEdit() {
    // Revert local course changes by re-cloning from the store's pristine state
    localTerm.value = cloneDeep(store.term);
    isCoursesEditing.value = false;
}

// --- LOCAL DATA MANIPULATION (on localTerm.value) ---
function addCourse() {
  if (!localTerm.value) return
  localTerm.value.courses.push({
    courseCode: '',
    name: '',
    credit: 0,
    assignments: [],
    exams: [],
    topics: [],
    // When adding a new course to a localTerm, its courseId.termId should reflect localTerm.value.termId
    // If localTerm.value.termId is 0 (new term), this will be 0, which is fine until the term is saved.
    courseId: { termId: localTerm.value.termId, courseCode: '' },
  })
  nextTick(() => {
    courseListRef.value?.scrollTo({ top: courseListRef.value.scrollHeight, behavior: 'smooth' })
  })
}

function removeCourse(index: number) {
  if (!localTerm.value) return
  localTerm.value.courses.splice(index, 1)
  // TODO: Implement deletion logic for the backend if course already saved
}
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="localTerm" class="flex flex-col items-center">
    <div class="w-2/3 flex flex-col flex-1 space-y-8 overflow-hidden">
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
        <form @submit.prevent="handleSaveTerm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-extrabold text-gray-700">Term</h3>
            <div v-if="isTermEditing" class="flex items-center space-x-2">
                <button
                    @click="handleCancelTermEdit"
                    type="button"
                    class="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
                    title="Cancel"
                >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <button
                    type="submit"
                    class="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-100"
                    title="Save Term"
                >
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                </button>
            </div>
            <button
                v-else
                @click.stop="enterTermEditMode"
                type="button"
                class="text-gray-500 hover:text-[#5856D6] p-2 rounded-full hover:bg-purple-100"
                title="Edit Term"
            >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-4 items-end">
            <div class="md:col-span-2">
              <label for="term" class="block text-sm font-medium text-gray-700 mb-1">Term Name</label>
              <input
                type="text"
                id="term"
                v-model="localTerm.name"
                class="w-full h-10 border bg-[#F1EFFF] text-[#5856D6] font-semibold rounded-xl focus:outline-none sm:text-sm px-3 transition-colors disabled:border-transparent disabled:cursor-not-allowed"
                placeholder="e.g., 1/2025"
                required
                :disabled="!isTermEditing"
              />
            </div>

            <div class="md:col-span-2">
              <label for="start-date" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-[#5856D6]" :class="{ 'opacity-50': !isTermEditing }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="date"
                  id="start-date"
                  v-model="localTerm.startDate"
                  class="block w-full h-10 pl-10 pr-3 py-2 border bg-[#F1EFFF] font-semibold rounded-xl focus:outline-none sm:text-sm transition-colors disabled:border-transparent disabled:cursor-not-allowed"
                  :class="[
                    { 'text-gray-400': !localTerm.startDate, 'text-[#5856D6]': localTerm.startDate, },
                    isTermEditing ? 'border-[#5856D6]' : 'border-transparent',
                  ]"
                  :disabled="!isTermEditing"
                />
              </div>
            </div>

            <div class="md:col-span-2">
              <label for="end-date" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-[#5856D6]" :class="{ 'opacity-50': !isTermEditing }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="date"
                  id="end-date"
                  v-model="localTerm.endDate"
                  class="block w-full h-10 pl-10 pr-3 py-2 border bg-[#F1EFFF] font-semibold rounded-xl focus:outline-none sm:text-sm transition-colors disabled:border-transparent disabled:cursor-not-allowed"
                  :class="[
                    { 'text-gray-400': !localTerm.endDate, 'text-[#5856D6]': localTerm.endDate, },
                    isTermEditing ? 'border-[#5856D6]' : 'border-transparent',
                  ]"
                  :disabled="!isTermEditing"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

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
            v-if="!isCoursesEditing"
            @click.stop="enterCoursesEditMode"
            type="button"
            class="text-gray-500 hover:text-[#5856D6] p-2 rounded-full hover:bg-purple-100"
            title="Edit Courses"
           >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
           </button>
           <button
            v-else
            @click.stop="handleSaveCourses"
            type="button"
            class="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-100"
            title="Save Courses"
           >
             <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
           </button>
        </div>

        <div class="hidden sm:grid grid-cols-12 gap-4 text-gray-500 font-semibold text-sm mb-2 px-1">
          <div class="col-span-3">Course ID</div>
          <div class="col-span-6">Course Name</div>
          <div class="col-span-2">Credit</div>
          <div v-if="isCoursesEditing" class="col-span-1 text-right">Delete</div>
        </div>

        <div ref="courseListRef" class="flex-1 min-h-0 overflow-y-auto space-y-4 mb-4 rounded-xl">
          <div v-for="(c, index) in localTerm.courses" :key="index" class="grid grid-cols-12 gap-4">
            <input
              v-model="c.courseCode"
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
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
