<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

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

const studyPreferences = ref([
  { id: 'studyTime', label: 'Preferred study times', value: 'Late night', editable: true },
  { id: 'sessionDuration', label: 'Preferred session duration', value: '45 mins', editable: true },
  {
    id: 'reviewStyle',
    label: 'Review style',
    value: '2-3 review sessions per topic',
    editable: true,
  },
  { id: 'breakPreference', label: 'Break preference', value: '10 minutes', editable: true },
])

const currentYear = ref(2025)
const selectedTimeRange = ref('Year')
const timeRangeOptions = ['Day', 'Week', 'Month', 'Year']

// --- Helper functions for placeholders (can be removed if not needed) ---
const incrementYear = () => currentYear.value++
const decrementYear = () => currentYear.value--

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
</script>

<template>
  <DefaultLayout>
    <!-- Main grid -->
    <div class="flex-1 px-6 pb-4 overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
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

          <div class="flex gap-4 items-stretch min-h-[70px] mb-5">
            <!-- Summary Box -->
            <div class="grid grid-cols-2 gap-2 h-full">
              <div
                class="bg-[#DCD7FF] rounded-xl p-8 w-60 text-center text-[#544BAA] flex flex-col justify-center items-center h-full"
              >
                <div class="mb-11">
                  <h3 class="text-sm font-medium text-black mb-1">Focus completion</h3>
                  <p class="text-base font-bold text-[#544BAA]">{{ focusStats.completion }}</p>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-black mb-1">Focus duration</h3>
                  <p class="text-base font-bold text-[#544BAA]">{{ focusStats.duration }}</p>
                </div>
              </div>
            </div>

            <!-- Bar Chart Box -->
            <div class="bg-[#DCD7FF] rounded-xl p-4 w-[1000px] h-full">
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

          <!-- Chart area -->
          <div class="flex-1 overflow-auto">
            <div class="bg-[#DCD7FF] p-12 rounded-xl">
              <h3 class="text-lg font-bold text-gray-700 mb-4 text-center">Pie chart</h3>
              <div class="flex flex-col md:flex-row items-center gap-6">
                <div class="w-36 h-36 relative">
                  <div
                    class="absolute inset-0 rounded-full"
                    style="
                      background: conic-gradient(#ff9f40 0% 40%, #ffee58 40% 75%, #66bb6a 75% 100%);
                      transform: rotate(-90deg);
                    "
                  ></div>
                  <div class="absolute inset-3 bg-[#DCD7FF] rounded-full"></div>
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
          <div class="bg-[#F1EFFF] p-3 rounded-xl text-center">
            <img
              :src="authStore.image"
              class="w-24 h-24 rounded-full mx-auto mb-2 object-cover border-4 border-white shadow-sm"
              alt="Profile"
            />
            <h3 class="text-xl font-semibold text-gray-800">{{ authStore.displayName }}</h3>
            <button
              class="mt-4 px-5 py-1 bg-[#FFC84A] text-black text-sm font-semibold rounded-4xl hover:bg-[#ffba4a]"
            >
              Edit Profile
            </button>
          </div>

          <div class="p-4 overflow-auto flex-1">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-md font-semibold text-gray-700">Study Preferences</h3>
            </div>
            <ul class="space-y-1">
              <li v-for="pref in studyPreferences" :key="pref.id">
                <h4 class="text-sm font-medium text-gray-500">{{ pref.label }}</h4>
                <span
                  class="inline-block mt-1 px-2.5 py-1 bg-[#E8E6F9] text-[#6D5BD0] text-xs font-semibold border border-[#6D5BD0] rounded-full"
                >
                  {{ pref.value }}
                </span>
              </li>
            </ul>
          </div>

          <button
            @click="handleLogout"
            class="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
          >
            Log out
          </button>
        </section>
      </div>
    </div>
  </DefaultLayout>
</template>
