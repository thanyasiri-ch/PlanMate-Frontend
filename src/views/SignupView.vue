<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signUp } from '@/services/auth';

// Reactive properties for email and password
const email = ref('');
const password = ref('');

const router = useRouter();

const handleSignUp = async () => {
  try {
    console.log('Signing up with email:', email.value);
    console.log('Password:', password.value);

    const user = await signUp(email.value, password.value);
    console.log('User signed up:', user);

    // redirect to Login page
    router.push({ name: 'login' })
  } catch (error) {
    console.error(error.message);
  }
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

<style scoped>
.signup-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.signup-form .input-group {
  margin-bottom: 20px;
}

.signup-form label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
  color: #555;
}

.signup-form input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  transition: border-color 0.3s;
}

.signup-form input:focus {
  border-color: #4CAF50;
  outline: none;
}

.signup-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.signup-button:hover {
  background-color: #45a049;
}

.google-signup {
  margin-top: 20px;
  text-align: center;
}

.google-button {
  width: 100%;
  padding: 12px;
  background-color: #db4437;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.google-button:hover {
  background-color: #c1351d;
}

@media (max-width: 480px) {
  .signup-container {
    padding: 15px;
    width: 90%;
  }

  .signup-button {
    padding: 10px;
  }

  .google-button {
    padding: 10px;
  }
}
</style>
