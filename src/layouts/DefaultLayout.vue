<template>
  <div class="flex h-screen bg-[#F1EFFF]">
    <!-- Sidebar -->
    <SideBar />

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="flex items-center justify-between px-5 py-4 bg-[#F1EFFF]">
        <div class="text-lg font-semibold"></div>
        <div class="flex items-center space-x-4">
          <button class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022 23.848 23.848 0 005.455 1.31m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>
          <img :src="authStore.image" alt="Profile" class="w-9 h-9 rounded-full object-cover" />
        </div>
      </header>

      <!-- Page content will render here -->
      <div class="flex-1"> <!--overflow-auto-->
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import SideBar from '@/components/SideBar.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
