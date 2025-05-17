<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signOut } from 'firebase/auth' // Import Firebase Authentication
import { auth } from '@/firebase/firebase' // Import the Firebase auth instance

// Get the router instance for navigation and route instance to access state
const router = useRouter()
// Use useRoute to access the route's state
const route = useRoute()

// Reactive variables to hold user info
const user = ref<unknown>(null)
const displayName = ref(route.state?.displayName || 'Guest')
const profileImage = ref(route.state?.profileImage || '')

const defaultImage = 'https://www.example.com/default-avatar.png'

// Fetch the current user info when the component is mounted
onMounted(() => {
  const currentUser = auth.currentUser

  if (currentUser) {
    user.value = currentUser
    displayName.value = currentUser.displayName || 'Guest'
    profileImage.value = currentUser.photoURL || defaultImage
    console.log('Show image: ', profileImage.value)
  }
})

// Log out the user
const handleLogout = async () => {
  try {
    await signOut(auth) 
    console.log('User logged out')
    user.value = null
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', error.message)
  }
}
</script>

<template>
  <div class="home-container">
    <h1>Welcome to Home Page</h1>

    <!-- Display User Info (Optional) -->
    <div v-if="user">
      <h2>Welcome, {{ displayName }}</h2>
      <img :src="profileImage" alt="User's Profile Image" class="user-photo" />
    </div>

    <!-- Log Out Button -->
    <button v-if="user" @click="handleLogout" class="logout-button">Log Out</button>
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
