<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { useGroupStore } from '@/stores/useGroupStore'
import CreateGroup from '/src/components/CreateGroup.vue'

const joinCode = ref('')
const groupStore = useGroupStore()

onMounted(() => {
  groupStore.fetchGroup()
})

const handleJoinGroup = async () => {
  // Validate join code format (6-digit numeric)
  const codePattern = /^[A-Za-z0-9]{6}$/
  if (!codePattern.test(joinCode.value)) {
    groupStore.error = 'Invalid join code. Please enter 6-digit numeric code.'
    return
  }

  await groupStore.joinGroup(joinCode.value)
}

const groupInfo = computed(() => {
  const g = groupStore.group
  return g
    ? {
        name: g.name,
        image: g.imageUrl,
        members: g.members.length,
      }
    : null
})

const isCreateModalOpen = ref(false)

const handleGroupSubmit = (payload: { name: string; image: File | null }) => {
  console.log('Creating group...', payload)
  // TODO: เชื่อมกับ groupStore.createGroup() หรือ API อื่น ๆ
}
</script>
<template>
  <DefaultLayout>
    <div class="h-full overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full px-6 py-4 box-border">
        <!-- Left Box (1/3) -->
        <section class="flex flex-col h-full gap-4">
          <!-- Top Box: Join Group -->
          <div class="bg-white rounded-2xl p-6 border border-[#DCD7FF] shadow-sm">
            <div
              class="flex items-center bg-white border border-[#DCD7FF] shadow-sm rounded-2xl px-4 py-3"
            >
              <input
                v-model="joinCode"
                type="text"
                placeholder="Enter group code..."
                maxlength="6"
                class="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400 rounded-full"
              />

              <button
                @click="handleJoinGroup"
                :disabled="groupStore.isLoading"
                class="ml-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold px-4 py-2 rounded-full transition duration-200"
              >
                {{ groupStore.isLoading ? 'Joining...' : 'Join' }}
              </button>
            </div>
            <!-- Success/Error Messages -->
            <p v-if="groupStore.error" class="text-red-500 mt-2">{{ groupStore.error }}</p>
            <p v-if="groupStore.success" class="text-green-600 mt-2">{{ groupStore.success }}</p>
          </div>

          <!-- Bottom Box: My Groups -->
          <div
            class="flex-1 bg-white rounded-2xl p-6 border border-[#DCD7FF] shadow-sm overflow-auto flex flex-col"
          >
            <!-- Header with create button -->
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-800">My Groups</h2>
              <button
                @click="isCreateModalOpen = true"
                class="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold px-4 py-2 rounded-full transition duration-200"
              >
                + Create Group
              </button>
            </div>

            <!-- Group Info Section -->
            <div v-if="groupInfo" class="mt-5 flex items-center border-b border-gray-300 pb-2">
              <!-- Group Image -->
              <img
                :src="groupInfo.image"
                alt="Group Avatar"
                class="w-10 h-10 rounded-full mr-4 object-cover border-2 border-indigo-300"
              />

              <!-- Group Info -->
              <div class="flex-1">
                <p class="text-gray-800 font-medium text-base">{{ groupInfo.name }}</p>
                <p class="text-gray-500 text-sm">{{ groupInfo.members }} members</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Right Box (2/3) -->
        <section class="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col h-full overflow-auto">
          <!-- Podium Section -->
          <div class="flex flex-col items-center h-full">
            <!-- Header -->
            <div class="flex justify-between w-full items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Leaderboard</h2>
            </div>

            <!-- Podium -->
            <div class="flex items-end justify-center w-full gap-15 mb-8 relative">
              <!-- Second Place -->
              <div
                class="flex flex-col items-center z-10 transition-transform duration-300 hover:scale-105"
              >
                <img
                  src="https://i.pravatar.cc/60?img=2"
                  class="w-16 h-16 rounded-full border-2 border-white mb-2"
                />
                <div class="text-sm font-semibold text-gray-800">Alena Donin</div>
                <div class="w-24">
                  <div class="w-full bg-[#cbf3f0] rounded-full h-3 mt-1 mb-3 shadow-inner">
                    <div
                      class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all duration-300 ease-in-out"
                      style="width: 80%"
                    ></div>
                  </div>
                </div>
                <div
                  class="bg-white rounded-t-xl w-24 h-36 shadow-[inset_0_-4px_0_#D6BBFB] shadow-md flex flex-col justify-between items-center text-white font-bold text-xl bg-gradient-to-b from-purple-400 to-purple-500"
                >
                  <div class="flex-1 flex items-center justify-center text-3xl font-extrabold">
                    2
                  </div>
                  <div class="w-full text-center text-sm font-medium text-white pb-2">980 pts</div>
                </div>
              </div>

              <!-- First Place -->
              <div
                class="flex flex-col items-center z-20 transition-transform duration-300 hover:scale-110"
              >
                <img
                  src="https://i.pravatar.cc/60?img=1"
                  class="w-20 h-20 rounded-full border-4 border-yellow-400 mb-2 shadow-lg ring-4 ring-yellow-300"
                />
                <img
                  src="/src/assets/images/Crown.png"
                  alt="Crown"
                  class="absolute w-12 h-6 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style="top: -13px"
                />
                <div class="text-sm font-semibold text-gray-800">Davis Curtis</div>
                <div class="w-28">
                  <div class="w-full bg-[#cbf3f0] rounded-full h-3 mt-1 mb-3 shadow-inner">
                    <div
                      class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all duration-300 ease-in-out"
                      style="width: 80%"
                    ></div>
                  </div>
                </div>
                <div
                  class="bg-white rounded-t-xl w-28 h-44 shadow-[inset_0_-4px_0_#FDE68A] shadow-lg flex flex-col justify-between items-center text-white font-bold text-xl bg-gradient-to-b from-yellow-300 to-yellow-500"
                >
                  <div class="flex-1 flex items-center justify-center text-4xl font-extrabold">
                    1
                  </div>
                  <div class="w-full text-center text-sm font-medium text-white pb-2">
                    1,200 pts
                  </div>
                </div>
              </div>

              <!-- Third Place -->
              <div
                class="flex flex-col items-center z-10 transition-transform duration-300 hover:scale-105"
              >
                <img
                  src="https://i.pravatar.cc/60?img=3"
                  class="w-16 h-16 rounded-full border-2 border-white mb-2"
                />
                <div class="text-sm font-semibold text-gray-800">Craig Gouse</div>
                <div class="w-24">
                  <div class="w-full bg-[#cbf3f0] rounded-full h-3 mt-1 mb-3 shadow-inner">
                    <div
                      class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all duration-300 ease-in-out"
                      style="width: 80%"
                    ></div>
                  </div>
                </div>
                <div
                  class="bg-white rounded-t-xl w-24 h-28 shadow-[inset_0_-4px_0_#C4B5FD] shadow-md flex flex-col justify-between items-center text-white font-bold text-xl bg-gradient-to-b from-purple-300 to-purple-600"
                >
                  <div class="flex-1 flex items-center justify-center text-3xl font-extrabold">
                    3
                  </div>
                  <div class="w-full text-center text-sm font-medium text-white pb-2">880 pts</div>
                </div>
              </div>
            </div>

            <!-- Others (4th, 5th, etc.) -->
            <div class="w-full space-y-2">
              <div
                class="flex items-center gap-6 px-4 py-2 rounded-lg bg-gray-100 transition-all duration-300 hover:scale-[1.01] hover:shadow"
              >
                <!-- Rank -->
                <div class="text-gray-500 font-bold text-lg w-4 text-right">4</div>

                <!-- Avatar + Info -->
                <div class="flex items-center gap-3 flex-1">
                  <img src="https://i.pravatar.cc/40?img=4" class="w-8 h-8 rounded-full" />
                  <div>
                    <div class="text-sm font-medium text-gray-800">Madelyn Dias</div>
                  </div>
                </div>

                <!-- Energy Bar + Points -->
                <div class="flex items-center gap-3 w-48">
                  <div
                    class="w-full bg-[#cbf3f0] rounded-full h-3 shadow-inner transition-all duration-300"
                  >
                    <div
                      class="h-3 rounded-full bg-[#2ec4b6] shadow-md brightness-110 transition-all duration-300"
                      style="width: 75%"
                    ></div>
                  </div>
                  <span class="text-sm font-semibold text-gray-600 flex-shrink-0">590 pts</span>
                </div>
              </div>

              <div
                class="flex items-center gap-6 px-4 py-2 rounded-lg bg-gray-100 transition-all duration-300 hover:scale-[1.01] hover:shadow"
              >
                <div class="text-gray-500 font-bold text-lg w-4 text-right">5</div>

                <div class="flex items-center gap-3 flex-1">
                  <img src="https://i.pravatar.cc/40?img=5" class="w-8 h-8 rounded-full" />
                  <div>
                    <div class="text-sm font-medium text-gray-800">Madelyn Dias</div>
                  </div>
                </div>

                <div class="flex items-center gap-3 w-48">
                  <div
                    class="w-full bg-[#cbf3f0] rounded-full h-3 shadow-inner transition-all duration-300"
                  >
                    <div
                      class="h-3 rounded-full bg-[#2ec4b6] shadow-md brightness-110 transition-all duration-300"
                      style="width: 75%"
                    ></div>
                  </div>
                  <span class="text-sm font-semibold text-gray-600 flex-shrink-0">590 pts</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </DefaultLayout>
  <CreateGroup
    :visible="isCreateModalOpen"
    @close="isCreateModalOpen = false"
    @submit="handleGroupSubmit"
  />
</template>
