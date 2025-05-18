<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn, googleSignIn } from '@/services/auth'; // Assuming signIn method is defined in auth.ts
import '@/assets/css/auth.css';

// Reactive properties for email and password
const email = ref('');
const password = ref('');

const router = useRouter();

const handleLogin = async () => {
  try {
    console.log('Logging in with email:', email.value);
    console.log('Password:', password.value);

    const user = await signIn(email.value, password.value);
    console.log('User logged in:', user);

    // Redirect to home page (or any other page after successful login)
    router.push({ name: 'home' });
  } catch (error) {
    console.error('Error during login:', error.message);
  }
};

// Handle Google login
const handleGoogleLogin = async () => {
  try {
    const { user, displayName, photoURL } = await googleSignIn(); // Calls googleSignIn from auth.ts

    console.log('Google user logged in:', user);
    router.push({
      name: 'home',
      state: { displayName: displayName, profileImage: photoURL }
    });  // Redirect to home page after Google login
  } catch (error) {
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
