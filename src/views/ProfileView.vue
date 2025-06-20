<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Slider from '@vueform/slider'
import { cloneDeep } from 'lodash-es'

const router = useRouter()
const authStore = useAuthStore()

const focusStats = ref({
  completion: '20 times',
  duration: '26 hrs 34 mins',
})

const barChartData = ref([
  // Values are percentages for height
  { month: 'Jan', value: 30 },
  { month: 'Feb', value: 50 },
  { month: 'Mar', value: 75 },
  { month: 'Apr', value: 65 },
  { month: 'May', value: 85 },
  { month: 'Jun', value: 50 },
  { month: 'Jul', value: 35 },
  { month: 'Aug', value: 0 },
  { month: 'Sep', value: 0 },
  { month: 'Oct', value: 0 },
  { month: 'Nov', value: 0 },
  { month: 'Dec', value: 0 },
])

const pieChartData = ref([
  { label: 'Eng 2', value: 40, time: '10 hrs 37 mins', colorClass: 'bg-orange-400' },
  { label: 'UI', value: 35, time: '8 hrs 45 mins', colorClass: 'bg-yellow-400' }, // Adjusted color to match image
  { label: 'AI', value: 25, time: '5 hrs 24 mins', colorClass: 'bg-emerald-400' }, // Adjusted color to match image
])

// const studyPreferences = ref([
//   { id: 'studyTime', label: 'Preferred study times', value: 'Late night', editable: true },
//   { id: 'sessionDuration', label: 'Preferred session duration', value: '45 mins', editable: true },
//   {
//     id: 'reviewStyle',
//     label: 'Review style',
//     value: '2-3 review sessions per topic',
//     editable: true,
//   },
//   { id: 'breakPreference', label: 'Break preference', value: '10 minutes', editable: true },
// ])

const isEditing = ref(false)
const editDisplayName = ref(authStore.displayName)
const fileInput = ref(null)

//เพิ่มเมื่อกดปุ่มแก้ไข
const isEditingStudyPreferences = ref(false)

const currentYear = ref(2025)
const selectedTimeRange = ref('Year')
const timeRangeOptions = ['Day', 'Week', 'Month', 'Year']

// --- Helper functions for placeholders (can be removed if not needed) ---
const incrementYear = () => currentYear.value++
const decrementYear = () => currentYear.value--

const startEditing = () => {
  isEditing.value = true
  editDisplayName.value = authStore.displayName
}

const saveProfile = () => {
  authStore.updateDisplayName(editDisplayName.value)
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

onMounted(() => {
  if (!authStore.user) {
    authStore.checkAuthStatus()
  }

  // Optional: If user is still not found, redirect to login
  if (!authStore.user) {
    router.push({ name: 'login' })
  }
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', (error as Error).message)
  }
}

//เพิ่มเมื่อกดปุ่มแก้ไข
const studyPreferences = ref([
  { id: 'studyTime', label: 'Preferred study times', value: 'Late night' },
  { id: 'sessionDuration', label: 'Preferred session duration', value: '45–60 mins' },
  { id: 'reviewStyle', label: 'Review style', value: '2–3 review sessions per topic' },
  { id: 'breakPreference', label: 'Break preference', value: '10 minutes' },
])

// 1. Study time options
const studyTimeOptions = [
  'Early morning',
  'Late morning',
  'Afternoon',
  'Evening',
  'Night',
  'Late night',
]
const selectedStudyTimes = ref(['Late night'])
const toggleStudyTime = (time: string) => {
  if (selectedStudyTimes.value.includes(time)) {
    selectedStudyTimes.value = selectedStudyTimes.value.filter((t) => t !== time)
  } else {
    selectedStudyTimes.value.push(time)
  }
}

// 2. Session duration range
const sessionDurationRange = ref<[number, number]>([45, 60])

// 3. Review style
const reviewStyleOptions = [
  'One deep review session before the exam',
  '2–3 review sessions per topic',
  'Daily review sessions',
]
const selectedReviewStyle = ref('2–3 review sessions per topic')

// 4. Break preference
const breakOptions = [
  '5 minutes',
  '10 minutes',
  '15 minutes',
  '20 minutes',
  '25 minutes',
  '30 minutes',
]
const selectedBreakTime = ref('10 minutes')

let backupStudyPreferences: typeof studyPreferences.value

// เมื่อกดปุ่มแก้ไข (edit) ให้สำรองข้อมูลไว้
watch(isEditingStudyPreferences, (val) => {
  if (val) {
    backupStudyPreferences = cloneDeep(studyPreferences.value)
    // ตั้งค่าชั่วคราวสำหรับแก้ไข
    const studyTime = backupStudyPreferences.find((p) => p.id === 'studyTime')?.value || ''
    selectedStudyTimes.value = studyTime.split(', ').filter(Boolean)

    const duration = backupStudyPreferences.find((p) => p.id === 'sessionDuration')?.value || ''
    const [min, max] = duration.replace(' mins', '').split('–').map(Number)
    sessionDurationRange.value = [min || 45, max || 60]

    selectedReviewStyle.value =
      backupStudyPreferences.find((p) => p.id === 'reviewStyle')?.value || reviewStyleOptions[0]

    selectedBreakTime.value =
      backupStudyPreferences.find((p) => p.id === 'breakPreference')?.value || breakOptions[0]
  }
})

const saveStudyPreferences = () => {
  studyPreferences.value = [
    {
      id: 'studyTime',
      label: 'Preferred study times',
      value: selectedStudyTimes.value.join(', ') || 'None',
    },
    {
      id: 'sessionDuration',
      label: 'Preferred session duration',
      value: `${sessionDurationRange.value[0]}–${sessionDurationRange.value[1]} mins`,
    },
    {
      id: 'reviewStyle',
      label: 'Review style',
      value: selectedReviewStyle.value,
    },
    {
      id: 'breakPreference',
      label: 'Break preference',
      value: selectedBreakTime.value,
    },
  ]
  isEditingStudyPreferences.value = false
}
const cancelStudyPreferencesEdit = () => {
  studyPreferences.value = cloneDeep(backupStudyPreferences)
  isEditingStudyPreferences.value = false
}

function triggerImageUpload() {
  fileInput.value?.click()
}

function handleImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      authStore.image = e.target.result // แสดงภาพใหม่
    }
    reader.readAsDataURL(file)
  }
}
</script>

