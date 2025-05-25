<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { googleSignIn } from '@/services/auth';
import { useSignupStore } from '@/stores/signupStore';
import '@/assets/css/auth.css';

const displayName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const signupStore = useSignupStore();

const handleNext = () => {
  if (!displayName.value || !email.value || !password.value) {
    alert('All fields are required.');
    return;
  }

  // Save signup info to store
  signupStore.setUserData(displayName.value, email.value, password.value);

  // Move to image upload step
  router.push({ name: 'signupWithImage' });
};

const handleGoogleSignUp = async () => {
  try {
    const user = await googleSignIn();
    console.log('Google user signed up:', user);
    router.push({ name: 'question' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error during Google sign-up:', message);
    alert('Google Sign-Up failed: ' + message);
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

        <form @submit.prevent="handleNext" class="signup-form">
          <div class="input-group">
            <label for="name">Display Name</label>
            <input type="text" id="name" v-model="displayName" required placeholder="Enter your display name" />
          </div>

          <div class="input-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" required placeholder="Enter your email" />
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" required placeholder="Enter your password" />
          </div>

          <button type="submit" class="signup-button primary-button">Sign Up</button>

          <button type="button" @click="handleGoogleSignUp" class="google-button secondary-button">
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
