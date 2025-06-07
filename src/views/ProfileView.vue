<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
  <div class="flex h-screen bg-[#F1EFFF]">
    <aside
      class="w-20 md:w-24 lg:w-50 bg-[#544BAA] text-white p-4 md:p-5 flex flex-col flex-shrink-0"
    >
      <div class="flex items-center gap-2 mb-10 shrink-0">
        <img src="/src/assets/images/logo-authenticated.png" alt="" />
      </div>
      <nav class="flex-grow hidden lg:block"></nav>
      <div class="mt-auto hidden lg:block shrink-0"></div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="flex items-center justify-between p-4 md:p-5 lg:px-4 bg-[#F1EFFF]">
        <div class="text-lg md:text-xl"></div>
        <div class="flex items-center space-x-4">
          <button aria-label="Notifications" class="text-gray-500 hover:text-gray-700">
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              ></path>
            </svg>
          </button>
          <img
            :src="authStore.image"
            alt="Profile"
            class="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
          />
        </div>
      </header>

      <div class="flex-1 px-4 md:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section
              class="lg:col-span-2 flex flex-col gap-4 bg-white rounded-2xl p-5 overflow-hidden"
            >
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-2 text-xl font-semibold text-gray-700">
                  <button
                    @click="decrementYear"
                    aria-label="Previous year"
                    class="p-0.5 text-white hover:text-[#d6d5da] bg-[#2F2159] rounded-full transition-colors"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="4"
                        d="M15 19l-7-7 7-7"
                      ></path>
                    </svg>
                  </button>
                  <span class="font-extrabold text-lg">{{ currentYear }}</span>
                  <button
                    @click="incrementYear"
                    aria-label="Next year"
                    class="p-0.5 text-white hover:text-[#d6d5da] bg-[#2F2159] rounded-full transition-colors"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="4"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div
                  class="flex items-center text-sm bg-[#FFE7AF] text-[#2F2159] rounded-4xl p-0.5"
                >
                  <button
                    v-for="range in timeRangeOptions"
                    :key="range"
                    @click="selectedTimeRange = range"
                    :class="[
                      'px-5 py-0.5 md:px-6 md:py-0.5 font-extrabold rounded-4xl transition-colors focus:outline-none',
                      selectedTimeRange === range
                        ? 'bg-[#FFC84A] shadow border-2 border-[#2F2159]'
                        : 'hover:bg-[#ffc94a85]',
                    ]"
                  >
                    {{ range }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2">
                <div
                  class="bg-[#DCD7FF] py-2 rounded-l-xl border-r-1 border-r-[#544BAA] text-center"
                >
                  <h3 class="text-sm font-bold text-black mb-1">Focus completion</h3>
                  <p class="text-base font-extrabold text-[#544BAA]">{{ focusStats.completion }}</p>
                </div>
                <div
                  class="bg-[#DCD7FF] py-2 rounded-r-xl border-l-1 border-l-[#544BAA] text-center"
                >
                  <h3 class="text-sm font-bold text-black mb-1">Focus duration</h3>
                  <p class="text-base font-extrabold text-[#544BAA]">{{ focusStats.duration }}</p>
                </div>
              </div>

              <div class="charts-container flex-grow min-h-0 overflow-y-auto space-y-6">
                <div class="bg-[#DCD7FF] p-5 md:p-6 rounded-xl shadow-md">
                  <h3 class="text-lg font-semibold text-gray-700 mb-4">Bar chart</h3>
                  <div
                    class="h-60 flex items-end justify-around px-1 md:px-2 pb-2 pt-4 border border-gray-200 rounded bg-white/30"
                  >
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

                <div class="bg-[#EFEFFD] p-5 md:p-6 rounded-xl shadow-md">
                  <h3 class="text-lg font-semibold text-gray-700 mb-4">Pic chart</h3>
                  <div class="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <div class="w-36 h-36 md:w-40 md:h-40 relative">
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
                      <div class="absolute inset-2 md:inset-3 bg-[#EFEFFD] rounded-full"></div>
                    </div>
                    <div class="flex-1 w-full md:w-auto">
                      <ul>
                        <li
                          v-for="item in pieChartData"
                          :key="item.label"
                          class="flex items-center justify-between py-1.5 text-sm"
                        >
                          <div class="flex items-center">
                            <span
                              class="w-3 h-3 rounded-full mr-2.5"
                              :class="item.colorClass"
                            ></span>
                            <span class="text-gray-600">{{ item.label }}</span>
                            <span class="ml-1.5 text-gray-500 text-xs">({{ item.value }}%)</span>
                          </div>
                          <span class="font-medium text-gray-700 text-xs md:text-sm">{{
                            item.time
                          }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <p class="text-center text-xs text-gray-400 mt-4">
                    Subject focus distribution placeholder
                  </p>
                </div>
              </div>
            </section>

            <section class="lg:col-span-1 flex flex-col gap-6 bg-white rounded-2xl p-5">
              <div class="bg-[#F1EFFF] p-3 rounded-xl text-center">
                <img
                  :src="authStore.image"
                  alt="Profile"
                  class="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-2 object-cover border-4 border-white shadow-sm"
                />
                <h3 class="text-xl font-semibold text-gray-800">{{ authStore.displayName }}</h3>
                <button
                  class="mt-4 px-5 py-1 bg-[#FFC84A] text-black text-sm font-semibold rounded-4xl hover:bg-[#ffba4a] transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div class="p-6 rounded-xl">
                <div class="flex items-center justify-between">
                  <h3 class="text-md font-semibold text-gray-700 mb-1">Study Preferences</h3>
                  <button
                    class="text-gray-400 hover:text-[#6D5BD0] p-1 rounded-md hover:bg-purple-200/50 transition-colors"
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
                <ul class="space-y-1">
                  <li
                    v-for="pref in studyPreferences"
                    :key="pref.id"
                    class="py-1.5"
                  >
                    <div>
                      <div>
                        <h4 class="text-sm font-medium text-gray-500">{{ pref.label }}</h4>
                        <span
                          class="inline-block mt-1 px-2.5 py-1 bg-[#E8E6F9] text-[#6D5BD0] text-xs font-semibold border border-[#6D5BD0] rounded-full"
                          >{{ pref.value }}</span
                        >
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <button
                @click="handleLogout"
                class="w-full py-2.5 md:py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
              >
                Log out
              </button>
            </section>
          </div>
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
