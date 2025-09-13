<script setup lang="ts">
import { ref } from 'vue'
import {
  CalendarDays,
  BookOpen,
  FileText,
  Clock,
  GraduationCap,
  CheckSquare,
  Trophy,
} from 'lucide-vue-next'

const openTab = ref('studySetup')

function toggle(tab) {
  openTab.value = openTab.value === tab ? null : tab
}

// Sub-tabs config
const studySetupLinks = [
  { to: '/study-setup/term', label: 'Term', icon: GraduationCap },
  { to: '/study-setup/course', label: 'Course', icon: BookOpen },
  { to: '/study-setup/course-details', label: 'Course Details', icon: FileText },
  { to: '/study-setup/availability', label: 'Availability', icon: Clock },
]
</script>

<template>
  <aside
    class="group w-20 lg:w-60 bg-[#566BF3] text-white p-4 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
  >
    <div class="flex items-center gap-3 mb-10 shrink-0">
      <img src="/src/assets/images/logo-authenticated.png" alt="Logo" class="h-10" />
    </div>

    <nav class="flex flex-col gap-2">
      <!-- Parent tab -->
      <div>
        <button
          @click="toggle('studySetup')"
          class="flex items-center justify-between w-full px-3 py-2 text-base font-semibold hover:bg-white/10 rounded-lg"
        >
          <span>Study Setup</span>
          <svg
            :class="{ 'rotate-90': openTab === 'studySetup' }"
            class="h-5 w-5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- Sub tabs -->
        <ul v-show="openTab === 'studySetup'" class="mt-1 flex flex-col gap-1 pl-6">
          <router-link
            v-for="item in studySetupLinks"
            :key="item.to"
            :to="item.to"
            custom
            v-slot="{ href, navigate, isActive }"
          >
            <a
              :href="href"
              @click="navigate"
              :class="[
                'flex items-center gap-3 p-2 rounded-lg text-sm',
                isActive ? 'bg-[#4454C0] font-semibold' : 'hover:bg-white/10',
              ]"
              :title="item.label"
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
              <span class="hidden lg:inline">{{ item.label }}</span>
            </a>
          </router-link>
        </ul>
      </div>

      <!-- Plan -->
      <router-link to="/plan" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="navigate"
          :class="[
            'flex items-center gap-4 p-3 rounded-lg',
            isActive ? 'bg-[#4454C0] font-semibold' : 'hover:bg-white/10',
          ]"
          title="Plan"
        >
          <CalendarDays class="h-6 w-6 shrink-0" />
          <span class="hidden lg:inline">Plan</span>
        </a>
      </router-link>

      <!-- Another top-level link -->
      <router-link to="/todo" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="navigate"
          :class="[
            'flex items-center gap-4 p-3 rounded-lg',
            isActive ? 'bg-[#4454C0] font-semibold' : 'hover:bg-white/10',
          ]"
          title="Todo"
        >
          <CheckSquare class="h-6 w-6 shrink-0" />
          <span class="hidden lg:inline">To-do List</span>
        </a>
      </router-link>

      <!-- Study Group -->
      <router-link to="/group" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="navigate"
          :class="[
            'flex items-center gap-4 p-3 rounded-lg',
            isActive ? 'bg-[#4454C0] font-semibold' : 'hover:bg-white/10',
          ]"
          title="Peer Progress"
        >
          <Trophy class="h-6 w-6 shrink-0" />
          <span class="hidden lg:inline">Peer Progress</span>
        </a>
      </router-link>
    </nav>
  </aside>
</template>
