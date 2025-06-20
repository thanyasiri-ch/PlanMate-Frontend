<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudySetupStore } from '@/stores/studySetup'
import type { TermDTO } from '@/types'

const emit = defineEmits(['next', 'back'])
const store = useStudySetupStore()
const errorMessage = ref('')

// selectedDates is an array to hold multiple dates
const selectedDates = ref<string[]>([]);
const isModalOpen = ref(false); // NEW: State to control modal visibility

// Stores availability as { 'YYYY-MM-DD': ['09:00-17:00', '19:00-21:00'] }
const availabilityByDate = ref<Record<string, string[]>>({})

// Refs for individual hour and minute selection in the modal
const currentSelectedStartHour = ref<string>('09'); // Default start hour
const currentSelectedStartMinute = ref<string>('00'); // Default start minute

const currentSelectedEndHour = ref<string>('17'); // Default end hour
const currentSelectedEndMinute = ref<string>('00'); // Default end minute

// Helper to generate hour options
const generateHourOptions = () => {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    hours.push(String(h).padStart(2, '0'));
  }
  return hours;
};

// Helper to generate minute options (e.g., every 30 minutes)
const generateMinuteOptions = (interval: number = 30) => {
  const minutes = [];
  for (let m = 0; m < 60; m += interval) {
    minutes.push(String(m).padStart(2, '0'));
  }
  return minutes;
};

const hourOptions = generateHourOptions();
const minuteOptions = generateMinuteOptions(30);

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
      dateStr: date.toISOString().split('T')[0], //YYYY-MM-DD
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
const VISIBLE_TIMES_LIMIT = 2 // Show 2 time slots before hiding

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
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

// Check if a date is currently selected
const isDateSelected = (dateStr: string): boolean => {
  return selectedDates.value.includes(dateStr);
};

// Toggle date selection on calendar click
const toggleDateSelection = (dateStr: string, isCurrentMonth: boolean) => {
  if (!isCurrentMonth) return; // Prevent selecting dates from previous/next month padding

  const index = selectedDates.value.indexOf(dateStr);
  if (index > -1) {
    selectedDates.value.splice(index, 1); // Deselect
  } else {
    selectedDates.value.push(dateStr); // Select
  }
};

// NEW: Open the bulk time slot modal
const openBulkTimeSlotModal = () => {
  if (selectedDates.value.length === 0) {
    alert('Please select at least one date to set times.');
    return;
  }
  // Reset default times for the modal, or pre-fill from the first selected date
  currentSelectedStartHour.value = '09';
  currentSelectedStartMinute.value = '00';
  currentSelectedEndHour.value = '17';
  currentSelectedEndMinute.value = '00';
  isModalOpen.value = true; // Show the modal
};

// NEW: Close the bulk time slot modal and clear selected dates
const closeModalAndClearSelection = () => {
  isModalOpen.value = false;
  selectedDates.value = []; // Clear selected dates when done with the modal
};


// Add time range to all selected dates
const addTimeRange = () => {
  if (selectedDates.value.length === 0) {
    alert('No dates are selected to add time ranges to.');
    return;
  }

  const startTime = `${currentSelectedStartHour.value}:${currentSelectedStartMinute.value}`
  const endTime = `${currentSelectedEndHour.value}:${currentSelectedEndMinute.value}`

  if (startTime >= endTime) {
    alert('Start time must be before end time.');
    return;
  }

  const newRange = `${startTime}-${endTime}`
  let datesWithOverlap = 0;

  for (const dateStr of selectedDates.value) {
    if (!availabilityByDate.value[dateStr]) {
      availabilityByDate.value[dateStr] = []
    }

    const currentRanges = availabilityByDate.value[dateStr]

    // Check for overlaps before adding
    let overlapsWithExisting = false;
    for (const existingRange of currentRanges) {
      const [existingStart, existingEnd] = existingRange.split('-');
      const newStartMinutes = parseInt(currentSelectedStartHour.value) * 60 + parseInt(currentSelectedStartMinute.value);
      const newEndMinutes = parseInt(currentSelectedEndHour.value) * 60 + parseInt(currentSelectedEndMinute.value);
      const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
      const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);

      if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
        overlapsWithExisting = true;
        datesWithOverlap++;
        break; // No need to check other ranges for this date
      }
    }

    if (!overlapsWithExisting) {
      currentRanges.push(newRange)
      currentRanges.sort() // Keep ranges sorted alphabetically
    }
  }

  if (datesWithOverlap > 0) {
    alert(`${datesWithOverlap} of ${selectedDates.value.length} selected dates had an overlapping time range and were not updated.`);
  }

  // Reset for next input (optional, could retain last selection)
  currentSelectedStartHour.value = '09';
  currentSelectedStartMinute.value = '00';
  currentSelectedEndHour.value = '17';
  currentSelectedEndMinute.value = '00';
};

