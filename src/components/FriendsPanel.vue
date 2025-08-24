<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { XMarkIcon, UserPlusIcon } from "@heroicons/vue/24/solid"
import defaultImage from "@/assets/images/default_image.webp"
import type { FriendItem } from "@/types";

const props = defineProps<{
  show: boolean
  onlineFriends: FriendItem[]
  selectedFriends: FriendItem[]
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "request-focus", friend: FriendItem): void
  (e: "remove-friend", id: string): void
}>()
</script>

<template>
  <transition name="slide">
    <div
      v-if="show"
      class="absolute top-0 left-0 h-full w-full max-w-xs bg-white border-r border-slate-200 shadow-xl z-50 p-6 flex flex-col"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-slate-700">Friends Online</h2>
        <button
          @click="emit('close')"
          class="p-1 rounded-full hover:bg-slate-200"
          aria-label="Close Friend Panel"
        >
          <XMarkIcon class="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <ul class="space-y-2 overflow-y-auto">
        <li
          v-for="friend in onlineFriends"
          :key="friend.id"
          class="flex items-center justify-between space-x-3 hover:bg-sky-100 p-2 rounded-lg"
        >
          <div class="flex items-center space-x-3 flex-grow">
            <div class="relative">
              <img
                :src="friend.image || defaultImage"
                alt="Profile"
                class="w-10 h-10 rounded-full object-cover"
              />
              <span
                class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
              ></span>
            </div>
            <span class="text-slate-800 font-medium">{{ friend.name }}</span>
          </div>

          <!-- Add / Remove Button -->
          <button
            v-if="!selectedFriends.some((f) => f.id === friend.id)"
            @click.stop="emit('request-focus', friend)"
            class="text-sky-500 hover:text-sky-700 p-1 rounded-full hover:bg-sky-100"
            aria-label="Request Focus"
          >
            <UserPlusIcon class="h-5 w-5" />
          </button>
          <button
            v-else
            @click.stop="emit('remove-friend', friend.id)"
            class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
            aria-label="Remove Friend"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </li>
      </ul>
    </div>
  </transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
