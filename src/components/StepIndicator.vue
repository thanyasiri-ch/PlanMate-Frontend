<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ activeStepIndex: number }>()

const steps = ['term', 'course', 'topic', 'availability', 'generate Plan']

const currentStepIndex = computed(() => props.activeStepIndex)
</script>

<template>
  <div class="w-1/2 max-w-3xl px-10 sm:px-0">
    <ol class="flex items-center w-full">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="relative flex items-center"
        :class="{
          // Apply `grow` ONLY to the items that are NOT the last one.
          'grow': index < steps.length - 1,

          'after:content-[\'\'] after:w-full after:h-1 after:border-b-4 after:inline-block': index < steps.length - 1,
          'after:absolute after:left-0 after:top-4 lg:after:top-5': index < steps.length - 1,
          'after:border-[#766BDE]': index < currentStepIndex,
          'after:border-[#F1EFFF]': index >= currentStepIndex
        }"
      >
        <div class="relative z-10 shrink-0">
          <span
            class="flex items-center justify-center w-8 h-8 rounded-full lg:h-10 lg:w-10"
            :class="{
              'bg-[#766BDE]': index <= currentStepIndex,
              'bg-[#F1EFFF] border-2 border-[#D9D4F6]': index > currentStepIndex
            }"
          >
            <span
              class="text-md font-bold"
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
