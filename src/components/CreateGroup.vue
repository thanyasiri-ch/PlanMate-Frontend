<template>
  <transition name="fade-scale">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 bg-black/20 backdrop-blur-md flex items-center justify-center px-4"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
        <h3 class="text-xl font-semibold text-gray-800 mb-5">Create New Group</h3>

        <!-- Image + Name -->
        <div class="flex items-center gap-4 mb-6">
          <!-- Image Circle -->
          <div class="relative w-24 h-24">
            <!-- Image preview or empty -->
            <img
              v-if="previewUrl"
              :src="previewUrl"
              class="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm"
              alt="Group"
            />
            <div
              v-else
              class="w-24 h-24 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-400 text-sm"
            >
              No Image
            </div>

            <!-- Camera icon button -->
            <button
              @click="triggerImageUpload"
              class="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full shadow w-7 h-7 flex items-center justify-center"
            >
              <img
                src="/src/assets/images/camera_icon.png"
                alt="Change"
                class="w-5 h-5 object-contain"
              />
            </button>

            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileChange"
            />
          </div>

          <!-- Group name -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              v-model="groupName"
              type="text"
              placeholder="e.g. Weekend Trip"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-2">
          <button
            @click="handleCancel"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            @click="createGroup"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold transition disabled:opacity-50"
            :disabled="loading"
          >
            <span v-if="loading">Creating...</span>
            <span v-else>Create</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { name: string; image: File | null }): void
}>()

const groupName = ref('')
const groupImage = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const error = ref('')
const loading = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] || null
  groupImage.value = file
  previewUrl.value = file ? URL.createObjectURL(file) : null
}

function triggerImageUpload() {
  fileInput.value?.click()
}

function createGroup() {
  if (!groupName.value.trim()) {
    error.value = 'Please enter a group name.'
    return
  }

  error.value = ''
  loading.value = true

  setTimeout(() => {
    emit('submit', {
      name: groupName.value.trim(),
      image: groupImage.value,
    })
    resetForm()
    emit('close')
  }, 1000)
}

function handleCancel() {
  resetForm()
  emit('close')
}

function resetForm() {
  groupName.value = ''
  groupImage.value = null
  previewUrl.value = null
  error.value = ''
  loading.value = false
}
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
