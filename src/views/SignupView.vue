<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signUp, googleSignUp } from '@/services/auth';
import '@/assets/css/auth.css';

// Reactive properties for email and password
const displayName = ref('')
const email = ref('');
const password = ref('');

const router = useRouter();

const handleSignUp = async () => {
  try {
    console.log('Signing up with email:', email.value);
    console.log('Password:', password.value);

    const user = await signUp(email.value, password.value); // Calls signup from auth.ts
    console.log('User signed up:', user);

    // redirect to Login page
    router.push({ name: 'login' })
  } catch (error) {
    console.error(error.message);
  }
};

// Google Sign-Up method
const handleGoogleSignUp = async () => {
  try {
    const user = await googleSignUp(); // Calls googleSignUp from auth.ts
    console.log('Google user signed up:', user);
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Error during Google sign-up:', error.message);
  }
};
</script>

<template>
  <div class="page-container">
    <div class="left-panel">
      <div class="main-logo-container">
        <img src="/src/assets/images/logo.png" alt="PlanMate Logo" class="main-logo" />
      </div>
      <img src="/src/assets/images/signup_icon.png" alt="Login Illustration" class="illustration-image" />
    </div>

    <div class="right-panel">
      <div class="form-container">
        <h1>Sign Up</h1>

        <!-- Sign Up Form -->
        <form @submit.prevent="handleSignUp" class="signup-form">
          <!-- Display Name Input -->
          <div class="input-group">
            <label for="name">Display Name</label>
            <input type="name" id="name" v-model="displayName" required placeholder="Enter your display name" />
          </div>

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
          <button type="submit" class="signup-button primary-button">Sign Up</button>

          <!-- Sign Up with Google Button -->
          <button @click="handleGoogleSignUp" class="google-button secondary-button">
            <img src="/src/assets/images/google-icon.png" alt="Google Icon" class="google-icon" /> Sign Up with Google
          </button>
        </form>

        <div class="switch-form-link">
          <p>Already have an account? <router-link to="/login">Log in</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>
