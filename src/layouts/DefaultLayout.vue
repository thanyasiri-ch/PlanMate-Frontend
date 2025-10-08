<script setup lang="ts">
import { ref } from 'vue'
import SideBar from '@/components/SideBar.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import NotificationDropdown from '@/components/NotificationDropdown.vue'

const authStore = useAuthStore()
const showDropdown = ref(false)
const router = useRouter()

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', (error as Error).message)
  }
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function goToProfile() {
  router.push({ name: 'profile' })
  showDropdown.value = false
}
</script>
<template>
  <div class="flex h-screen bg-[#D5DBFF]">
    <!-- Sidebar -->
    <SideBar />

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="flex items-center justify-between px-5 py-4 bg-[#D5DBFF] relative">
        <div class="text-lg font-semibold"></div>
        <div class="flex items-center space-x-4 relative">
          <!-- Notification Dropdown Component -->
          <NotificationDropdown />

          <!-- Profile Dropdown -->
          <div class="relative">
            <img
              :src="authStore.image"
              alt="Profile"
              class="w-9 h-9 rounded-full object-cover cursor-pointer"
              @click="toggleDropdown"
            />

            <!-- Dropdown -->
            <div
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-300 z-10 p-2"
            >
              <button
                @click="goToProfile"
                class="flex items-center w-full px-3 py-2 rounded-lg space-x-4 mb-2 hover:bg-gray-200"
              >
                <img
                  :src="authStore.image"
                  alt="Profile"
                  class="w-8 h-8 rounded-full object-cover border border-gray-100"
                />
                <span class="font-semibold text-lg text-black">
                  {{ authStore.displayName }}
                </span>
              </button>
              <hr class="border-t-2 border-gray-300 mb-2" />
              <button
                @click="handleLogout"
                class="flex items-center text-black w-full px-3 py-2 rounded-lg space-x-4 hover:bg-gray-200"
              >
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H14m-1 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                  />
                </svg>
                <span class="font-medium text-base text-black">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content will render here -->
      <div class="flex-1 overflow-auto">
        <!--overflow-auto-->
        <slot />
      </div>
    </main>
  </div>
</template>
