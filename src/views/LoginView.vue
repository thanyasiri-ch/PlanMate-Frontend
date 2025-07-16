<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/css/auth.css'

const email = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore()

const formAlert = ref('')
const emailValid = ref(true)
const passwordValid = ref(true)

const validateForm = () => {
  formAlert.value = ''
  emailValid.value = true
  passwordValid.value = true

  let valid = true
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidFields: string[] = []

  if (!email.value.trim() || !emailPattern.test(email.value)) {
    emailValid.value = false
    valid = false
    invalidFields.push('email')
  }

  if (!password.value.trim()) {
    passwordValid.value = false
    valid = false
    invalidFields.push('password')
  }

  if (invalidFields.length === 1) {
    if (invalidFields[0] === 'email') {
      formAlert.value = 'Please enter a valid email address.'
    } else {
      formAlert.value = 'Please enter your password.'
    }
  } else if (invalidFields.length === 2) {
    formAlert.value = 'Please fill in all fields correctly before continuing.'
  }

  return valid
}

const handleLogin = async () => {
  if (!validateForm()) return

  try {
    await authStore.loginWithEmail(email.value, password.value);
    router.push({ name: 'profile' });
  } catch (error: any) {
    formAlert.value = 'Login failed. Please check your credentials.'
    emailValid.value = false
    passwordValid.value = false
    console.error('Error during login:', error.message)
  }
}

const handleGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    router.push({ name: 'profile' });
  } catch (error: any) {
    console.error('Error during Google login:', error.message)
  }
}
</script>

<template>
  <div class="page-container">
    <div class="left-panel">
      <div class="main-logo-container">
        <img src="/src/assets/images/logo.png" alt="PlanMate Logo" class="main-logo" />
      </div>
      <img
        src="/src/assets/images/login_icon.png"
        alt="Login Illustration"
        class="illustration-image"
      />
    </div>

    <div class="right-panel">
      <div class="form-container">
        <h1>Log In</h1>

        <div v-if="formAlert" class="form-alert">
          {{ formAlert }}
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label for="email">Email</label>
            <input
              type="text"
              id="email"
              v-model="email"
              :class="{
                'input-error': !emailValid,
                'input-success': emailValid && email,
              }"
              placeholder="Enter your email"
            />
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              :class="{
                'input-error': !passwordValid,
                'input-success': passwordValid && password,
              }"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" class="login-button primary-button">Log In</button>

          <button type="button" @click="handleGoogleLogin" class="google-button secondary-button">
            <img src="/src/assets/images/google-icon.png" alt="Google Icon" class="google-icon" />
            Log In with Google
          </button>
        </form>

        <div class="switch-form-link">
          <p>Don't have an account? <router-link to="/signup">Sign Up</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>
