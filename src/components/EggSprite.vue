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
  timer?: string
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

// Compute phase class based on current frame
const phaseClass = computed(() => {
  const name = eggImage.value

  if (name.includes("eggIntact")) return "phase-intact"
  if (name.includes("eggCrack")) return "phase-crack"
  if (name.includes("eggHatch")) return "phase-hatch"
  if (name.includes("duck")) return "phase-duck"
  return ""
})

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
      :class="phaseClass"
      :style="{ backgroundImage: `url(${eggImage})`, animationPlayState: animationState }"
    ></div>

    <!-- Name / timer -->
    <div class="mt-2 h-14 flex flex-col justify-center items-center">
      <p class="text-md font-semibold text-slate-600 truncate">
        <slot name="name">
          {{ isUser ? 'You' : friend?.name }}
        </slot>
      </p>

      <p
        v-if="timer"
        class="text-sm font-mono text-slate-500 bg-slate-200/70 rounded px-2 py-0.5 truncate"
      >
        {{ timer }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.sprite {
  width: 204px;
  height: 326px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

/* ---- Animations ---- */
.phase-intact {
  animation: bounce 1.2s ease-in-out infinite;
}
.phase-crack {
  animation: shake 0.5s ease-in-out infinite;
}
.phase-hatch {
  animation: wobble 0.8s ease-in-out infinite;
}
.phase-duck {
  animation: shake2 1s ease-in-out infinite;
}

/* Keyframes */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 2px); }
  50% { transform: translate(2px, -2px); }
  75% { transform: translate(-2px, 2px); }
}
@keyframes wobble {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes shake2 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1px, 1px); }
  50% { transform: translate(1px, -1px); }
  75% { transform: translate(-1px, 1px); }
}
</style>
