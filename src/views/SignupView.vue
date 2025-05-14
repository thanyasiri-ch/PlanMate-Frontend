<script setup lang="ts">
import { ref } from 'vue';

// Reactive properties for email and password
const email = ref('');
const password = ref('');

// Method for handling sign-up
const handleSignUp = () => {
  // Handle the sign-up logic here (e.g., send data to the backend)
  console.log('Signing up with email:', email.value);
  console.log('Password:', password.value);

  // Reset the form
  email.value = '';
  password.value = '';
};

// Method for Google Sign-Up (you can integrate your Google sign-up logic here)
const signUpWithGoogle = () => {
  console.log('Signing up with Google...');
};
</script>

<template>
  <div class="signup-container">
    <h2>Sign Up</h2>

    <!-- Sign Up Form -->
    <form @submit.prevent="handleSignUp" class="signup-form">
      <!-- Email Input -->
      <div class="input-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required placeholder="Enter your email" />
      </div>

      <!-- Password Input -->
      <div class="input-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required placeholder="Enter your password" />
      </div>

      <!-- Sign Up Button -->
      <button type="submit" class="signup-button">Sign Up</button>
    </form>

    <!-- Sign Up with Google Button -->
    <div class="google-signup">
      <button @click="signUpWithGoogle" class="google-button">
        Sign Up with Google
      </button>
    </div>
  </div>
</template>