// Remove time range from all selected dates
const removeTimeRange = (rangeToRemove: string) => {
  if (selectedDates.value.length === 0) return;

  for (const dateStr of selectedDates.value) {
    if (availabilityByDate.value[dateStr]) {
      const index = availabilityByDate.value[dateStr].indexOf(rangeToRemove);
      if (index > -1) {
        availabilityByDate.value[dateStr].splice(index, 1);
      }
    }
  }
};

// Computed property to display ranges from the *first* selected date in the modal.
// This is a common compromise: when bulk-editing, the specific ranges of individual dates
// before the edit might be complex. It's often simpler to show ranges of one representative date,
// or just rely on the add/remove actions applying to all.
const getRangesOfFirstSelectedDate = computed<string[]>(() => {
  if (selectedDates.value.length > 0) {
    const firstDate = selectedDates.value[0];
    return availabilityByDate.value[firstDate] || [];
  }
  return [];
});


// Keeping this commented out as per your previous code
// const generateFinalAvailabilities = (
//   availabilities: Record<string, string[]>,
// ): Record<string, string[]> => {
//   const finalAvailability: Record<string, string[]> = {}

//   for (const dateStr in availabilities) {
//     if (availabilities[dateStr].length > 0) {
//       const [year, month, day] = dateStr.split('-')
//       const formattedDate = `${day}/${month}/${year}`

//       finalAvailability[formattedDate] = availabilities[dateStr].map((timeRange) => {
//         return timeRange
//       })
//     }
//   }
//   return finalAvailability
// }

// async function saveSetup() {
//   if (!store.studySetupDTO.term?.startDate || !store.studySetupDTO.term?.endDate) {
//     errorMessage.value = 'Term start and end dates are not set. Please go back.'
//     return
//   }

//   const finalAvailabilities = generateFinalAvailabilities(availabilityByDate.value)
//   store.studySetupDTO.availabilities = finalAvailabilities

//   try {
//     console.log(`Generated availability for ${Object.keys(finalAvailabilities).length} dates.`)
//     console.log('Saving setup with DTO:', store.studySetupDTO)
//     // await StudySetupService.saveSetup(store.studySetupDTO) // Uncomment when ready to integrate API
//     emit('next')
//   } catch (error) {
//     console.error('Failed to save study setup:', error)
//     errorMessage.value = 'There was an error saving your schedule.'
//   }
// }
</script>

