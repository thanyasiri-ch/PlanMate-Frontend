<script lang="ts">
import '@/assets/tailwind.css'
import type { PreferredStudyTime, RevisionFrequency, BreakDuration, StudyPreference } from '@/types'
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
    layout: {
      type: String as () => 'horizontal' | 'vertical',
      default: 'horizontal',
    },
  },
  emits: ['save', 'cancel'], // Declare emitted events
  data() {
    return {
      sessionRange: [45, 90] as [number, number],

      // Use objects to map display text to enum values
      preferredStudyTimeOptions: [
        { value: 'early morning', display: 'Early Morning' },
        { value: 'late morning', display: 'Late Morning' },
        { value: 'afternoon', display: 'Afternoon' },
        { value: 'evening', display: 'Evening' },
        { value: 'night', display: 'Night' },
        { value: 'late night', display: 'Late Night' },
      ],
      selectedPreferredStudyTimes: [] as PreferredStudyTime[],

      revisionFrequencyOptions: [
        { value: 'single deep review before exam', display: 'Single Deep Review Before Exam' },
        { value: '2-3 reviews per topic', display: '2-3 Reviews Per Topic' },
        { value: 'daily review sessions', display: 'Daily Review Sessions' },
      ],
      selectedRevisionFrequency: '' as RevisionFrequency,

      breakDurationOptions: [
        { value: 5, display: '5 minutes' },
        { value: 10, display: '10 minutes' },
        { value: 15, display: '15 minutes' },
        { value: 20, display: '20 minutes' },
        { value: 25, display: '25 minutes' },
        { value: 30, display: '30 minutes' },
      ],
      selectedBreakDuration: 0 as BreakDuration,

      showErrors: false,
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
  watch: {
    // Whenever the existingPref prop changes, this code will run
    existingPref: {
      handler(newPref) {
        this.syncStateFromProp(newPref)
      },
      immediate: true, // This runs the handler immediately on component mount
    },
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
    getValidatedPreferences(): StudyPreference | null {
      this.showErrors = !this.isFormValid
      if (this.showErrors) {
        return null // Return null if form is invalid
      }
      const studyPreferences: StudyPreference = {
        preferredStudyTimes: [...this.selectedPreferredStudyTimes],
        minSessionDuration: this.sessionRange[0],
        maxSessionDuration: this.sessionRange[1],
        revisionFrequency: this.selectedRevisionFrequency,
        breakDurations: this.selectedBreakDuration,
      }
      return studyPreferences
    },
    syncStateFromProp(pref: StudyPreference | null) {
      if (pref) {
        this.selectedPreferredStudyTimes = [...pref.preferredStudyTimes]
        this.selectedRevisionFrequency = pref.revisionFrequency
        this.selectedBreakDuration = pref.breakDurations
        this.sessionRange = [pref.minSessionDuration, pref.maxSessionDuration]
      }
    },
  },
}
</script>

<template>
  <div
    :class="[
      'w-full h-full flex flex-col overflow-y-auto p-10 text-small',
      layout === 'horizontal' ? 'items-center' : '',
    ]"
  >
    <div :class="['flex-grow space-y-6 px-5', layout === 'horizontal' ? 'w-full max-w-2xl' : '']">
      <div>
        <label class="block mb-1 font-semibold text-gray-800"
          >What time of day do you prefer to study?</label
        >
        <div class="flex flex-wrap gap-3">
          <button
            v-for="option in preferredStudyTimeOptions"
            :key="option.value"
            @click="togglePreferredStudyTime(option.value as PreferredStudyTime)"
            :class="[
              'px-3 py-1 rounded-full border transition-colors duration-150 ease-in-out text-sm' /* Added text-sm for consistency if text-small is on parent */,
              selectedPreferredStudyTimes.includes(option.value as PreferredStudyTime)
                ? 'bg-[#766BDE] text-white border-[#766BDE]'
                : 'bg-white text-[#766BDE] border-[#766BDE] hover:bg-gray-100',
            ]"
          >
            {{ option.display }}
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
            v-for="option in revisionFrequencyOptions"
            :key="option.value"
            @click="selectRevisionFrequency(option.value as RevisionFrequency)"
            :class="[
              'px-3 py-1 rounded-full border transition-colors duration-150 ease-in-out text-sm',
              selectedRevisionFrequency === option.value
                ? 'bg-[#766BDE] text-white border-[#766BDE]'
                : 'bg-white text-[#766BDE] border-[#766BDE] hover:bg-gray-100',
            ]"
          >
            {{ option.display }}
          </button>
        </div>
      </div>

      <div>
        <label class="block mb-1 font-semibold text-gray-800">
          How long would you like your break to be after each study session?
        </label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="option in breakDurationOptions"
            :key="option.value"
            @click="selectBreakDuration(option.value as BreakDuration)"
            :class="[
              'px-3 py-1 rounded-full border transition-colors duration-150 ease-in-out text-sm',
              selectedBreakDuration === option.value
                ? 'bg-[#766BDE] text-white border-[#766BDE]'
                : 'bg-white text-[#766BDE] border-[#766BDE] hover:bg-gray-100',
            ]"
          >
            {{ option.display }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
