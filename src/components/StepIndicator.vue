<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ activeStep: string }>()

const steps = ['term', 'course', 'topic', 'availability', 'generate']

const currentStepIndex = computed(() => steps.indexOf(props.activeStep))
</script>

<template>
  <div class="w-full max-w-3xl px-4 sm:px-0">
    <ol class="flex items-center w-full">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="relative flex w-full items-center"
        :class="{
          'after:content-[\'\'] after:w-full after:h-1 after:border-b-6 after:inline-block': index < steps.length - 1,
          'after:absolute after:left-0 after:top-5 lg:after:top-6': index < steps.length - 1,
          'after:border-[#766BDE]': index < currentStepIndex,
          'after:border-[#F1EFFF]': index >= currentStepIndex
        }"
      >
        <div class="relative z-10 shrink-0">
          <span
            class="flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12"
            :class="{
              'bg-[#766BDE]': index <= currentStepIndex,
              'bg-[#F1EFFF] border-[#D9D4F6]': index > currentStepIndex
            }"
          >
            <span
              class="text-lg font-bold"
              :class="{
                'text-white': index <= currentStepIndex,
                'text-[#766BDE]': index > currentStepIndex
              }"
            >
              {{ index + 1 }}
            </span>
          </span>

          <span
            class="absolute top-full left-1/2 mt-2 -translate-x-1/2 w-24 text-center text-sm"
            :class="{
              'font-extrabold text-[#766BDE]': index === currentStepIndex,
              'font-semibold text-[#766BDE]': index !== currentStepIndex
            }"
          >
            {{ step.charAt(0).toUpperCase() + step.slice(1) }}
          </span>
        </div>
      </li>
    </ol>
  </div>
</template>
