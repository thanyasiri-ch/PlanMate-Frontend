<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signIn } from '@/services/auth'; // Assuming signIn method is defined in auth.ts

// Reactive properties for email and password
const email = ref('');
const password = ref('');

// Get router instance for redirection
const router = useRouter();

const handleLogin = async () => {
  try {
    console.log('Logging in with email:', email.value);
    console.log('Password:', password.value);

    const user = await signIn(email.value, password.value);
    console.log('User logged in:', user);

    // Redirect to home page (or any other page after successful login)
    router.push({ name: 'home' });  // You can adjust this to wherever you want to redirect
  } catch (error) {
    console.error('Error during login:', error.message);
  }
};
</script>

<template>
  <div class="login-container">
    <h1>Log In</h1>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" class="login-form">
      <!-- Email Input -->
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

      <!-- Password Input -->
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

      <!-- Login Button -->
      <button type="submit" class="login-button">Log In</button>
    </form>

    <!-- Link to Sign Up Page -->
    <div class="signup-link">
      <p>Don't have an account? <router-link to="/signup">Sign Up</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.login-form .input-group {
  margin-bottom: 15px;
}

.login-form label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
}

.login-form input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.login-button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #45a049;
}

.signup-link {
  margin-top: 20px;
  text-align: center;
}

.signup-link a {
  color: #4CAF50;
  text-decoration: none;
}
</style>
