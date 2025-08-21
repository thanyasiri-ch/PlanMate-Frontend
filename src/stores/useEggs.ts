import { ref, computed, onUnmounted } from "vue"
import egg1 from "@/assets/images/egg1.png"
import egg2 from "@/assets/images/egg2.png"
import egg3 from "@/assets/images/egg3.png"
import egg4 from "@/assets/images/egg4.png"
import egg5 from "@/assets/images/egg5.png"
import egg6 from "@/assets/images/egg6.png"
import egg7 from "@/assets/images/egg7.png"
import egg8 from "@/assets/images/egg8.png"
import egg9 from "@/assets/images/egg9.png"
import egg10 from "@/assets/images/egg10.png"
import egg11 from "@/assets/images/egg11.png"
import egg12 from "@/assets/images/egg12.png"
import type { FriendItem } from "@/types"

const eggs = [
  egg1, egg2, egg3, egg4, egg5, egg6,
  egg7, egg8, egg9, egg10, egg11, egg12,
]

// Calculate the egg frame index depending on elapsed time and session duration
function getFrameIndexFor(remainingSec: number, totalSec: number): number {
  if (totalSec <= 0) return 11

  const elapsed = Math.max(0, totalSec - remainingSec)
  const phaseDuration = totalSec / 4
  const phase = Math.min(3, Math.floor(elapsed / (phaseDuration || 1)))
  const nowMs = Date.now()

  if (phase === 0) return Math.floor(nowMs / 400) % 3
  if (phase === 1) return 3 + (Math.floor(nowMs / 400) % 3)
  if (phase === 2) {
    const progress = (elapsed - phaseDuration * 2) / (phaseDuration || 1)
    return 6 + Math.min(2, Math.floor(Math.max(0, Math.min(1, progress)) * 3))
  }
  if (remainingSec <= 0) return 11

  const progress4 = (elapsed - phaseDuration * 3) / (phaseDuration || 1)
  return 9 + Math.min(2, Math.floor(Math.max(0, Math.min(1, progress4)) * 3))
}

export function useEggs() {
  const currentFrame = ref(0)
  let frameInterval: number | null = null

  // Auto-update currentFrame (used for user’s own egg)
  function startFrameUpdater(timeLeft: () => number, totalSeconds: () => number) {
    if (frameInterval) return
    frameInterval = window.setInterval(() => {
      currentFrame.value = getFrameIndexFor(timeLeft(), totalSeconds())
    }, 200)
  }

  function stopFrameUpdater() {
    if (frameInterval) {
      clearInterval(frameInterval)
      frameInterval = null
    }
  }

  onUnmounted(() => stopFrameUpdater())

  // --- Helpers ---
  function getEggImageForFriend(friend: FriendItem) {
    return eggs[getFrameIndexFor(friend.timeLeft ?? 0, friend.sessionDuration ?? 0)] ?? eggs[0]
  }

  function getEggImageForUser(timeLeft: number, totalSeconds: number) {
    return eggs[getFrameIndexFor(timeLeft, totalSeconds)] ?? eggs[0]
  }

  const currentEggImage = computed(() => eggs[currentFrame.value] ?? eggs[0])

  return {
    currentFrame,
    currentEggImage,
    startFrameUpdater,
    stopFrameUpdater,
    getEggImageForFriend,
    getEggImageForUser,
  }
}
