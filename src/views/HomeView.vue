<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Store and router
const router = useRouter()
const authStore = useAuthStore()

// Load user data from localStorage on first mount if available
onMounted(() => {
  if (!authStore.user) {
    authStore.checkAuthStatus()
  }

  // Optional: If user is still not found, redirect to login
  if (!authStore.user) {
    router.push({ name: 'login' })
  }
})

// Logout handler
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', (error as Error).message)
  }
}
</script>


<template>
  <div class="home-container">
    <RouterLink to="/question-pref">Questionaire</RouterLink>
    <!-- Display User Info (Optional) -->
    <div>
      <h2>Welcome, {{ authStore.displayName }}</h2>
      <img
        :src="authStore.image"
        alt="Profile"
        class="user-photo"
      />
    </div>

    <!-- Log Out Button -->
    <button @click="handleLogout" class="logout-button">Log Out</button>
  </div>
</template>

<style scoped>
.home-container {
  width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-align: center;
}

.user-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-top: 10px;
}

.logout-button {
  padding: 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

.logout-button:hover {
  background-color: #d32f2f;
}
</style>
