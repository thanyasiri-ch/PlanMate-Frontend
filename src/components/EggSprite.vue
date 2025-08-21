<script setup lang="ts">
import { computed, onMounted, onUnmounted, unref, type Ref } from "vue"
import { useEggs } from "@/stores/useEggs"
import type { FriendItem } from "@/types"

const props = defineProps<{
  isUser?: boolean
  timeLeft?: number | Ref<number>
  totalSeconds?: number | Ref<number>
  friend?: FriendItem
  status?: "FOCUSING" | "PAUSED" | string
  label?: string
}>()

const {
  currentEggImage,
  startFrameUpdater,
  stopFrameUpdater,
  getEggImageForFriend,
} = useEggs()

// Pick the right egg image
const eggImage = computed(() => {
  if (props.isUser) {
    return currentEggImage.value
  }
  if (props.friend) {
    return getEggImageForFriend(props.friend)
  }
  return ""
})

// Animation (shaking only when focusing)
const animationState = computed(() =>
  props.status === "FOCUSING" ? "running" : "paused"
)

onMounted(() => {
  if (props.isUser) {
    startFrameUpdater(
      () => unref(props.timeLeft!) ?? 0,
      () => unref(props.totalSeconds!) ?? 1
    )
  }
})

onUnmounted(() => {
  if (props.isUser) stopFrameUpdater()
})
</script>

<template>
  <div class="flex flex-col items-center text-center">
    <!-- Egg sprite -->
    <div
      class="sprite"
      :style="{ backgroundImage: `url(${eggImage})`, animationPlayState: animationState }"
    ></div>

    <!-- Name / label -->
    <p class="mt-2 text-md font-semibold text-slate-600">
      <slot name="name">
        {{ isUser ? "You" : friend?.name }}
      </slot>
    </p>

    <p
      v-if="label"
      class="text-sm font-mono text-slate-500 bg-slate-200/70 rounded px-2 py-0.5"
    >
      {{ label }}
    </p>
  </div>
</template>

<style scoped>
.sprite {
  width: 204px;
  height: 326px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  animation: shake 0.5s ease-in-out infinite;
}
@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 1px); }
  50% { transform: translate(2px, -1px); }
  75% { transform: translate(-1px, 2px); }
}
</style>
