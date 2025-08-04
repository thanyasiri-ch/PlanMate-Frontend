<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Topbar from '@/layouts/Topbar.vue'
import book1 from '../assets/images/book1.png'
import book2 from '../assets/images/book2.png'
import book3 from '../assets/images/book3.png'
import { watch } from 'vue'

interface Task {
  name: string
  progress: string
}

const tasks = ref<Task[]>([
  { name: 'English', progress: '1/4' },
  { name: 'Math', progress: '1/4' },
  { name: 'ComPro', progress: '2/4' },
])

const selectedTask = ref<string | null>(null)
const isFocusing = ref(false)

const router = useRouter()

const motivationMessages = [
  "Time to grow. Let's focus on",
  'Ready to start? Get ready for',
  "Let's get it done! Focus on",
  'A little progress each day adds up to big results. Focus on',
  "Don't stop until you're proud. Let's focus on",
]

const randomMotivation = ref(motivationMessages[0])

const startFocus = () => {
  if (selectedTask.value) {
    isFocusing.value = true
    // ส่งแค่ชื่อ task ไปที่หน้า focus-mode
    router.push({ path: '/focus-mode', query: { task: selectedTask.value } })
  }
}

const progressDots = computed(() => (taskProgress: string) => {
  const [completed, total] = taskProgress.split('/').map(Number)
  const dots = []
  for (let i = 0; i < total; i++) {
    dots.push(i < completed)
  }
  return dots
})

const currentTaskProgress = computed(() => {
  if (!selectedTask.value) return '0/0'
  return tasks.value.find((t) => t.name === selectedTask.value)?.progress || '0/0'
})

onMounted(() => {
  const randomIndex = Math.floor(Math.random() * motivationMessages.length)
  randomMotivation.value = motivationMessages[randomIndex]
})

const frames = [book1, book2, book3]

const currentFrame = ref(0)
let intervalId: number | null = null

const animateOnce = () => {
  currentFrame.value = 0
  let frameIndex = 1

  const animInterval = setInterval(() => {
    if (frameIndex < frames.length) {
      currentFrame.value = frameIndex
      frameIndex++
    } else {
      clearInterval(animInterval)
    }
  }, 400) // ปรับเวลาเปลี่ยนเฟรมตามต้องการ (ms)
}
watch(selectedTask, (newTask, oldTask) => {
  if (newTask !== oldTask && newTask !== null) {
    animateOnce()
  }
})
</script>

<template>
  <Topbar>
    <div class="h-full overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full px-10 pt-4 pb-8 box-border">
        <section class="bg-white rounded-2xl p-6 flex flex-col h-full overflow-auto shadow-md">
          <div class="flex justify-between items-center shrink-0">
            <h2 class="text-[20px] font-semibold text-gray-800">To-do list</h2>
            <select class="border border-gray-300 rounded-xl px-3 py-1 text-sm text-gray-600">
              <option>Today</option>
              <option>Tomorrow</option>
            </select>
          </div>

          <div class="mt-6 flex flex-col gap-4 text-[15px] text-gray-700 overflow-auto">
            <label
              v-for="task in tasks"
              :key="task.name"
              class="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors duration-200"
              :class="{
                'bg-gray-100 shadow-sm': selectedTask === task.name,
                'hover:bg-gray-50': selectedTask !== task.name,
              }"
            >
              <div class="flex items-center gap-3">
                <input
                  type="radio"
                  name="task"
                  :value="task.name"
                  v-model="selectedTask"
                  class="accent-black h-4 w-4"
                />
                <span class="font-medium text-gray-800">{{ task.name }}</span>
              </div>
              <div class="flex gap-1">
                <div
                  v-for="(isCompleted, index) in progressDots(task.progress)"
                  :key="index"
                  class="w-3 h-3 rounded-full"
                  :class="{ 'bg-[#7486FB]': isCompleted, 'bg-gray-300': !isCompleted }"
                ></div>
              </div>
            </label>
          </div>
        </section>

        <div class="col-span-2 flex flex-col items-center justify-center h-full">
          <div v-if="!selectedTask" class="text-gray-500 text-lg text-center animate-fade-in">
            <p>Select a task from the left panel to start Focus Mode</p>
          </div>

          <div v-else class="text-center space-y-8 animate-fade-in">
            <p class="text-xl font-medium text-gray-600">{{ randomMotivation }}</p>
            <div class="space-y-4">
              <h1 class="text-6xl font-extrabold text-[#4455c0e0]">
                {{ selectedTask }}
              </h1>
              <div class="flex justify-center items-center gap-2">
                <div
                  v-for="(isCompleted, index) in progressDots(currentTaskProgress)"
                  :key="index"
                  class="w-4 h-4 rounded-full shadow-sm"
                  :class="{ 'bg-[#4455c0d7]': isCompleted, 'bg-gray-100': !isCompleted }"
                ></div>
              </div>
            </div>

            <div class="book-frame-container">
              <img :src="frames[currentFrame]" alt="Books animation" class="book-frame-image" />
            </div>
            <button
              @click="startFocus"
              :disabled="isFocusing"
              class="relative w-36 h-36 mt-16 rounded-full bg-[#fdecc3d6] hover:bg-[#f8dd9ad3] transition-colors"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="w-32 h-32 rounded-full bg-[#FBCC69] flex items-center justify-center text-white text-xl font-bold"
                >
                  Start Focus
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Topbar>
</template>

<style scoped>
/* You might want to add keyframes for the fade-in animation in your main CSS or a style tag */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
.book-frame-container {
  width: 200px;
  height: 188px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

.book-frame-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
</style>