<template>
  <div class="h-screen flex flex-col items-center">
    <div class="w-4/5 flex flex-col flex-1 overflow-hidden">
      <div class="flex-1 flex bg-white rounded-2xl p-6 sm:p-8 overflow-hidden">
        <div class="flex flex-1 flex-col justify-center">
          <div class="text-center">
            <p class="text-gray-500 mb-5 mx-auto max-w-2xl">
              Click on a date to select available time slots for that specific day.
            </p>
            <button
              v-if="selectedDates.length > 0"
              @click="openBulkTimeSlotModal"
              class="mb-4 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold"
            >
              Set Times for Selected Dates ({{ selectedDates.length }} selected)
            </button>
            <button
              v-if="selectedDates.length > 0"
              @click="selectedDates = []"
              class="mb-4 ml-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Clear Selection
            </button>
          </div>

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
                    { 'bg-gray-50 text-gray-400': !day.isCurrentMonth, 'cursor-not-allowed': !day.isCurrentMonth },
                    {
                      'bg-green-50 hover:bg-green-100':
                        hasAvailability(day.dateStr) && day.isCurrentMonth && !isDateSelected(day.dateStr),
                    },
                    {
                      'bg-[#8A98DD]/25 hover:bg-yellow-100':
                        !hasAvailability(day.dateStr) && day.isCurrentMonth && !isDateSelected(day.dateStr),
                    },
                    {
                      'bg-purple-200 border-purple-500 ring-2 ring-purple-400': isDateSelected(day.dateStr) // Highlight selected dates
                    }
                  ]"
                  @click="toggleDateSelection(day.dateStr, day.isCurrentMonth)"
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
    v-if="isModalOpen"
    class="fixed inset-0 bg-black/50 z-50 flex justify-center items-center transition-all duration-300"
  >
    <div class="bg-white rounded-lg p-8 max-w-lg w-full relative">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Set Available Times for Selected Dates</h3>
        <button
          @click="closeModalAndClearSelection"
          class="text-red-500 hover:text-red-600 text-3xl font-bold p-2 -mt-2 -mr-2"
        >
          &times;
        </button>
      </div>
      <div class="mb-4 text-sm text-gray-600 max-h-24 overflow-y-auto border p-2 rounded-md">
        <p class="font-medium mb-1">Applying to ({{ selectedDates.length }}) dates:</p>
        <span
          v-for="(date, index) in selectedDates.sort()"
          :key="date"
          class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
        >
          {{ date }}<span v-if="index < selectedDates.length - 1">,</span>
        </span>
      </div>

      <div class="flex gap-4 mb-4 items-end">
        <div>
          <label for="startHour" class="block text-sm font-medium text-gray-700">Start Time</label>
          <div class="flex gap-2">
            <select
              id="startHour"
              v-model="currentSelectedStartHour"
              class="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option v-for="hour in hourOptions" :key="`sh-${hour}`" :value="hour">
                {{ hour }}
              </option>
            </select>
            <span class="mt-1 py-2 text-base">:</span>
            <select
              id="startMinute"
              v-model="currentSelectedStartMinute"
              class="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option v-for="minute in minuteOptions" :key="`sm-${minute}`" :value="minute">
                {{ minute }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label for="endHour" class="block text-sm font-medium text-gray-700">End Time</label>
          <div class="flex gap-2">
            <select
              id="endHour"
              v-model="currentSelectedEndHour"
              class="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option v-for="hour in hourOptions" :key="`eh-${hour}`" :value="hour">
                {{ hour }}
              </option>
            </select>
            <span class="mt-1 py-2 text-base">:</span>
            <select
              id="endMinute"
              v-model="currentSelectedEndMinute"
              class="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option v-for="minute in minuteOptions" :key="`em-${minute}`" :value="minute">
                {{ minute }}
              </option>
            </select>
          </div>
        </div>

        <button
          @click="addTimeRange"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 self-end"
        >
          Add
        </button>
      </div>

      <div v-if="getRangesOfFirstSelectedDate.length > 0" class="mb-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Current ranges on first selected date ({{ selectedDates[0] }}):</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="range in getRangesOfFirstSelectedDate"
            :key="range"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
          >
            {{ range }}
            <button @click="removeTimeRange(range)" class="ml-2 -mr-1 text-green-600 hover:text-green-800">
              &times;
            </button>
          </span>
        </div>
      </div>
      <div v-else class="mb-4 text-gray-500">No time ranges set for the first selected date.</div>

      <button
        @click="closeModalAndClearSelection"
        class="mt-6 w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
      >
        Done
      </button>
    </div>
  </div>
</template>
