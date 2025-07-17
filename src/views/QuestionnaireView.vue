<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts">
import StudyPreferenceForm from '@/components/StudyPreferenceForm.vue'
import StudyPrefServices from '@/services/StudyPrefServices'
import ModalConfirm from '@/components/ModalConfirm.vue'
import ModalAlert from '@/components/ModalAlert.vue'
import type { StudyPreference } from '@/types'

export default {
  components: {
    StudyPreferenceForm,
    ModalConfirm,
    ModalAlert,
  },
  data() {
    return {
      isSaving: false,
      showConfirm: false,
      showAlert: false,
      alertMessage: '',
    }
  },
  methods: {
    async handleSavePreferences() {
      const formComponent = this.$refs.studyFormComponent as any
      if (!formComponent) {
        console.error('StudyPreferenceForm component not found')
        this.alertTitle = 'System Error'
        this.alertMessage = 'Form component not found.'
        this.showAlert = true
        return
      }

      const preferences: StudyPreference | null = formComponent.getValidatedPreferences()

      if (preferences) {
        this.isSaving = true
        try {
          await StudyPrefServices.savePref(preferences)
          this.alertTitle = 'Success'
          this.alertMessage = 'Preferences saved successfully.'
          this.showAlert = true
          // Wait a moment before routing (or move this logic after user clicks OK)
          setTimeout(() => {
            this.$router.push({ name: 'profile' })
          }, 1000)
        } catch (error: any) {
          console.error('Failed to save preferences on page', error)
          if (error?.response?.data?.error === 'Study preference information cannot be empty.') {
            this.alertTitle = 'Incomplete Data'
            this.alertMessage = 'Some required fields are empty. Please complete all fields.'
          } else {
            this.alertTitle = 'Save Failed'
            this.alertMessage = 'Something went wrong. Please try again later.'
          }
          this.showAlert = true
        } finally {
          this.isSaving = false
        }
      } else {
        this.alertTitle = 'Empty fields'
        this.alertMessage = 'Study preference information cannot be empty!'
        this.showAlert = true
      }
    },

    handleCloseClick() {
      this.showConfirm = true
    },

    leavePage() {
      this.showConfirm = false
      this.$router.back() // หรือ router.back();
    },
  },
}
</script>

<template>
  <div class="page-container">
    <div class="left-panel-question">
      <div class="main-logo-container">
        <img src="/src/assets/images/logo.png" alt="PlanMate Logo" class="main-logo" />
      </div>

      <div class="rectangle-wrapper">
        <div class="rectangle-1"></div>
        <div class="rectangle-2">
          <!-- Close button -->
          <button @click="handleCloseClick" class="close-button" aria-label="Close">×</button>

          <StudyPreferenceForm ref="studyFormComponent" />
          <div class="absolute bottom-8 right-8">
            <button
              @click="handleSavePreferences"
              :disabled="isSaving"
              class="px-5 py-2 text-white font-bold rounded-full transition-colors duration-150 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-opacity-75 text-base"
              :style="{
                backgroundColor: isSaving ? '#3a8e6a' : '#57C490' /* Darker shade when saving */,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                '--tw-ring-color': '#57C490',
              }"
            >
              {{ isSaving ? 'Saving...' : 'Save Preferences' }}
            </button>
          </div>
        </div>
      </div>
      <ModalConfirm v-if="showConfirm" @confirm="leavePage" @cancel="showConfirm = false" />
      <ModalAlert
        v-if="showAlert"
        :title="alertTitle"
        :message="alertMessage"
        @close="showAlert = false"
      />
    </div>

    <div class="right-panel-question">
      <img
        src="/src/assets/images/question-image.png"
        alt="Study Illustration"
        class="illustration-image"
      />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f1efff; /* Light purple background from reference */
}

.right-panel-question {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.left-panel-question {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px 0 0 40px;
}

.rectangle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(90%, 70%, 640px); /* responsive width */
  height: clamp(50%, 80vh, 500px); /* responsive height */
}

.rectangle-1,
.rectangle-2 {
  width: 90%;
  height: 100%;
  border-radius: 20px; /* Adjusted slightly for smaller screens */
}

/* Back layer */
.rectangle-1 {
  background: #e9e9e9;
  transform: rotate(5deg);
  position: absolute;
  z-index: 0;
}

/* Front layer */
.rectangle-2 {
  background: #ffffff;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 1;
  border: 1px solid #766bde;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.25);
}

.close-button {
  position: absolute;
  top: 25px;
  right: 25px;
  width: 20px;
  height: 20px;
  background-color: #939393;
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  line-height: 1;
  padding: 0;
}

.close-button:hover {
  background-color: #676767;
  color: #ffffff;
  transform: scale(1.1);
}
</style>
