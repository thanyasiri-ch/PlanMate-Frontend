<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="bg-gradient-to-r from-[#544BAA] to-[#8089CE] text-white font-bold text-center p-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 relative overflow-hidden animate-pop-in shine-infinite"
    >
<div class="flex-shrink-0">
        <span class="text-4xl">{{ icon }}</span>
      </div>
      <div class="text-left">
        <span class="font-semibold text-lg">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  totalFocusDuration: number
  goalMinutes?: number
}

const props = defineProps<Props>()
const visible = ref(true)
const message = ref('')
const icon = ref('')

const performance = computed(() => {
  const goal = props.goalMinutes || 90
  return Math.min((props.totalFocusDuration / goal) * 100, 150)
})

watch(
  () => performance.value,
  (val) => {
    if (val >= 120) {
      icon.value = "🚀"
      message.value = "Overachiever! You went above and beyond!"
    } else if (val >= 100) {
      icon.value = "🔥"
      message.value = "Awesome! You’ve smashed today’s goal!"
    } else if (val >= 70) {
      icon.value = "💪"
      message.value = "Great progress — you’re almost there!"
    } else if (val >= 40) {
      icon.value = "✨"
      message.value = "Every bit counts — keep pushing!"
    } else {
      icon.value = "🌱"
      message.value = "A new day awaits! Let's start fresh tomorrow."
    }

    visible.value = true
  },
  { immediate: true },
)
</script>

<style scoped>
@keyframes pop-in {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-pop-in {
  animation: pop-in 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.shine-infinite {
  position: relative;
  overflow: hidden;
}

.shine-infinite::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 10%;
  height: 100%;
  background: rgba(224, 224, 224, 0.212);
  transform: skewX(-20deg);
  filter: blur(10px);
  animation: shine-loop 5s ease-in-out infinite;
}

@keyframes shine-loop {
  0% {
    left: -75%;
  }
  100% {
    left: 125%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
