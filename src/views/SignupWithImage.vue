<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSignupStore } from '@/stores/signupStore';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const signupStore = useSignupStore();
const authStore = useAuthStore();

const imageFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const MAX_FILE_SIZE_MB = 2;
const isLoading = ref(false);

const defaultProfileImage = '/src/assets/images/default_image.webp';

const onFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    const file = files[0];
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File is too large. Max allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      imageFile.value = null;
      previewUrl.value = null;
      (e.target as HTMLInputElement).value = '';
      return;
    }
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  } else {
    imageFile.value = null;
    previewUrl.value = null;
  }
};

const triggerFileInput = () => {
  const fileInput = document.getElementById('profileImage') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
};

const handleSignUp = async (customImageFile: File | null) => {
  if (!signupStore.email || !signupStore.password || !signupStore.displayName) {
    alert('Essential user details (email, password, display name) are missing. Please go back to the previous step.');
    router.push({ name: 'signup' });
    return;
  }

  isLoading.value = true;
  try {
    await authStore.signUpWithProfileImage(
      signupStore.email,
      signupStore.password,
      signupStore.displayName,
      customImageFile
    );

    signupStore.clear();
    router.push({ name: 'home' });
  } catch (error: any) {
    console.error('Sign up failed:', error.message);
    alert(`Sign up process failed: ${error.message || 'Unknown error'}`);
  } finally {
    isLoading.value = false;
  }
};

const handleSignUpWithImage = async () => {
  await handleSignUp(imageFile.value);
};

const handleSignUpWithoutImage = async () => {
  await handleSignUp(null);
};

onMounted(() => {
  if (!signupStore.email || !signupStore.password || !signupStore.displayName) {
    router.push({ name: 'signup' });
  }
});
</script>


<template>
  <div class="signup-page">
    <div class="signup-container">
      <div class="logo-container">
        <img src="/src/assets/images/logo.png" alt="PlanMate Logo" class="logo" />
      </div>

      <h2>Add your profile picture</h2>
      <p class="subtitle">You can always change it later in your settings.</p>

      <div class="profile-image-upload">
        <div class="profile-image-preview">
          <img :src="previewUrl || defaultProfileImage" alt="Profile Image" class="profile-pic-circle" />
        </div>
        <input type="file" id="profileImage" @change="onFileChange" accept="image/*" style="display: none;" />
        <button type="button" @click="triggerFileInput" class="add-picture-button" :disabled="isLoading">
          Add picture
        </button>
      </div>

      <!-- Show this button if no image is selected -->
      <button
        v-if="!imageFile"
        type="button"
        @click="handleSignUpWithoutImage"
        class="not-now-button"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Signing Up...' : 'Not Now' }}
      </button>

      <!-- Show this button if image is selected -->
      <button
        v-if="imageFile"
        type="submit"
        @click.prevent="handleSignUpWithImage"
        class="complete-signup-button"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Signing Up...' : 'Complete Sign Up' }}
      </button>

      <div v-if="isLoading" class="loading-indicator">
        Processing...
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add some basic styling */
form div {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input[type="file"] {
  display: block;
}
button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #cccccc;
}
.loading-indicator {
  margin-top: 15px;
  font-style: italic;
}
</style>
