import { ref, computed, onUnmounted } from 'vue'
import type { FriendItem } from '@/types'

import eggIntact2 from '@/assets/images/eggs/eggIntact2.png'

import eggCrack2 from '@/assets/images/eggs/eggCrack2.png'

import eggHatch1 from '@/assets/images/eggs/eggHatch1.png'
import eggHatch3 from '@/assets/images/eggs/eggHatch3.png'
import eggHatch4 from '@/assets/images/eggs/eggHatch4.png'
import eggHatch5 from '@/assets/images/eggs/eggHatch5.png'

import duck from '@/assets/images/eggs/duck.png'

const eggs = [eggIntact2, eggCrack2, eggHatch1, eggHatch3, eggHatch4, eggHatch5, duck]

// Calculate the egg frame index depending on elapsed time and session duration
function getFrameIndexFor(remainingSec: number, totalSec: number): number {
  if (totalSec <= 0) return eggs.length - 1 // final duck frame

  const elapsed = Math.max(0, totalSec - remainingSec)
  const progress = Math.min(1, elapsed / totalSec)

  // Show duck from 90% onward
  if (progress >= 0.9) {
    return eggs.length - 1
  }

  // Map 0–0.9 progress to egg frames (excluding the duck)
  const effectiveFrames = eggs.length - 1
  const frameIndex = Math.floor((progress / 0.9) * (effectiveFrames - 1))

  return frameIndex
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
