<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { useGroupStore } from '@/stores/useGroupStore'
import CreateGroup from '@/components/CreateGroup.vue'
import { uploadImageToFirebase } from '@/firebase/uploadImageToFirebase'

const joinCode = ref('')
const groupStore = useGroupStore()
const isCreateModalOpen = ref(false)
const groups = computed(() => groupStore.groups)

// Ref to track which group's code has been copied
const copiedCodeId = ref<string | null>(null)

onMounted(() => {
  groupStore.fetchGroup()
})

// Function to handle copying to clipboard
const copyToClipboard = async (group: { id: string; joinCode: string }) => {
  if (!group.joinCode || !navigator.clipboard) {
    return
  }

  try {
    await navigator.clipboard.writeText(group.joinCode)
    copiedCodeId.value = group.id // Set the id of the copied group

    // Reset the "copied" state after 2 seconds
    setTimeout(() => {
      // Only clear if the user hasn't clicked another copy button in the meantime
      if (copiedCodeId.value === group.id) {
        copiedCodeId.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code: ', err)
  }
}

const handleJoinGroup = async () => {
  // Validate join code format (e.g., 6-character alphanumeric)
  const codePattern = /^[A-Za-z0-9]{6}$/
  if (!codePattern.test(joinCode.value)) {
    groupStore.error = 'Invalid join code. Please enter a 6-character code.'
    return
  }

  await groupStore.joinGroup(joinCode.value)
}

const handleGroupSubmit = async (payload: { name: string; image: File | null }) => {
  try {
    let imageUrl = ''
    if (payload.image) {
      console.log('Uploading file:', payload.image)
      imageUrl = await uploadImageToFirebase(payload.image)
      console.log('Image uploaded successfully:', imageUrl)
    }

    await groupStore.createGroup({
      groupName: payload.name,
      imageUrl,
    })
  } catch (e) {
    console.error('Group creation failed:', e)
  }
}
</script>

<template>
  <DefaultLayout>
    <div class="h-full overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full px-6 py-4 box-border">
        <section class="flex flex-col h-full gap-4">
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
                :disabled="groupStore.isLoading"
                class="ml-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold px-4 py-2 rounded-full transition duration-200"
              >
                {{ groupStore.isLoading ? 'Joining...' : 'Join' }}
              </button>
            </div>
            <p v-if="groupStore.error" class="text-red-500 mt-2">{{ groupStore.error }}</p>
            <p v-if="groupStore.success" class="text-green-600 mt-2">{{ groupStore.success }}</p>
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
              <div v-if="groupStore.isLoading" class="text-center text-gray-500 text-sm py-4">
                Loading groups...
              </div>

              <div v-else-if="groups.length > 0" class="space-y-2">
                <div
                  v-for="group in groups"
                  :key="group.id"
                  class="flex items-center justify-between border-b border-gray-300 pb-2"
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
                        v-if="copiedCodeId === group.id"
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
            <div class="flex justify-between w-full items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Leaderboard</h2>
            </div>

            <div class="flex items-end justify-center w-full gap-15 mb-8 relative">
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

            <div class="w-full space-y-2">
              <div
                class="flex items-center gap-6 px-4 py-2 rounded-lg bg-gray-100 transition-all duration-300 hover:scale-[1.01] hover:shadow"
              >
                <div class="text-gray-500 font-bold text-lg w-4 text-right">4</div>

                <div class="flex items-center gap-3 flex-1">
                  <img src="https://i.pravatar.cc/40?img=4" class="w-8 h-8 rounded-full" />
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
