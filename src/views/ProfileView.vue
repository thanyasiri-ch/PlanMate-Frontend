<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStudyPreferencesStore } from '@/stores/studyPref'
import { useStudyAnalyticsStore, getColorFromClass } from '@/stores/studyAnalytics'
import type { PreferredStudyTime, RevisionFrequency, BreakDuration, StudyPreference } from '@/types'
import Slider from '@vueform/slider'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StatGoalPopup from '@/components/StatGoalPopup.vue'

const router = useRouter()
const authStore = useAuthStore()

// == study analytics ==
const totalFocusDuration = computed(() => analyticsStore.totalFocusDuration)
const totalFocusCompletion = computed(() => analyticsStore.totalCompletedFocusSessions)
const barChartData = computed(() => analyticsStore.barChartData)
const pieChartData = computed(() => analyticsStore.pieChartData)
const isEditing = ref(false)
const selectedTimeRange = ref<'Day' | 'Week' | 'Month' | 'Year'>('Month')
const analyticsStore = useStudyAnalyticsStore()
const ranges = ['Day', 'Week', 'Month', 'Year'] as const
const transitionDirection = ref<'left' | 'right'>('right')
const transitionName = computed(() => `slide-${transitionDirection.value}`)

const currentDate = ref(new Date())
const timeRangeOptions: Array<'Day' | 'Week' | 'Month' | 'Year'> = ['Day', 'Week', 'Month', 'Year']

const displayDateLabel = computed(() => {
  const options: Intl.DateTimeFormatOptions =
    selectedTimeRange.value === 'Day'
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : selectedTimeRange.value === 'Week'
        ? {} // We'll manually format week range below
        : selectedTimeRange.value === 'Month'
          ? { year: 'numeric', month: 'short' }
          : { year: 'numeric' }

  if (selectedTimeRange.value === 'Week') {
    const start = new Date(currentDate.value)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Start on Monday
    const weekStart = new Date(start.setDate(diff))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
    return `${fmt.format(weekStart)} – ${fmt.format(weekEnd)}, ${weekEnd.getFullYear()}`
  }

  return new Intl.DateTimeFormat('en', options).format(currentDate.value)
})

const incrementDate = () => {
  const d = new Date(currentDate.value)
  if (selectedTimeRange.value === 'Day') {
    d.setDate(d.getDate() + 1)
  } else if (selectedTimeRange.value === 'Week') {
    d.setDate(d.getDate() + 7)
  } else if (selectedTimeRange.value === 'Month') {
    d.setMonth(d.getMonth() + 1)
  } else if (selectedTimeRange.value === 'Year') {
    d.setFullYear(d.getFullYear() + 1)
  }
  currentDate.value = d
}

const decrementDate = () => {
  const d = new Date(currentDate.value)
  if (selectedTimeRange.value === 'Day') {
    d.setDate(d.getDate() - 1)
  } else if (selectedTimeRange.value === 'Week') {
    d.setDate(d.getDate() - 7)
  } else if (selectedTimeRange.value === 'Month') {
    d.setMonth(d.getMonth() - 1)
  } else if (selectedTimeRange.value === 'Year') {
    d.setFullYear(d.getFullYear() - 1)
  }
  currentDate.value = d
}

const pieGradientStyle = computed(() => {
  if (!analyticsStore.pieChartData.length) return ''

  const gradientParts: string[] = []
  let currentPercent = 0

  analyticsStore.pieChartData.forEach((item) => {
    const start = currentPercent
    const end = currentPercent + item.value
    gradientParts.push(`${getColorFromClass(item.colorClass)} ${start}% ${end}%`)
    currentPercent = end
  })

  return `conic-gradient(${gradientParts.join(', ')})`
})

