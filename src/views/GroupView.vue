<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { useGroupStore } from '@/stores/useGroupStore'
import CreateGroup from '@/components/CreateGroup.vue'
import { uploadImageToFirebase } from '@/firebase/uploadImageToFirebase'
import DefaultGroupImage from '@/assets/images/group.png'

const joinCode = ref('')
const isCreateModalOpen = ref(false)
const copiedJoinCode = ref<string | null>(null)
const selectedGroupId = ref<number | null>(null)

const groupStore = useGroupStore()
const groups = computed(() => groupStore.groups)

onMounted(async () => {
  await groupStore.fetchGroup()
  if (groupStore.groups.length > 0) {
    selectedGroupId.value = groupStore.groups[0].id
    await groupStore.fetchGroupProgress(selectedGroupId.value)
  }
})

const selectGroup = async (groupId: number) => {
  if (selectedGroupId.value === groupId) return
  selectedGroupId.value = groupId
  await groupStore.fetchGroupProgress(groupId)
}

const leaderboardData = computed(() => {
  return groupStore.groupProgress.map((p) => ({
    uid: p.member.memberId,
    name: p.member.displayName,
    avatarUrl: p.member.photoUrl,
    points: p.points,
    progress: p.percentageCompleted,
  }))
})

// Function to handle copying to clipboard
const copyToClipboard = async (group: { id: number; joinCode: string }) => {
  if (!group.joinCode || !navigator.clipboard) return

  try {
    await navigator.clipboard.writeText(group.joinCode)
    copiedJoinCode.value = group.joinCode

    setTimeout(() => {
      if (copiedJoinCode.value === group.joinCode) {
        copiedJoinCode.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code: ', err)
  }
}

const handleJoinGroup = async () => {
  // Validate join code format (e.g., 6-character alphanumeric)
  const codePattern = /^[A-Za-z0-9]{6}$/;
  if (!codePattern.test(joinCode.value)) {
    groupStore.joinError = 'Invalid join code. Please enter a 6-character code.';

    // Clear error after 3 seconds
    setTimeout(() => {
      groupStore.joinError = '';
    }, 3000);

    return;
  }

  await groupStore.joinGroup(joinCode.value);

  if (groupStore.joinError) {
    // Clear success message after 3 seconds
    setTimeout(() => {
      groupStore.joinError = '';
    }, 5000);
  }

  if (groupStore.joinSuccess) {
    // Clear success message after 3 seconds
    setTimeout(() => {
      groupStore.joinSuccess = '';
    }, 5000);
  }
}

const handleGroupSubmit = async (payload: { name: string; image: File | null }) => {
  try {
    let imageUrl = ''
    if (payload.image) {
      imageUrl = await uploadImageToFirebase(payload.image)
    } else {
      imageUrl = DefaultGroupImage
    }
    await groupStore.createGroup({
      groupName: payload.name,
      imageUrl,
    })

    isCreateModalOpen.value = false
  } catch (e) {
    console.error('Group creation failed:', e)
  }
}
</script>

<template>
  <DefaultLayout>
    <div class="h-full overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full px-6 py-4 box-border">
        <section class="flex flex-col h-full gap-4 overflow-y-auto">
          <div class="bg-white rounded-2xl p-6 border border-[#DCD7FF] shadow-sm">
            <div
              class="flex items-center bg-white border border-[#DCD7FF] shadow-sm rounded-2xl px-4 py-3"
            >
              <input
                v-model="joinCode"
                type="text"
                placeholder="Enter group code..."
                maxlength="6"
                class="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400 rounded-full px-1"
              />

              <button
                @click="handleJoinGroup"
                :disabled="groupStore.isJoiningGroup"
                class="ml-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold px-4 py-2 rounded-full transition duration-200"
              >
                {{ groupStore.isJoiningGroup ? 'Joining...' : 'Join' }}
              </button>
            </div>
            <p v-if="groupStore.joinError" class="text-red-500 mt-2">{{ groupStore.joinError }}</p>
            <p v-if="groupStore.joinSuccess" class="text-green-600 mt-2">
              {{ groupStore.joinSuccess }}
            </p>
          </div>

          <div
            class="flex-1 bg-white rounded-2xl p-6 border border-[#DCD7FF] shadow-sm overflow-auto flex flex-col"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-800">My Groups</h2>
              <button
                @click="isCreateModalOpen = true"
                class="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold px-4 py-2 rounded-full transition duration-200"
              >
                + Create Group
              </button>
            </div>

            <div class="flex-1 overflow-y-auto pr-1">
              <div
                v-if="groupStore.isFetchingGroups"
                class="text-center text-gray-500 text-sm py-4"
              >
                Loading groups...
              </div>

              <div v-else-if="groups.length > 0" class="space-y-2">
                <div
                  v-for="group in groups"
                  :key="group.id"
                  class="flex items-center justify-between border-b border-gray-300 pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{ 'bg-indigo-50 rounded-lg': selectedGroupId === group.id }"
                  @click="selectGroup(group.id)"
                >
                  <div class="flex items-center">
                    <img
                      :src="group.imageUrl || 'https://via.placeholder.com/40'"
                      alt="Group Avatar"
                      class="w-10 h-10 rounded-full mr-4 object-cover border-2 border-indigo-300"
                    />
                    <div>
                      <p class="text-gray-800 font-medium text-base">{{ group.name }}</p>
                      <p class="text-gray-500 text-sm mt-1">
                        {{ group.members?.length || 0 }} members
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md"
                      >{{ group.joinCode }}</span
                    >
                    <button
                      @click="copyToClipboard(group)"
                      class="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title="Copy join code"
                    >
                      <svg
                        v-if="copiedJoinCode === group.joinCode"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="text-gray-500 text-sm text-center py-4">
                You haven't joined any groups yet.
              </div>
            </div>
          </div>
        </section>

        <section class="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col h-full overflow-auto">
          <div class="flex flex-col items-center h-full">
            <div class="flex justify-between w-full items-center mb-10">
              <h2 class="text-xl font-semibold text-gray-800">Leaderboard</h2>
              <span
                v-if="groups.find((g) => g.id === selectedGroupId)"
                class="text-gray-500 text-sm"
              >
                {{ groups.find((g) => g.id === selectedGroupId)?.name }}
              </span>
            </div>
            <div
              v-if="selectedGroupId && groupStore.isFetchingProgress"
              class="flex items-center justify-center gap-2 text-gray-600 py-6 text-base font-medium"
            >
              <!-- Spinner -->
              <svg
                class="w-5 h-5 animate-spin text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>

              <!-- Animated text -->
              <span class="animate-pulse">Loading leaderboard...</span>
            </div>

            <!-- If finished loading but no data -->
            <div
              v-else-if="
                selectedGroupId &&
                !groupStore.isFetchingProgress &&
                groupStore.groupProgress.length === 0
              "
              class="text-center text-gray-500 py-4"
            >
              No leaderboard data yet.
            </div>
            <div v-else-if="leaderboardData.length > 0" class="w-full flex-1 flex flex-col">
              <div class="flex items-end justify-center w-full gap-16 mb-8 relative">
                <div class="w-24">
                  <div
                    v-if="leaderboardData[1]"
                    class="flex flex-col items-center z-10 transition-all duration-300 hover:scale-105 hover:-translate-y-2 relative"
                  >
                    <img
                      :src="leaderboardData[1].avatarUrl || 'https://via.placeholder.com/60'"
                      class="w-16 h-16 rounded-full border-2 border-white mb-2 shadow-lg"
                    />
                    <div class="text-sm font-semibold text-gray-800">
                      {{ leaderboardData[1].name }}
                    </div>
                    <div class="w-24">
                      <div class="w-full bg-[#cbf3f0] rounded-full h-3 mt-1 mb-3 shadow-inner">
                        <div
                          class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all duration-300 ease-in-out"
                          :style="{ width: leaderboardData[1].progress + '%' }"
                        ></div>
                      </div>
                    </div>
                    <div
                      class="bg-white rounded-t-xl w-24 h-36 shadow-[inset_0_-4px_0_#D6BBFB,0_10px_20px_rgba(0,0,0,0.1)] flex flex-col justify-between items-center text-white font-bold text-xl bg-gradient-to-b from-purple-400 to-purple-500"
                    >
                      <div class="flex-1 flex items-center justify-center text-4xl font-extrabold">
                        2
                      </div>
                      <div class="w-full text-center text-sm font-medium text-white pb-2">
                        {{ leaderboardData[1].points }} pts
                      </div>
                    </div>
                  </div>
                </div>

                <div class="w-28">
                  <div
                    v-if="leaderboardData[0]"
                    class="flex flex-col items-center z-20 transition-all duration-300 hover:scale-110 hover:-translate-y-4 relative"
                  >
                    <img
                      :src="leaderboardData[0].avatarUrl || 'https://via.placeholder.com/60'"
                      class="w-20 h-20 rounded-full border-4 border-yellow-400 mb-2 shadow-lg ring-4 ring-yellow-300"
                    />
                    <img
                      src="/src/assets/images/crown.png"
                      alt="Crown"
                      class="absolute w-10 h-10 animate-pulse-slow"
                      style="top: -35px"
                    />
                    <div class="text-sm font-semibold text-gray-800">
                      {{ leaderboardData[0].name }}
                    </div>
                    <div class="w-28">
                      <div class="w-full bg-[#cbf3f0] rounded-full h-3 mt-1 mb-3 shadow-inner">
                        <div
                          class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all duration-300 ease-in-out"
                          :style="{ width: leaderboardData[0].progress + '%' }"
                        ></div>
                      </div>
                    </div>
                    <div
                      class="bg-white rounded-t-xl w-28 h-44 shadow-[inset_0_-4px_0_#FDE68A,0_10px_30px_rgba(0,0,0,0.1)] flex flex-col justify-between items-center text-white font-bold text-xl bg-gradient-to-br from-yellow-300 to-yellow-500 transform hover:scale-105 transition-transform duration-300"
                    >
                      <div class="flex-1 flex items-center justify-center text-6xl font-bold">
                        1
                      </div>
                      <div class="w-full text-center text-sm font-medium text-white pb-2">
                        {{ leaderboardData[0].points }} pts
                      </div>
                    </div>
                  </div>
                </div>

                <div class="w-24">
                  <div
                    v-if="leaderboardData[2]"
                    class="flex flex-col items-center z-10 transition-all duration-300 hover:scale-105 hover:-translate-y-2 relative"
                  >
                    <img
                      :src="leaderboardData[2].avatarUrl || 'https://via.placeholder.com/60'"
                      class="w-16 h-16 rounded-full border-2 border-white mb-2 shadow-lg"
                    />
                    <div class="text-sm font-semibold text-gray-800">
                      {{ leaderboardData[2].name }}
                    </div>
                    <div class="w-24">
                      <div class="w-full bg-[#cbf3f0] rounded-full h-3 mt-1 mb-3 shadow-inner">
                        <div
                          class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all duration-300 ease-in-out"
                          :style="{ width: leaderboardData[2].progress + '%' }"
                        ></div>
                      </div>
                    </div>
                    <div
                      class="bg-white rounded-t-xl w-24 h-28 shadow-[inset_0_-4px_0_#C4B5FD,0_10px_20px_rgba(0,0,0,0.1)] flex flex-col justify-between items-center text-white font-bold text-xl bg-gradient-to-b from-purple-300 to-purple-600"
                    >
                      <div class="flex-1 flex items-center justify-center text-4xl font-extrabold">
                        3
                      </div>
                      <div class="w-full text-center text-sm font-medium text-white pb-2">
                        {{ leaderboardData[2].points }} pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto w-full space-y-2">
                <div
                  v-for="(member, index) in leaderboardData.slice(3)"
                  :key="member.uid"
                  class="flex items-center gap-6 px-4 py-2 rounded-lg bg-gray-100 transition hover:scale-[1.01] hover:shadow"
                >
                  <div class="text-gray-500 font-bold text-lg w-4 text-right">{{ index + 4 }}</div>
                  <div class="flex items-center gap-3 flex-1">
                    <img
                      :src="member.avatarUrl || 'https://via.placeholder.com/40'"
                      class="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div class="text-sm font-medium text-gray-800">{{ member.name }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 w-48">
                    <div class="w-full bg-[#cbf3f0] rounded-full h-3 shadow-inner">
                      <div
                        class="h-3 rounded-full bg-[#2ec4b6] shadow-md transition-all"
                        :style="{ width: member.progress + '%' }"
                      ></div>
                    </div>
                    <span class="text-sm font-semibold text-gray-600 flex-shrink-0"
                      >{{ member.points }} pts</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-sm text-center py-4">
              No progress data for this group.
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
