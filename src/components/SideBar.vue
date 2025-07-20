<template>
  <aside
    class="group w-20 lg:w-60 bg-[#566BF3] text-white p-4 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
  >
    <div class="flex items-center gap-3 mb-10 shrink-0">
      <img src="/src/assets/images/logo-authenticated.png" alt="Logo" class="h-10" />
    </div>

    <nav class="flex flex-col gap-2">
      <div class="px-3 py-2 text-base font-semibold text-gray-300 hidden lg:block">
        Study Setup
      </div>

      <ul class="flex flex-col gap-1">
        <router-link to="/study-setup/term" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'flex items-center gap-4 p-3 rounded-lg',
              isActive
                ? 'bg-[#4454C0] font-semibold'
                : 'hover:bg-white/10',
            ]"
            title="Term"
          >
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span class="hidden lg:inline">Term</span>
          </a>
        </router-link>

        <router-link to="/study-setup/course" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'flex items-center gap-4 p-3 rounded-lg',
              isActive
                ? 'bg-[#4454C0] font-semibold'
                : 'hover:bg-white/10',
            ]"
            title="Course"
          >
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v11.494m-9-5.747h18" /></svg>
            <span class="hidden lg:inline">Course</span>
          </a>
        </router-link>

        <router-link to="/study-setup/course-details" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'flex items-center gap-4 p-3 rounded-lg',
              isActive
                ? 'bg-[#4454C0] font-semibold'
                : 'hover:bg-white/10',
            ]"
            title="Topic"
          >
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.373 3.373 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            <span class="hidden lg:inline">Course Details</span>
          </a>
        </router-link>

        <router-link to="/study-setup/availability" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'flex items-center gap-4 p-3 rounded-lg',
              isActive
                ? 'bg-[#4454C0] font-semibold'
                : 'hover:bg-white/10',
            ]"
            title="Availability"
          >
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span class="hidden lg:inline">Availability</span>
          </a>
        </router-link>

        <router-link to="/study-setup/generate-plan" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'flex items-center gap-4 p-3 rounded-lg',
              isActive
                ? 'bg-[#4454C0] font-semibold'
                : 'hover:bg-white/10',
            ]"
            title="Generate Plan"
          >
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span class="hidden lg:inline">Generate Plan</span>
          </a>
        </router-link>

      </ul>

      <hr class="my-4 border-t border-white/20 hidden lg:block" />

      <router-link to="/plan" custom v-slot="{ href, navigate, isActive }">
        <a
            :href="href"
            @click="navigate"
            :class="[
              'flex items-center gap-4 p-3 rounded-lg',
              isActive
                ? 'bg-[#4454C0] font-semibold'
                : 'hover:bg-white/10',
            ]"
            title="Plan"
          >
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span class="hidden lg:inline">Plan</span>
          </a>
      </router-link>
    </nav>

    <div class="mt-auto shrink-0">
       </div>
  </aside>
</template>