function computeDirection(prevIndex: number, newIndex: number) {
  const n = ranges.length
  const rawDiff = newIndex - prevIndex
  const diff = (rawDiff + n) % n

  console.log('[computeDirection]', {
    prevIndex,
    newIndex,
    rawDiff,
    diff,
    chosen: diff === n / 2 ? (rawDiff > 0 ? 'right' : 'left') : diff < n / 2 ? 'right' : 'left',
  })

  if (prevIndex === newIndex) return transitionDirection.value
  if (diff === n / 2) return rawDiff > 0 ? 'right' : 'left'
  return diff < n / 2 ? 'right' : 'left'
}

function setSelectedRange(newRange: (typeof ranges)[number]) {
  const prevIndex = ranges.indexOf(selectedTimeRange.value)
  const newIndex = ranges.indexOf(newRange)
  const dir = computeDirection(prevIndex, newIndex)
  console.log('[range] setSelectedRange', {
    prevIndex,
    newIndex,
    dir,
    prevRange: selectedTimeRange.value,
    newRange,
  })
  transitionDirection.value = dir
  selectedTimeRange.value = newRange
}

function handleBarClick(item: any) {
  const current = selectedTimeRange.value
  let newRange = current

  if (current === 'Month' || current === 'Week') {
    newRange = 'Day'
    currentDate.value = new Date(item.date)
  } else if (current === 'Year') {
    newRange = 'Month'
    currentDate.value = new Date(item.date + '-01')
  } else {
    // no-op for Day by default
    newRange = current
  }

  setSelectedRange(newRange)

  requestAnimationFrame(() => {
    document.querySelector('#bar-chart-section')?.scrollIntoView({ behavior: 'smooth' })
  })
}

// == profile ==
const editDisplayName = ref(authStore.displayName)
const editImageFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const startEditing = () => {
  isEditing.value = true
  editDisplayName.value = authStore.displayName
  previewUrl.value = authStore.image // Set initial preview to current image
}

const saveProfile = async () => {
  try {
    await authStore.updateUserProfile(editDisplayName.value, editImageFile.value)
    isEditing.value = false
    editImageFile.value = null
    previewUrl.value = null
  } catch (error) {
    console.error('Failed to update profile:', error)
    alert('Failed to update profile. Please try again.')
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editImageFile.value = null
  previewUrl.value = null // Reset preview
}

watch(
  [selectedTimeRange, currentDate],
  ([range, date]) => {
    analyticsStore.fetchAnalytics(range, date)
  },
  { immediate: true },
)

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', (error as Error).message)
  }
}

function triggerImageUpload() {
  fileInput.value?.click()
}

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    editImageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

// == study pref ==
const studyPrefStore = useStudyPreferencesStore()
const isEditingStudyPreferences = ref(false)

// ** Options for the form, derived from your types **
const studyTimeOptions: PreferredStudyTime[] = [
  'early morning',
  'late morning',
  'afternoon',
  'evening',
  'night',
  'late night',
]
const reviewStyleOptions: RevisionFrequency[] = [
  'single deep review before exam',
  '2-3 reviews sessions per topic',
  'daily review sessions',
]
const breakOptions: BreakDuration[] = [5, 10, 15, 20, 25, 30]

// ** Reactive state for the form fields **
const selectedStudyTimes = ref<PreferredStudyTime[]>([])
const sessionDurationRange = ref<[number, number]>([30, 180])
const selectedReviewStyle = ref<RevisionFrequency | null>(null)
const selectedBreakTime = ref<BreakDuration | null>(null)

// ** Function to start editing and populate the form **
const startEditingStudyPreferences = () => {
  const currentPrefs = studyPrefStore.preferences
  if (currentPrefs) {
    // Populate form fields with existing preferences from the store
    // A shallow copy ([...]) is sufficient here to prevent direct mutation
    selectedStudyTimes.value = [...currentPrefs.preferredStudyTimes]
    sessionDurationRange.value = [currentPrefs.minSessionDuration, currentPrefs.maxSessionDuration]
    selectedReviewStyle.value = currentPrefs.revisionFrequency
    selectedBreakTime.value = currentPrefs.breakDurations
  } else {
    // Reset to default values if no preferences exist yet (first-time setup)
    selectedStudyTimes.value = []
    sessionDurationRange.value = [30, 60]
    selectedReviewStyle.value = null
    selectedBreakTime.value = null
  }
  isEditingStudyPreferences.value = true
}

