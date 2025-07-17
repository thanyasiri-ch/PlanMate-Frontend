<script lang="ts">
import StudyPreferenceForm from '@/components/StudyPreferenceForm.vue';
import StudyPrefServices from '@/services/StudyPrefServices';
import type { StudyPreference } from '@/types';

export default {
  components: {
    StudyPreferenceForm
  },
  data() {
    return {
      isSaving: false,
    }
  },
  methods: {
    async handleSavePreferences() {
      // Access the form component instance via ref
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formComponent = this.$refs.studyFormComponent as any; // Cast to any or a more specific type if you define one
      if (!formComponent) {
        console.error("StudyPreferenceForm component not found");
        return;
      }

      const preferences: StudyPreference | null = formComponent.getValidatedPreferences();

      if (preferences) {
        this.isSaving = true;
        try {
          await StudyPrefServices.savePref(preferences);
          alert('Preferences saved successfully.');
          // Optionally, redirect the user or perform other actions upon successful save
          // For example, this.$router.push('/dashboard');
          this.$router.push({ name: 'profile' })
        } catch (error) {
          console.error('Failed to save preferences on page', error);
          alert('Something went wrong saving your preferences. Please try again.');
        } finally {
          this.isSaving = false;
        }
      } else {
        // Validation failed in the form, form will show its own error messages.
        // show a general validation error message here.
        alert('Please correct the errors in the form.');
      }
    }
  }
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
    </div>

    <div class="right-panel-question">
      <img src="/src/assets/images/question-image.png" alt="Study Illustration" class="illustration-image" />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #F1EFFF; /* Light purple background from reference */
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
  padding: 40px;
}

.rectangle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(90%, 70%, 640px);  /* responsive width */
  height: clamp(50%, 80vh, 500px); /* responsive height */
}

.rectangle-1,
.rectangle-2 {
  width: 100%;
  height: 100%;
  border-radius: 20px; /* Adjusted slightly for smaller screens */
}

/* Back layer */
.rectangle-1 {
  background: #E9E9E9;
  transform: rotate(5deg);
  position: absolute;
  z-index: 0;
}

/* Front layer */
.rectangle-2 {
  background: #FFFFFF;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 1;
  border: 1px solid #766BDE;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.25);
}
</style>
