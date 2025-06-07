<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import '@/assets/css/auth.css';

const email = ref('');
const password = ref('');
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    await authStore.loginWithEmail(email.value, password.value);
    router.push({ name: 'profile' });
  } catch (error: any) {
    console.error('Error during login:', error.message);
  }
};

const handleGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    router.push({ name: 'profile' });
  } catch (error: any) {
    console.error('Error during Google login:', error.message);
  }
};
</script>

<template>
  <div class="page-container">
    <div class="left-panel">
      <div class="main-logo-container">
        <img src="/src/assets/images/logo.png" alt="PlanMate Logo" class="main-logo" />
      </div>
      <img src="/src/assets/images/login_icon.png" alt="Login Illustration" class="illustration-image" />
    </div>

    <div class="right-panel">
      <div class="form-container">
        <h1>Log In</h1>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="email"
              required
              placeholder="Enter your email"
            />
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" class="login-button primary-button">Log In</button>

          <button type="button" @click="handleGoogleLogin" class="google-button secondary-button">
            <img src="/src/assets/images/google-icon.png" alt="Google Icon" class="google-icon" /> Log In with Google
          </button>
        </form>

        <div class="switch-form-link">
          <p>Don't have an account? <router-link to="/signup">Sign Up</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>