// ** Function to toggle study times **
const toggleStudyTime = (time: PreferredStudyTime) => {
  const index = selectedStudyTimes.value.indexOf(time)
  if (index > -1) {
    selectedStudyTimes.value.splice(index, 1)
  } else {
    selectedStudyTimes.value.push(time)
  }
}

// ** Function to save the form data **
const saveStudyPreferences = async () => {
  // Basic validation
  if (
    selectedStudyTimes.value.length === 0 ||
    !selectedReviewStyle.value ||
    !selectedBreakTime.value
  ) {
    alert('Please complete all study preference options.')
    return
  }

  const newPreferences: StudyPreference = {
    preferredStudyTimes: selectedStudyTimes.value,
    minSessionDuration: sessionDurationRange.value[0],
    maxSessionDuration: sessionDurationRange.value[1],
    revisionFrequency: selectedReviewStyle.value,
    breakDurations: selectedBreakTime.value,
  }

  const success = await studyPrefStore.saveOrUpdatePreferences(newPreferences)
  if (success) {
    isEditingStudyPreferences.value = false
  } else {
    alert('Failed to save preferences. Please try again.')
  }
}

const cancelStudyPreferencesEdit = () => {
  isEditingStudyPreferences.value = false
}

// Mappings for displaying preferences
const timeDisplayMap: Record<PreferredStudyTime, string> = {
  'early morning': 'Early Morning',
  'late morning': 'Late Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  'late night': 'Late Night',
}

const revisionDisplayMap: Record<RevisionFrequency, string> = {
  'single deep review before exam': 'Single Deep Review Before Exam',
  '2-3 reviews sessions per topic': '2-3 Reviews Per Topic',
  'daily review sessions': 'Daily Review Sessions',
}

// Computed property to display formatted preferences
const displayedPreferences = computed(() => {
  const prefs = studyPrefStore.preferences
  if (!prefs) return []
  return [
    {
      label: 'Preferred study times',
      value:
        prefs.preferredStudyTimes.map((time) => timeDisplayMap[time] || time).join(', ') || 'None',
    },
    {
      label: 'Preferred session duration',
      value: `${prefs.minSessionDuration}–${prefs.maxSessionDuration} mins`,
    },
    {
      label: 'Review style',
      value: revisionDisplayMap[prefs.revisionFrequency] || prefs.revisionFrequency,
    },
    { label: 'Break preference', value: `${prefs.breakDurations} minutes` },
  ]
})

onMounted(() => {
  if (authStore.user) {
    studyPrefStore.fetchPreferences()
  } else {
    // This logic assumes checkAuthStatus synchronously updates the store or is followed by a redirect.
    // In a real-world app, you might use a watcher or await the check.
    authStore.checkAuthStatus()
    if (!authStore.user) {
      router.push({ name: 'login' })
    } else {
      studyPrefStore.fetchPreferences()
    }
  }
})

const barGap = computed(() => {
  switch (selectedTimeRange.value) {
    case 'Day':
      return 6
    case 'Week':
      return 20
    case 'Month':
      return 4
    case 'Year':
      return 10
    default:
      return 2
  }
})

