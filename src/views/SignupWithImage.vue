<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSignupStore } from '@/stores/signupStore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const signupStore = useSignupStore()
const authStore = useAuthStore()

const imageFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const MAX_FILE_SIZE_MB = 2
const isLoading = ref(false)

const defaultProfileImage = '/src/assets/images/default_image.webp'

const onFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    const file = files[0]
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File is too large. Max allowed size is ${MAX_FILE_SIZE_MB}MB.`)
      imageFile.value = null
      previewUrl.value = null
      ;(e.target as HTMLInputElement).value = ''
      return
    }
    imageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const triggerFileInput = () => {
  const fileInput = document.getElementById('profileImage') as HTMLInputElement
  if (fileInput) {
    fileInput.click()
  }
}

const handleSignUp = async (customImageFile: File | null) => {
  if (!signupStore.email || !signupStore.password || !signupStore.displayName) {
    alert(
      'Essential user details (email, password, display name) are missing. Please go back to the previous step.',
    )
    router.push({ name: 'question' })
    return
  }

  isLoading.value = true
  try {
    await authStore.signUpWithProfileImage(
      signupStore.email,
      signupStore.password,
      signupStore.displayName,
      customImageFile,
    )

    signupStore.clear()
    router.push({ name: 'question' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Sign up failed:', error.message)
    alert(`Sign up process failed: ${error.message || 'Unknown error'}`)
  } finally {
    isLoading.value = false
  }
}

const handleSignUpWithImage = async () => {
  await handleSignUp(imageFile.value)
}

const handleSignUpWithoutImage = async () => {
  await handleSignUp(null)
}

onMounted(() => {
  if (!signupStore.email || !signupStore.password || !signupStore.displayName) {
    router.push({ name: 'signup' })
  }
})
</script>

<template>
  <div v-if="!isLoading" class="signup-page">
    <div class="signup-container">
      <div class="profile-image-upload">
        <div class="profile-image-preview">
          <img
            :src="previewUrl || defaultProfileImage"
            alt="Profile Image"
            class="profile-pic-circle"
          />
        </div>
        <input
          type="file"
          id="profileImage"
          @change="onFileChange"
          accept="image/*"
          style="display: none"
        />
      </div>

      <div class="button">
        <button
          type="button"
          @click="triggerFileInput"
          class="add-picture-button"
          :disabled="isLoading"
        >
          Add picture
        </button>

        <button
          v-if="!imageFile"
          type="button"
          @click="handleSignUpWithoutImage"
          class="not-now-button"
          :disabled="isLoading"
        >
          Not Now
        </button>

        <button
          v-if="imageFile"
          type="submit"
          @click.prevent="handleSignUpWithImage"
          class="complete-signup-button"
          :disabled="isLoading"
        >
          Confirm Sign Up
        </button>
      </div>
    </div>
  </div>

  <div v-if="isLoading" class="loading-indicator">
    <div class="spinner"></div>
    Processing...
  </div>
</template>

<style scoped>
.signup-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
}

.signup-container {
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: clamp(500px, 80vh, 680px);
  justify-content: flex-start;
  box-sizing: border-box;
}

h2 {
  font-size: 28px;
  color: #333;
  margin: 50px 0 24px;
  font-weight: 600;
}

.profile-image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  margin-top: 100px;
}

.profile-image-preview {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.profile-pic-circle {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.profile-image-preview img[src*='placeholder'] {
  width: 60%;
  height: 60%;
  object-fit: contain;
  filter: grayscale(80%);
  opacity: 0.6;
}

div.button {
  width: 95%;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: center;
  align-items: center;
}

.add-picture-button,
.complete-signup-button,
.not-now-button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
  font-weight: bold;
}

.add-picture-button {
  background-color: #57c490;
  color: white;
}

.add-picture-button:hover:not(:disabled) {
  background-color: #48a076;
  box-shadow: 0 4px 10px rgba(52, 168, 83, 0.3);
}

.add-picture-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.complete-signup-button {
  background-color: #544baa;
  color: white;
}

.complete-signup-button:hover:not(:disabled) {
  background-color: #473f90;
  box-shadow: 0 4px 10px #6f67b7;
}

.complete-signup-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.not-now-button {
  background-color: #dcdcdc;
  color: #333;
}

.not-now-button:hover:not(:disabled) {
  background-color: #c8c8c8;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.not-now-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.7;
}

.loading-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw; /* Full viewport width */
  height: 100vh; /* Full viewport height */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px; /* Space between spinner and text */
  background-color: #f0f2f5;
  font-size: 18px;
  color: #333;
  font-weight: bold;
  z-index: 9999; /* Ensure it's on top */
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #34a853; /* Match button green */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
