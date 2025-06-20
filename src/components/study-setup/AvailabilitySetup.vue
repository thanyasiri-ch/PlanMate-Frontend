<template>
  <div class="h-screen flex flex-col items-center">
    <div class="w-4/5 flex flex-col flex-1 overflow-hidden">
      <div class="flex-1 flex bg-white rounded-2xl p-6 sm:p-8 overflow-hidden">
        <div class="flex flex-1 flex-col justify-center">
          <div class="text-center">
            <p class="text-gray-500 mb-5 mx-auto max-w-2xl">
              Click on a date to select available time slots for that specific day.
            </p>
          </div>

          <!-- Calendar -->
          <div class="w-full">
            <div class="flex items-center justify-between mb-2">
              <button
                @click="previousMonth"
                class="px-4 py-1 font-semibold hover:font-bold bg-[#FFC84A] rounded-2xl"
              >
                &lt; {{ previousMonthName }}
              </button>
              <h3 class="text-2xl font-bold">{{ monthYear }}</h3>
              <button
                @click="nextMonth"
                class="px-4 py-1 font-semibold hover:font-bold bg-[#FFC84A] rounded-2xl"
              >
                {{ nextMonthName }} &gt;
              </button>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div class="flex-1 grid grid-cols-7 gap-0.5 text-center">
                <div
                  v-for="day in weekDays"
                  :key="day"
                  class="p-2 font-semibold text-white bg-[#8A98DD] text-sm sm:text-base"
                >
                  {{ day }}
                </div>
                <div
                  v-for="day in calendarGrid"
                  :key="day.dateStr"
                  class="h-15 border border-gray-200 cursor-pointer transition-colors duration-150 ease-in-out flex flex-col p-1"
                  :class="[
                    { 'bg-gray-50 text-gray-400': !day.isCurrentMonth },
                    {
                      'bg-green-50 hover:bg-green-100':
                        hasAvailability(day.dateStr) && day.isCurrentMonth,
                    },
                    {
                      'bg-[#8A98DD]/25 hover:bg-yellow-100':
                        !hasAvailability(day.dateStr) && day.isCurrentMonth,
                    },
                  ]"
                  @click="day.isCurrentMonth && openTimeSlotModal(day.dateStr)"
                >
                  <span class="font-medium self-start">{{ day.dayOfMonth }}</span>
                  <div
                    v-if="hasAvailability(day.dateStr)"
                    class="mt-1 overflow-hidden text-left flex flex-wrap gap-1"
                  >
                    <span
                      v-for="time in getVisibleTimes(day.dateStr)"
                      :key="time"
                      class="text-white bg-green-500 rounded px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      {{ time }}
                    </span>
                    <span
                      v-if="getHiddenTimesCount(day.dateStr) > 0"
                      class="text-gray-500 text-xs font-medium self-center"
                    >
                      +{{ getHiddenTimesCount(day.dateStr) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="errorMessage" class="mt-8 text-red-500 text-center">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>

  <div
  v-if="selectedDate"
  class="fixed inset-0 bg-black/50 z-50 flex justify-center items-center transition-all duration-300"
>
  <div class="bg-white rounded-lg p-8 max-w-lg w-full relative">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">Available times for {{ selectedDate }}</h3>

      <button
        @click="selectedDate = null"
        class="text-red-500 hover:text-red-600 text-3xl font-bold p-2 -mt-2 -mr-2"
      >
        &times;
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="time in timeSlots"
        :key="time"
        class="p-2 rounded transition-colors duration-150"
        :class="
          isTimeSlotSelected(selectedDate, time)
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 hover:bg-green-100'
        "
        @click="toggleTimeSlot(selectedDate, time)"
      >
        {{ time }}
      </button>
    </div>
    <button
      @click="selectedDate = null"
      class="mt-6 w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
    >
      Done
    </button>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudySetupStore } from '@/stores/studySetup'
import type { TermDTO } from '@/types'

const emit = defineEmits(['next', 'back'])
const store = useStudySetupStore()
const errorMessage = ref('')
const selectedDate = ref<string | null>(null)

// Stores availability as { 'YYYY-MM-DD': ['08:00', '09:00'] }
const availabilityByDate = ref<Record<string, string[]>>({})

// --- CALENDAR STATE ---
const currentDate = ref(new Date())
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthYear = computed(() =>
  currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' }),
)

const calendarGrid = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startDayOfWeek = firstDayOfMonth.getDay()

  const grid = []

  // Add padding for days from the previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    grid.push({ dateStr: `prev-${i}`, dayOfMonth: '', isCurrentMonth: false })
  }

  // Add days of the current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    grid.push({
      dateStr: date.toISOString().split('T')[0], // YYYY-MM-DD
      dayOfMonth: i,
      isCurrentMonth: true,
    })
  }

  return grid
})

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1))
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1))
}