const timeRangeLabel = computed(() => {
  switch (selectedTimeRange.value) {
    case 'Day':
      return 'Daily focus activity'
    case 'Week':
      return 'Weekly focus activity'
    case 'Month':
      return 'Monthly focus activity'
    case 'Year':
      return 'Yearly focus activity'
    default:
      return 'Focus activity'
  }
})
</script>
<template>
  <DefaultLayout>
    <div class="grid flex-1 place-items-center m-8 px-6 pb-8 overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <!-- Left 2/3 section -->
        <section class="lg:col-span-2 bg-white rounded-2xl p-5 flex flex-col h-full">
          <!-- Top controls -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <!-- Year controls -->
            <div class="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <button @click="decrementDate" class="p-1 text-white bg-[#2F2159] rounded-full">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="4"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span class="font-extrabold">{{ displayDateLabel }}</span>
              <button @click="incrementDate" class="p-1 text-white bg-[#2F2159] rounded-full">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="4"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <!-- Time Range -->
            <div class="flex items-center bg-[#FFE7AF] text-[#2F2159] rounded-full p-0.5">
              <button
                v-for="range in timeRangeOptions"
                :key="range"
                @click="setSelectedRange(range)"
                :class="[
                  'px-5 py-1 font-extrabold rounded-4xl transition-colors',
                  selectedTimeRange === range
                    ? 'bg-[#FBCC69] shadow border-2 border-[#2F2159]'
                    : 'hover:bg-[#ffc94a85]',
                ]"
              >
                {{ range }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <div class="flex flex-col gap-4 mb-4">
              <StatGoalPopup
                :totalFocusDuration="+analyticsStore.totalFocusDuration"
                :goalMinutes="90"
              />
              <div class="flex justify-between gap-4">
                <div class="bg-[#E2EAFC] rounded-xl p-4 text-center text-[#3e3683] flex-1 max-w-s">
                  <h3 class="text-sm font-medium text-black mb-1">Focus completion</h3>
                  <p class="text-lg font-bold text-[#544BAA]">
                    {{ totalFocusCompletion }} sessions
                  </p>
                </div>

                <div class="bg-[#E2EAFC] rounded-xl p-4 text-center text-[#544BAA] flex-1 max-w-s">
                  <h3 class="text-sm font-medium text-black mb-1">Focus duration</h3>
                  <p class="text-lg font-bold text-[#544BAA]">{{ totalFocusDuration }}</p>
                </div>
              </div>

              <div class="bg-[#E2EAFC] rounded-xl p-4 flex flex-col">
                <h2 class="text-lg font-bold text-gray-700 mb-2 text-center">Bar chart</h2>

                <transition :name="transitionName" mode="out-in">
                  <div
                    :key="selectedTimeRange + '-' + currentDate.getTime()"
                    class="flex justify-center h-40 w-full px-2"
                    :style="{ gap: barGap + 'px', paddingLeft: '8px', paddingRight: '8px' }"
                  >
                    <div
                      v-for="item in barChartData"
                      :key="item.date"
                      class="flex flex-col items-center justify-end flex-1 relative group"
                    >
                      <!-- Tooltip -->
                      <div
                        v-if="item.minutes > 0"
                        class="absolute bottom-full mb-2 px-2 py-1 rounded bg-gray-700 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                      >
                        <template v-if="item.minutes < 60"> {{ item.minutes }}m </template>
                        <template v-else>
                          {{ Math.floor(item.minutes / 60) }}h
                          <span v-if="item.minutes % 60 > 0"> {{ item.minutes % 60 }}m </span>
                        </template>
                      </div>

                      <!-- Bar -->
                      <div
                        class="bg-[#4454C0] rounded-t transition-all duration-300 w-full group-hover:scale-105 cursor-pointer"
                        :style="{ height: item.heightPercent + '%' }"
                        @click="handleBarClick(item)"
                      ></div>
                    </div>
                  </div>
                </transition>

                <div class="border-t-2 border-gray-300 w-full my-1"></div>

                <div
                  class="flex justify-center w-full px-2"
                  :style="{ gap: barGap + 'px', paddingLeft: '8px', paddingRight: '8px' }"
                >
                  <div
                    v-for="item in barChartData"
                    :key="item.date + '-label'"
                    class="flex justify-center flex-1"
                  >
                    <span class="text-xs text-gray-500">{{ item.label }}</span>
                  </div>
                </div>

                <p class="text-center text-xs text-gray-400 mt-2">
                  {{ timeRangeLabel }}
                </p>
              </div>
            </div>

            <div class="bg-[#E2EAFC] p-12 rounded-xl">
              <h3 class="text-lg font-bold text-gray-700 mb-4 text-center">Pie chart</h3>
              <transition :name="transitionName" mode="out-in">
                <div
                  :key="selectedTimeRange + '-' + currentDate.getTime()"
                  class="flex flex-col md:flex-row items-center gap-6"
                >
                  <div class="w-36 h-36 relative">
                    <div
                      class="absolute inset-0 rounded-full"
                      :style="{ background: pieGradientStyle }"
                    ></div>
                    <div class="absolute inset-3 bg-[#E2EAFC] rounded-full"></div>
                  </div>
                  <ul class="flex-1 space-y-2">
                    <li
                      v-for="item in pieChartData"
                      :key="item.label"
                      class="flex justify-between items-center text-sm"
                    >
                      <div class="flex items-center">
                        <span :class="['w-3 h-3 rounded-full mr-2', item.colorClass]"></span>
                        <span class="text-gray-600">{{ item.label }}</span>
                        <span class="ml-2 text-gray-500 text-xs">({{ item.value }}%)</span>
                      </div>
                      <span class="font-medium text-gray-700 text-xs md:text-sm">{{
                        item.time
                      }}</span>
                    </li>
                  </ul>
                </div>
              </transition>
            </div>
          </div>
        </section>

        <!-- Right profile section -->
        <section class="bg-white rounded-2xl p-5 flex flex-col h-full">
          <div
            class="bg-[#E2EAFC] border-[0.5px] border-[#DCD7FF] p-5 rounded-xl text-center min-h-62"
            v-if="!isEditingStudyPreferences"
          >
            <div class="relative w-24 h-24 mx-auto mb-3">
              <!-- Profile image -->
              <img
                :src="previewUrl || authStore.image"
                class="w-24 h-24 rounded-full object-cover border-3 border-white shadow-sm"
                alt="Profile"
              />

              <!-- Camera icon appears only in edit mode -->
              <button
                v-if="isEditing"
                @click="triggerImageUpload"
                class="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full shadow w-7 h-7 flex items-center justify-center"
              >
                <img
                  src="/src/assets/images/camera_icon.png"
                  alt="Change"
                  class="w-8 h-8 object-contain"
                />
              </button>
            </div>

            <!-- Hidden input for image upload -->
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              class="hidden"
              @change="handleImageChange"
            />

            <div v-if="isEditing">
              <div class="mt-3 relative w-56 max-w-xs mx-auto">
                <div class="relative">
                  <span class="absolute left-2 top-1 text-xs text-gray-500 bg-[#fdfdfd] px-1 z-10">
                    Username
                  </span>

                  <!-- Input field -->
                  <input
                    v-model="editDisplayName"
                    type="text"
                    class="w-full pt-5 pb-1 pr-10 pl-3 text-s text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#57C490] bg-[#fdfdfd]"
                  />

                  <button
                    v-if="editDisplayName"
                    @click="editDisplayName = ''"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mt-4 flex justify-center gap-2">
                <button
                  @click="saveProfile"
                  class="px-5 py-1 bg-[#3CBC6F] text-white text-sm font-semibold rounded-4xl hover:bg-[#3CA566]"
                >
                  Done
                </button>
                <button
                  @click="cancelEdit"
                  class="px-5 py-1 bg-gray-300 text-black text-sm font-semibold rounded-4xl hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div v-else>
              <h3 class="text-xl font-semibold text-gray-800">{{ authStore.displayName }}</h3>
              <button
                @click="startEditing"
                class="mt-7 px-5 py-1 bg-[#FBCC69] text-black text-sm font-semibold rounded-4xl hover:bg-[#FBCC69]"
              >
                Edit Profile
              </button>
            </div>
          </div>

          <!-- Study Preferences -->
          <div class="p-4 overflow-auto flex-1">
            <div class="flex items-center justify-between">
              <h3 class="text-md font-semibold text-gray-700 mb-1">Study Preferences</h3>
              <button
                class="text-gray-400 hover:text-[#7486FB] p-1 rounded-md hover:bg-purple-200/50 transition-colors"
                @click="startEditingStudyPreferences"
                v-if="!isEditingStudyPreferences && studyPrefStore.preferences"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  ></path>
                </svg>
              </button>
            </div>

            <div v-if="!isEditingStudyPreferences">
              <div v-if="studyPrefStore.preferences">
                <ul class="space-y-2">
                  <li v-for="pref in displayedPreferences" :key="pref.label" class="py-1">
                    <h4 class="text-sm font-medium text-gray-500">{{ pref.label }}</h4>
                    <span
                      class="inline-block mt-1 px-2.5 py-1 bg-[#E2EAFC] text-[#7486FB] text-sm font-semibold border border-[#7486FB] rounded-full"
                      >{{ pref.value }}</span
                    >
                  </li>
                </ul>
              </div>
              <div v-else class="text-center mt-4">
                <p class="text-gray-500 mb-4">You haven't set your study preferences yet.</p>
                <button
                  @click="router.push({ name: 'question' })"
                  class="px-5 py-2 bg-[#FBCC69] text-black text-sm font-semibold rounded-full hover:bg-[#FBCC69]"
                >
                  Set Preferences
                </button>
              </div>
            </div>

            <div v-else class="space-y-4">
              <!-- 1. Preferred study times -->
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Preferred study times</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="time in studyTimeOptions"
                    :key="time"
                    @click="toggleStudyTime(time)"
                    :class="[
                      'px-2.5 py-1 rounded-full text-sm border',
                      selectedStudyTimes.includes(time)
                        ? 'bg-[#7486FB] text-white border-[#7486FB]'
                        : 'bg-white text-[#7486FB] border-[#7486FB]',
                    ]"
                  >
                    {{ time }}
                  </button>
                </div>
              </div>

              <!-- 2. Preferred session duration (range slider) -->
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-10">
                  Preferred session duration (minutes)
                </h4>
                <Slider
                  v-model="sessionDurationRange"
                  :min="30"
                  :max="180"
                  :step="5"
                  :range="true"
                  :tooltips="true"
                  class="!w-full !text-[#7486FB]"
                />
              </div>

              <!-- 3. Review style -->
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Review style</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="style in reviewStyleOptions"
                    :key="style"
                    @click="selectedReviewStyle = style"
                    :class="[
                      'px-2.5 py-1 rounded-full text-sm border',
                      selectedReviewStyle === style
                        ? 'bg-[#7486FB] text-white border-[#7486FB]'
                        : 'bg-white text-[#7486FB] border-[#7486FB]',
                    ]"
                  >
                    {{ style }}
                  </button>
                </div>
              </div>

              <!-- 4. Break preference -->
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Break preference</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="breakTime in breakOptions"
                    :key="breakTime"
                    @click="selectedBreakTime = breakTime"
                    :class="[
                      'px-2.5 py-1 rounded-full text-sm border',
                      selectedBreakTime === breakTime
                        ? 'bg-[#7486FB] text-white border-[#7486FB]'
                        : 'bg-white text-[#7486FB] border-[#7486FB]',
                    ]"
                  >
                    {{ breakTime }} minutes
                  </button>
                </div>
              </div>

              <!-- DONE BUTTON -->
              <div class="mt-10 flex justify-center gap-2">
                <button
                  @click="saveStudyPreferences"
                  class="px-5 py-1 bg-[#3CBC6F] text-white text-sm font-semibold rounded-4xl hover:bg-[#3CA566]"
                >
                  Done
                </button>
                <button
                  @click="cancelStudyPreferencesEdit"
                  class="px-5 py-1 bg-gray-300 text-black text-sm font-semibold rounded-4xl hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Log out button -->
          <button
            @click="handleLogout"
            v-if="!isEditingStudyPreferences"
            class="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
          >
            Log out
          </button>
        </section>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>
/* slide-right: entering element comes from left -> appears moving right */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.28s ease;
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* slide-left: entering element comes from right -> appears moving left */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.28s ease;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}
</style>
