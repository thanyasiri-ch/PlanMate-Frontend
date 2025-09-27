<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed bottom-10 right-12 bg-gradient-to-br from-purple-600 to-yellow-500 shadow-xl rounded-xl p-4 w-80 flex flex-col gap-2 z-50 text-white transform transition-transform duration-300 hover:scale-105"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ icon }}</span>
        <p class="font-bold text-xl">{{ popupTitle }}</p>
      </div>

      <div class="w-full bg-white bg-opacity-30 rounded-full h-2 overflow-hidden">
        <div
          class="bg-white h-2 rounded-full transition-all duration-500"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>

      <p class="text-sm opacity-90">{{ popupMessage }}</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  currentScore: number
  nextRankScore: number
  userRank: number
}
const props = defineProps<Props>()

const visible = ref(false)
const popupTitle = ref('')
const popupMessage = ref('')
const progressPercent = ref(0)
const icon = ref('')

function showProgressPopup() {
  const percent =
    props.userRank === 1
      ? 100
      : Math.min((props.currentScore / props.nextRankScore) * 100, 100)

  progressPercent.value = percent

  if (props.userRank === 1) {
    icon.value = '🏆'
    popupTitle.value = 'Awesome!'
    popupMessage.value = 'You are #1! Keep up the great work!'
  } else {
    const remaining = props.nextRankScore - props.currentScore
    icon.value = '🚀'
    popupTitle.value = 'Keep it up!'
    popupMessage.value = `Just ${remaining} more points to the next rank!`
  }

  visible.value = true
  setTimeout(() => {
    visible.value = false
  }, 4000)
}

watch(
  () => props.currentScore,
  () => showProgressPopup(),
  { immediate: true }
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
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