// --- TIME SLOT & AVAILABILITY LOGIC ---
const timeSlots = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)
const SLOT_DURATION_MINUTES = 60
const VISIBLE_TIMES_LIMIT = 2 // Show 2 time slots before hiding

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currentMonth = computed(() => currentDate.value.getMonth())

const previousMonthName = computed(() => {
  const prevMonth = (currentMonth.value - 1 + 12) % 12
  return monthNames[prevMonth]
})

const nextMonthName = computed(() => {
  const nextMonth = (currentMonth.value + 1) % 12
  return monthNames[nextMonth]
})

const hasAvailability = (dateStr: string): boolean => {
  return availabilityByDate.value[dateStr]?.length > 0
}

const getVisibleTimes = (dateStr: string): string[] => {
  return availabilityByDate.value[dateStr]?.slice(0, VISIBLE_TIMES_LIMIT) ?? []
}

const getHiddenTimesCount = (dateStr: string): number => {
  const count = (availabilityByDate.value[dateStr]?.length ?? 0) - VISIBLE_TIMES_LIMIT
  return count > 0 ? count : 0
}

const openTimeSlotModal = (dateStr: string) => {
  if (!availabilityByDate.value[dateStr]) {
    availabilityByDate.value[dateStr] = []
  }
  selectedDate.value = dateStr
}

const isTimeSlotSelected = (dateStr: string, time: string): boolean => {
  return availabilityByDate.value[dateStr]?.includes(time) ?? false
}

const toggleTimeSlot = (dateStr: string, time: string) => {
  const slots = availabilityByDate.value[dateStr]
  const index = slots.indexOf(time)
  if (index > -1) {
    slots.splice(index, 1)
  } else {
    slots.push(time)
    slots.sort((a, b) => parseInt(a) - parseInt(b)) // Keep times in order
  }
}

// --- MAIN AVAILABILITY TRANSFORMATION FUNCTION ---
const generateFinalAvailabilities = (
  availabilities: Record<string, string[]>,
): Record<string, string[]> => {
  const finalAvailability: Record<string, string[]> = {}

  for (const dateStr in availabilities) {
    if (availabilities[dateStr].length > 0) {
      // The dateStr from calendar is YYYY-MM-DD, convert to DD/MM/YYYY
      const [year, month, day] = dateStr.split('-')
      const formattedDate = `${day}/${month}/${year}`

      finalAvailability[formattedDate] = availabilities[dateStr].map((startTime) => {
        const [hour, minute] = startTime.split(':').map(Number)

        // Use a dummy date object, only time matters here
        const start = new Date(2000, 0, 1, hour, minute)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES)

        const formatTime = (d: Date) => d.toTimeString().slice(0, 5)
        return `${formatTime(start)}-${formatTime(end)}`
      })
    }
  }
  return finalAvailability
}

async function saveSetup() {
  if (!store.studySetupDTO.term?.startDate || !store.studySetupDTO.term?.endDate) {
    errorMessage.value = 'Term start and end dates are not set. Please go back.'
    return
  }

  const finalAvailabilities = generateFinalAvailabilities(availabilityByDate.value)
  store.studySetupDTO.availabilities = finalAvailabilities

  try {
    console.log(`Generated availability for ${Object.keys(finalAvailabilities).length} dates.`)
    console.log('Saving setup with DTO:', store.studySetupDTO)
    // await StudySetupService.saveSetup(store.studySetupDTO)
    emit('next')
  } catch (error) {
    console.error('Failed to save study setup:', error)
    errorMessage.value = 'There was an error saving your schedule.'
  }
}
</script>
