<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from 'firebase/auth';  // Import Firebase Authentication
import { auth } from '@/firebase/firebase';  // Import the Firebase auth instance

// Get the router instance for navigation
const router = useRouter();

// Reactive variable to hold user info (optional for displaying user's name or email)
const user = ref<unknown>(null);

// Fetch the current user (optional: display user info)
const currentUser = auth.currentUser;
if (currentUser) {
  user.value = currentUser;
}

const handleLogout = async () => {
  try {
    await signOut(auth);  // Firebase sign out
    console.log('User logged out');
    user.value = null; // Clear the user data after logging out
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Error logging out:', error.message);
  }
};
</script>

<template>
  <div class="home-container">
    <h1>Welcome to Home Page</h1>

    <!-- Display User Info (Optional) -->
    <p v-if="user">Hello, {{ user.email }}!</p>

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
