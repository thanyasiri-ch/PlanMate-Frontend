<script setup lang="ts">
import { computed } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'

// Import Swiper modules
import { Pagination, Navigation } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

// --- Data ---
const subjects = [
  { id: 1, name: 'Mathematics', progressPercent: 75, color: 'from-blue-400 to-indigo-600' },
  { id: 2, name: 'Physics', progressPercent: 60, color: 'from-teal-400 to-cyan-600' },
  { id: 3, name: 'English', progressPercent: 90, color: 'from-amber-400 to-orange-600' },
  { id: 4, name: 'Computer Science', progressPercent: 45, color: 'from-purple-400 to-fuchsia-600' },
  { id: 5, name: 'Chemistry', progressPercent: 50, color: 'from-lime-400 to-green-600' },
  { id: 6, name: 'History', progressPercent: 80, color: 'from-rose-400 to-red-600' },
]

// ตั้งค่า modules ที่จะใช้ใน Swiper
const swiperModules = [Pagination, Navigation]

const userGroups = [
  {
    id: 'g1',
    name: 'Study Group A',
    userRank: 3,
    totalMembers: 15,
    imageUrl: 'https://via.placeholder.com/40?text=SGA',
    color: 'text-indigo-600',
  },
  {
    id: 'g2',
    name: 'Physics Enthusiasts',
    userRank: 1,
    totalMembers: 12,
    imageUrl: 'https://via.placeholder.com/40?text=PE',
    color: 'text-cyan-600',
  },
  {
    id: 'g3',
    name: 'English Learners',
    userRank: 5,
    totalMembers: 10,
    imageUrl: 'https://via.placeholder.com/40?text=EL',
    color: 'text-orange-600',
  },
]

const tasks = [
  {
    id: 101,
    title: 'Finish Math homework',
    dueDate: '2025-08-11',
    completed: false,
    subject: 'Mathematics',
  },
  {
    id: 105,
    title: 'Review Chapter 3',
    dueDate: '2025-08-10',
    completed: false,
    subject: 'Physics',
  }, // Due Today
  {
    id: 102,
    title: 'Physics lab report',
    dueDate: '2025-08-14',
    completed: false,
    subject: 'Physics',
  },
  {
    id: 103,
    title: 'English essay draft',
    dueDate: '2025-08-15',
    completed: true,
    subject: 'English',
  },
  {
    id: 104,
    title: 'Prepare CS project',
    dueDate: '2025-08-20',
    completed: false,
    subject: 'Computer Science',
  },
]

/**
 * คำนวณวันที่และจัดรูปแบบให้เข้าใจง่ายขึ้น
 * @param dateString วันที่ในรูปแบบ 'YYYY-MM-DD'
 */
const getRelativeDueDate = (dateString: string) => {
  const today = new Date('2025-08-10T00:00:00') // Fixed for consistent demo
  const dueDate = new Date(dateString + 'T00:00:00')
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: 'Overdue', color: 'text-red-500 font-semibold' }
  if (diffDays === 0) return { text: 'Due Today', color: 'text-red-600 font-bold' }
  if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-amber-600 font-semibold' }
  return { text: `Due in ${diffDays} days`, color: 'text-gray-500' }
}

const sortedTasks = computed(() => {
  return tasks.slice().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
})
</script>

