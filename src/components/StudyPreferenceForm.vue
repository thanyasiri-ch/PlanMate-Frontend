<script lang="ts">
import '@/assets/tailwind.css'
import type { PreferredStudyTime, RevisionFrequency, BreakDuration, StudyPreference } from '@/types'
import StudyPrefService from '@/services/StudyPrefServices'
import '@vueform/slider/themes/default.css'
import Slider from '@vueform/slider'

export default {
  components: {
    Slider,
  },
  props: {
    existingPref: {
      type: Object as () => StudyPreference | null,
      default: null,
    },
  },
  data() {
    return {
      sessionRange: [30, 90],
      preferredStudyTimeOptions: [
        'early morning',
        'late morning',
        'afternoon',
        'evening',
        'night',
        'late night',
      ] as PreferredStudyTime[],
      selectedPreferredStudyTimes: [] as PreferredStudyTime[],

      minSessionDuration: 30,
      maxSessionDuration: 90,

      revisionFrequencyOptions: [
        'single deep review before exam',
        '2-3 reviews per topic',
        'daily review sessions',
      ] as RevisionFrequency[],
      selectedRevisionFrequency: '' as RevisionFrequency,

      breakDurationOptions: [5, 10, 15, 20, 25, 30] as BreakDuration[],
      selectedBreakDuration: 0 as BreakDuration,

      isSaving: false,
      showErrors: false,

      sliderMarkValues: [30, 60, 90, 120, 150, 180] as number[],
    }
  },
  computed: {
    isEditMode(): boolean {
      return !!this.existingPref
    },
    isFormValid(): boolean {
      return (
        this.selectedPreferredStudyTimes.length > 0 &&
        this.selectedRevisionFrequency !== null &&
        this.selectedBreakDuration !== null
      )
    },
  },
  mounted() {
    if (this.existingPref) {
      this.selectedPreferredStudyTimes = this.existingPref.preferredStudyTimes
      this.minSessionDuration = this.existingPref.minSessionDuration
      this.maxSessionDuration = this.existingPref.maxSessionDuration
      this.selectedRevisionFrequency = this.existingPref.revisionFrequency
      this.selectedBreakDuration = this.existingPref.breakDurations
    }
  },
  methods: {
    togglePreferredStudyTime(time: PreferredStudyTime) {
      const index = this.selectedPreferredStudyTimes.indexOf(time)
      if (index !== -1) {
        this.selectedPreferredStudyTimes.splice(index, 1)
      } else {
        this.selectedPreferredStudyTimes.push(time)
      }
    },
    selectRevisionFrequency(frequency: RevisionFrequency) {
      this.selectedRevisionFrequency = frequency
    },
    selectBreakDuration(duration: BreakDuration) {
      this.selectedBreakDuration = duration
    },
    async submitPreferences() {
      this.showErrors = !this.isFormValid
      if (this.showErrors) return

      const studyPreferences: StudyPreference = {
        preferredStudyTimes: this.selectedPreferredStudyTimes,
        minSessionDuration: this.sessionRange[0],
        maxSessionDuration: this.sessionRange[1],
        revisionFrequency: this.selectedRevisionFrequency,
        breakDurations: this.selectedBreakDuration,
      }

      this.isSaving = true
      try {
        if (this.isEditMode) {
          await StudyPrefService.updatePref(studyPreferences)
        } else {
          await StudyPrefService.savePref(studyPreferences)
        }
        alert('Preferences saved successfully.')
      } catch (error) {
        console.error('Failed to save preferences', error)
        alert('Something went wrong saving your preferences.')
      } finally {
        this.isSaving = false
      }
    },
  },
}
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-y-auto p-10 text-small">
    <div class="flex-grow space-y-6">
      <div>
        <label class="block mb-1 font-semibold text-gray-800"
          >What time of day do you prefer to study?</label
        >
        <div class="flex flex-wrap gap-3">
          <button
            v-for="time in preferredStudyTimeOptions"
            :key="time"
            @click="togglePreferredStudyTime(time)"
            :class="[
              'px-3 py-1 rounded-full border transition-colors duration-150 ease-in-out text-sm' /* Added text-sm for consistency if text-small is on parent */,
              selectedPreferredStudyTimes.includes(time)
                ? 'bg-violet-500 text-white border-violet-500'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100',
            ]"
          >
            {{ time }}
          </button>
        </div>
      </div>

      <div>
        <label class="block mb-1 font-semibold text-gray-800">
          What's a good range for your study session length (min - max minutes)?
        </label>
        <div class="relative mt-12">
          <Slider
            v-model="sessionRange"
            :min="30"
            :max="180"
            :step="5"
            :height="6"
            :tooltip="'always'"
            :lazy="true"
            :range="true"
            :marks="sliderMarkValues"
          />
        </div>
        <div class="flex justify-between text-sm text-gray-500 mt-1">
          <span>30</span>
          <span>180</span>
        </div>
      </div>
      <div>
        <label class="block mb-1 font-semibold text-gray-800"
          >How often do you like to review your study material?</label
        >
        <div class="flex flex-wrap gap-3">
          <button
            v-for="frequency in revisionFrequencyOptions"
            :key="frequency"
            @click="selectRevisionFrequency(frequency)"
            :class="[
              'px-3 py-1 rounded-full border transition-colors duration-150 ease-in-out text-sm',
              selectedRevisionFrequency === frequency
                ? 'bg-violet-500 text-white border-violet-500'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100',
            ]"
          >
            {{ frequency }}
          </button>
        </div>
      </div>

      <div>
        <label class="block mb-1 font-semibold text-gray-800">
          How long would you like your break to be after each study session?
        </label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="duration in breakDurationOptions"
            :key="duration"
            @click="selectBreakDuration(duration)"
            :class="[
              'px-3 py-1 rounded-full border transition-colors duration-150 ease-in-out text-sm',
              selectedBreakDuration === duration
                ? 'bg-violet-500 text-white border-violet-500'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100',
            ]"
          >
            {{ duration }} minutes
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 flex justify-end">
      <button
        @click="submitPreferences"
        :disabled="isSaving"
        class="px-7 py-2 text-white font-bold rounded-4xl transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-75"
        :style="{
          backgroundColor: '#57C490',
          '--tw-ring-color': '#57C490',
        }"
      >
        {{ isEditMode ? 'Update Preferences' : 'Save Preferences' }}
      </button>
    </div>
  </div>
</template>