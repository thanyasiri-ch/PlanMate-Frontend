<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { googleSignIn, createInitialUser } from '@/services/auth'
import { useSignupStore } from '@/stores/signupStore'
import '@/assets/css/auth.css'

const displayName = ref('')
const email = ref('')
const password = ref('')
const router = useRouter()
const signupStore = useSignupStore()
const formAlert = ref('')

const nameValid = ref(true)
const emailValid = ref(true)
const passwordValid = ref(true)

const handleNext = async () => {
  if (!validateForm()) return

  try {
    // Attempt to create the user first
    await createInitialUser(email.value, password.value, displayName.value) // If successful, store user data and continue

    signupStore.setUserData(displayName.value, email.value, password.value)
    router.push({ name: 'signupWithImage' })
  } catch (error: any) {
    const message = error?.message || 'Unknown error'
    console.error('Signup error:', message)

    if (message.includes('auth/email-already-in-use')) {
      formAlert.value = 'Email already in use. Please use a different email.'
      emailValid.value = false
    } else {
      formAlert.value = 'An error occurred during signup. Please try again.'
    }
  }
}

const validateForm = () => {
  let valid = true

  // Reset validation states
  formAlert.value = ''
  nameValid.value = true
  emailValid.value = true
  passwordValid.value = true

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d|[^A-Za-z0-9]).{8,}$/

  // Track invalid fields
  const invalidFields: string[] = []

  // Display name
  if (!displayName.value.trim()) {
    nameValid.value = false
    valid = false
    invalidFields.push('name')
  }

  // Email
  if (!email.value.trim() || !emailPattern.test(email.value)) {
    emailValid.value = false
    valid = false
    invalidFields.push('email')
  }

  // Password
  if (!password.value.trim() || !passwordPattern.test(password.value)) {
    passwordValid.value = false
    valid = false
    invalidFields.push('password')
  }

  // Set alert message
  if (invalidFields.length === 1) {
    if (invalidFields[0] === 'email') {
      formAlert.value = 'Please enter a valid email address.'
    } else if (invalidFields[0] === 'password') {
      formAlert.value =
        'Password must be at least 8 characters and include letters, numbers, or symbols.'
    } else {
      formAlert.value = 'Please fill out your name.'
    }
  } else if (invalidFields.length === 2 || invalidFields.length === 3) {
    if (!displayName.value.trim() && !email.value.trim() && !password.value.trim()) {
      formAlert.value = 'Please complete all required fields.'
    } else {
      formAlert.value = 'Please fill in all fields correctly before continuing.'
    }
  }

  return valid
}

const handleGoogleSignUp = async () => {
  try {
    const user = await googleSignIn();
    console.log('Google user signed up:', user);
    router.push({ name: 'question' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error during Google sign-up:', message)
    alert('Google Sign-Up failed: ' + message)
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
        src="/src/assets/images/signup_icon.png"
        alt="Login Illustration"
        class="illustration-image"
      />
    </div>

    <div class="right-panel">
      <div class="form-container">
        <h1>Sign Up</h1>

        <div v-if="formAlert" class="form-alert">
          {{ formAlert }}
        </div>

        <form @submit.prevent="handleNext" class="signup-form">
          <div class="input-group">
            <label for="name">Display Name</label>
            <input
              type="text"
              id="text"
              v-model="displayName"
              :class="{
                'input-error': !nameValid,
                'input-success': nameValid && displayName,
              }"
              placeholder="Enter your display name"
            />
          </div>

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

          <button type="submit" class="signup-button primary-button">Sign Up</button>

          <button type="button" @click="handleGoogleSignUp" class="google-button secondary-button">
            <img src="/src/assets/images/google-icon.png" alt="Google Icon" class="google-icon" />
            Sign Up with Google
          </button>
        </form>

        <div class="switch-form-link">
          <p>Already have an account? <router-link to="/login">Log in</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>