<template>
  <DefaultLayout>
    <div
      class="h-full flex flex-col pt-4 px-4 pb-4 md:pt-6 md:px-8 md:pb-6 space-y-6 overflow-hidden min-w-0"
    >
      <!-- My Courses -->
      <section class="flex-shrink-0">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-3xl font-extrabold text-gray-800 tracking-tight">My Courses</h2>

          <div class="flex items-center space-x-2">
            <button
              class="swiper-button-prev-custom h-10 w-10 rounded-full bg-white/80 shadow-md flex items-center justify-center text-indigo-600 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            <button
              class="swiper-button-next-custom h-10 w-10 rounded-full bg-white/80 shadow-md flex items-center justify-center text-indigo-600 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="relative">
          <Swiper
            class="overflow-visible"
            :slides-per-view="1.5"
            :space-between="15"
            :modules="swiperModules"
            :pagination="{
              clickable: true,
              el: '.custom-swiper-pagination',
            }"
            :navigation="{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }"
            :breakpoints="{
              '640': { slidesPerView: 2, spaceBetween: 20 },
              '1024': { slidesPerView: 3, spaceBetween: 24 },
              '1280': { slidesPerView: 4, spaceBetween: 24 },
            }"
          >
            <SwiperSlide
              v-for="subject in subjects"
              :key="subject.id"
              class="relative z-[1] rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-transparent group cursor-pointer transform hover:scale-105 hover:z-[10] bg-white"
            >
              <div class="mb-4">
                <h3 class="font-extrabold text-xl text-gray-800 tracking-wide">{{ subject.name }}</h3>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1 items-end">
                  <span class="text-gray-500 font-medium">Progress</span>
                  <span
                    class="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r"
                    :class="subject.color"
                  >
                    {{ subject.progressPercent }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    class="h-2.5 rounded-full transition-all duration-700 ease-out bg-gradient-to-r"
                    :class="subject.color"
                    :style="{ width: subject.progressPercent + '%' }"
                  ></div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          <div class="text-center mt-4">
            <div class="custom-swiper-pagination"></div>
          </div>
        </div>
      </section>

      <!-- Upcoming Deadlines + Study Groups -->
      <section class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 min-w-0">
        <!-- Upcoming Deadlines -->
        <div
          class="bg-white rounded-3xl shadow-xl border border-gray-100 lg:col-span-2 flex flex-col min-h-0"
        >
          <div class="p-6 pb-4 flex-shrink-0">
            <div class="flex justify-between items-center">
              <h3 class="text-2xl font-bold text-gray-800">Upcoming Deadlines</h3>
              <a href="#" class="text-sm font-semibold text-indigo-600 hover:underline">View All</a>
            </div>
          </div>
          <ul class="space-y-3 px-6 pb-6 flex-1 overflow-y-auto">
            <li
              v-for="task in sortedTasks"
              :key="task.id"
              class="flex items-center p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] cursor-pointer"
              :class="{
                'bg-green-50 text-gray-500 hover:bg-green-100': task.completed,
                'hover:bg-gray-100': !task.completed,
                'bg-red-50 hover:bg-red-100': getRelativeDueDate(task.dueDate).text === 'Due Today',
                'bg-amber-50 hover:bg-amber-100': getRelativeDueDate(task.dueDate).text === 'Due Tomorrow',
              }"
            >
              <input
                type="checkbox"
                :id="'task-' + task.id"
                :checked="task.completed"
                class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
              />
              <label :for="'task-' + task.id" class="ml-4 flex-grow cursor-pointer">
                <p class="font-bold text-lg" :class="task.completed ? 'line-through text-gray-400' : 'text-gray-800'">
                  {{ task.title }}
                </p>
                <p class="text-sm font-medium" :class="task.completed ? 'text-gray-400' : 'text-gray-500'">
                  {{ task.subject }}
                </p>
              </label>
              <div
                v-if="!task.completed"
                class="text-sm text-right ml-2 font-semibold"
                :class="getRelativeDueDate(task.dueDate).color"
              >
                {{ getRelativeDueDate(task.dueDate).text }}
              </div>
              <div v-else class="text-sm text-green-600 font-bold ml-2">Completed</div>
            </li>
          </ul>
        </div>

        <!-- My Study Groups -->
        <div class="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col min-h-0">
          <div class="p-6 pb-4 flex-shrink-0">
            <h3 class="text-2xl font-bold text-gray-800">My Study Groups</h3>
          </div>
          <ul class="space-y-3 px-4 pb-4 flex-1 overflow-y-auto">
            <li
              v-for="group in userGroups"
              :key="group.id"
              class="p-4 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer transform hover:scale-[1.01]"
            >
              <div class="flex items-center space-x-4">
                <img
                  :src="group.imageUrl"
                  alt="Group Avatar"
                  class="w-14 h-14 rounded-full object-cover border-4 border-white ring-2 ring-indigo-200 flex-shrink-0 shadow-md"
                />
                <div class="flex-grow min-w-0">
                  <p class="text-gray-800 font-extrabold truncate text-lg">{{ group.name }}</p>
                  <p class="text-gray-500 text-sm font-medium mt-1">{{ group.totalMembers }} members</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="font-bold text-4xl leading-none" :class="group.color">
                    #{{ group.userRank }}
                  </p>
                  <p class="text-xs text-gray-500 font-medium">Rank</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>

<style scoped>
:deep(.swiper),
:deep(.swiper-wrapper) {
  overflow: visible !important;
}

:deep(.swiper-slide) {
  position: relative;
  z-index: 1;
}

:deep(.swiper-slide:hover) {
  z-index: 10;
}

:deep(.swiper-pagination-bullet) {
  background-color: #9ca3af;
  opacity: 0.6;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: #4f46e5;
  opacity: 1;
}
</style>
