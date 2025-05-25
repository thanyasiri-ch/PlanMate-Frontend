<script lang="ts">
import StudyPreferenceForm from '@/components/StudyPreferenceForm.vue';

export default {
  components: {
    StudyPreferenceForm
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
          <StudyPreferenceForm />
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
  position: relative; /* Establishes a stacking context */
  z-index: 1; /* Places it below the right panel's overlapping part */
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
}
</style>