<template>
  <div class="flex h-screen bg-[#F1EFFF]">
    <!-- Sidebar -->
    <aside
      class="w-20 md:w-24 lg:w-50 bg-[#544BAA] text-white p-4 md:p-5 flex flex-col flex-shrink-0"
    >
      <div class="flex items-center gap-2 mb-10 shrink-0">
        <img src="/src/assets/images/logo-authenticated.png" alt="" />
      </div>
      <nav class="flex-grow hidden lg:block"></nav>
      <div class="mt-auto hidden lg:block shrink-0"></div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="flex items-center justify-between px-5 py-4 bg-[#F1EFFF]">
        <div class="text-lg font-semibold"></div>
        <div class="flex items-center space-x-4">
          <button class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022 23.848 23.848 0 005.455 1.31m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>
          <img :src="authStore.image" alt="Profile" class="w-9 h-9 rounded-full object-cover" />
        </div>
      </header>

      <!-- Main grid -->
      <div class="flex-1 px-6 pb-8 overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <!-- Left 2/3 section -->
          <section class="lg:col-span-2 bg-white rounded-2xl p-5 flex flex-col h-full">
            <!-- Top controls -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <!-- Year controls -->
              <div class="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <button @click="decrementYear" class="p-1 text-white bg-[#2F2159] rounded-full">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="4"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span class="font-extrabold">{{ currentYear }}</span>
                <button @click="incrementYear" class="p-1 text-white bg-[#2F2159] rounded-full">
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
                  @click="selectedTimeRange = range"
                  :class="[
                    'px-5 py-1 font-extrabold rounded-4xl transition-colors',
                    selectedTimeRange === range
                      ? 'bg-[#FFC84A] shadow border-2 border-[#2F2159]'
                      : 'hover:bg-[#ffc94a85]',
                  ]"
                >
                  {{ range }}
                </button>
              </div>
            </div>

            <div class="flex gap-4 items-stretch mb-4 min-h-[180px]">
              <!-- Summary Box -->
              <div class="flex-[1]">
                <div class="flex flex-col items-center gap-4">
                  <!-- Focus Completion Box -->
                  <div
                    class="bg-[#E5E1FD] rounded-xl p-8 text-center text-[#544BAA] w-full max-w-xs"
                  >
                    <h3 class="text-sm font-medium text-black mb-1">Focus completion</h3>
                    <p class="text-lg font-bold text-[#544BAA]">20 times</p>
                  </div>

                  <!-- Focus Duration Box -->
                  <div
                    class="bg-[#E5E1FD] rounded-xl p-8 text-center text-[#544BAA] w-full max-w-xs"
                  >
                    <h3 class="text-sm font-medium text-black mb-1">Focus duration</h3>
                    <p class="text-lg font-bold text-[#544BAA]">26 hrs 34 mins</p>
                  </div>
                </div>
              </div>

              <!-- Bar Chart Box -->
              <div class="flex-[3]">
                <div class="bg-[#E5E1FD] rounded-xl p-4 h-full flex flex-col justify-between">
                  <h2 class="text-lg font-bold text-gray-700 mb-2 text-center">Bar chart</h2>
                  <div class="flex items-end justify-between h-40 px-2">
                    <div
                      v-for="item in barChartData"
                      :key="item.month"
                      class="flex flex-col items-center w-[calc(100%/12-0.5rem)] mx-1 text-center"
                    >
                      <div
                        class="bg-[#6D5BD0] w-full mb-1 rounded-t"
                        :style="{ height: item.value + '%' }"
                        :title="item.value > 0 ? `${item.value}%` : ''"
                      ></div>
                      <span class="text-xs text-gray-500">{{ item.month }}</span>
                    </div>
                  </div>
                  <p class="text-center text-xs text-gray-400 mt-2">
                    Monthly focus activity placeholder
                  </p>
                </div>
              </div>
            </div>

            <!-- Chart area -->
            <div class="flex-1 overflow-auto">
              <div class="bg-[#E5E1FD] p-12 rounded-xl">
                <h3 class="text-lg font-bold text-gray-700 mb-4 text-center">Pie chart</h3>
                <div class="flex flex-col md:flex-row items-center gap-6">
                  <div class="w-36 h-36 relative">
                    <div
                      class="absolute inset-0 rounded-full"
                      style="
                        background: conic-gradient(
                          #ff9f40 0% 40%,
                          #ffee58 40% 75%,
                          #66bb6a 75% 100%
                        );
                        transform: rotate(-90deg);
                      "
                    ></div>
                    <div class="absolute inset-3 bg-[#E5E1FD] rounded-full"></div>
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
              </div>
            </div>
          </section>

          <!-- Right profile section -->
          <section class="bg-white rounded-2xl p-5 flex flex-col h-full">
            <div
              class="bg-[#F1EFFF] border-[0.5px] border-[#DCD7FF] p-5 rounded-xl text-center min-h-62"
              v-if="!isEditingStudyPreferences"
            >
              <div class="relative w-24 h-24 mx-auto mb-3">
                <!-- Profile image -->
                <img
                  :src="authStore.image"
                  class="w-24 h-24 rounded-full object-cover border-3 border-white shadow-sm"
                  alt="Profile"
                />

                <!-- Camera icon appears only in edit mode -->
                <button
                  v-if="isEditing"
                  @click="triggerImageUpload"
                  class="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full shadow w-7 h-7 flex items-center justify-center"
                >
                  <img src="/src/assets/images/camera_icon.png" alt="Change" class="w-8 h-8 object-contain" />
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
                    <span
                      class="absolute left-2 top-1 text-xs text-gray-500 bg-[#fdfdfd] px-1 z-10"
                    >
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
                    class="px-5 py-1 bg-[#57C490] text-white text-sm font-semibold rounded-4xl hover:bg-[#3EB37B]"
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
                  class="mt-7 px-5 py-1 bg-[#FFC84A] text-black text-sm font-semibold rounded-4xl hover:bg-[#ffba4a]"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <!-- Study Preferences (unchanged) -->
            <div class="p-4 overflow-auto flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-md font-semibold text-gray-700 mb-1">Study Preferences</h3>
                <button
                  class="text-gray-400 hover:text-[#6D5BD0] p-1 rounded-md hover:bg-purple-200/50 transition-colors"
                  @click="isEditingStudyPreferences = !isEditingStudyPreferences"
                  v-if="!isEditingStudyPreferences"
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

              <!-- เพิ่มเมื่อกดปุ่มแก้ไข -->
              <div v-if="!isEditingStudyPreferences">
                <ul class="space-y-1">
                  <li v-for="pref in studyPreferences" :key="pref.id" class="py-1">
                    <div>
                      <div>
                        <h4 class="text-sm font-medium text-gray-500">{{ pref.label }}</h4>
                        <span
                          class="inline-block mt-1 px-2.5 py-1 bg-[#E8E6F9] text-[#6D5BD0] text-sm font-semibold border border-[#6D5BD0] rounded-full"
                          >{{ pref.value }}</span
                        >
                      </div>
                    </div>
                  </li>
                </ul>
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
                          ? 'bg-[#6D5BD0] text-white border-[#6D5BD0]'
                          : 'bg-white text-[#6D5BD0] border-[#6D5BD0]',
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
                    :max="90"
                    :step="15"
                    :range="true"
                    :tooltips="true"
                    class="!w-full !text-[#6D5BD0]"
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
                          ? 'bg-[#6D5BD0] text-white border-[#6D5BD0]'
                          : 'bg-white text-[#6D5BD0] border-[#6D5BD0]',
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
                          ? 'bg-[#6D5BD0] text-white border-[#6D5BD0]'
                          : 'bg-white text-[#6D5BD0] border-[#6D5BD0]',
                      ]"
                    >
                      {{ breakTime }}
                    </button>
                  </div>
                </div>

                <!-- DONE BUTTON -->
                <div class="mt-10 flex justify-center gap-2">
                  <button
                    @click="saveStudyPreferences"
                    class="px-5 py-1 bg-[#57C490] text-white text-sm font-semibold rounded-4xl hover:bg-[#3EB37B]"
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
              v-if="!isEditingStudyPreferences"
              class="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
            >
              Log out
            </button>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* You can add minimal scoped styles here if absolutely necessary, but prefer Tailwind utilities */
/* For example, if you needed very specific conic-gradient support not covered by Tailwind */
/* However, the inline style for conic-gradient is used above for simplicity in this example */
</style>
