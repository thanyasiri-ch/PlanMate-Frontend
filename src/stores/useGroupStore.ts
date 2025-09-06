/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GroupMemberProgressDTO, StudyGroupResponseDTO } from '@/types'
import { groupService } from '@/services/GroupService'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<StudyGroupResponseDTO[]>([])
  const groupProgress = ref<GroupMemberProgressDTO[]>([])
  const error = ref('')
  const success = ref('')

  const isFetchingGroups = ref(false)
  const isJoiningGroup = ref(false)
  const isFetchingProgress = ref(false)

  const fetchGroup = async () => {
    isFetchingGroups.value = true
    error.value = ''
    try {
      const res = await groupService.getGroup()
      groups.value = res.data
    } catch (err) {
      error.value = 'Failed to fetch groups.'
      groups.value = []
    } finally {
      isFetchingGroups.value = false
    }
  }

  const fetchGroupProgress = async (groupId: number) => {
    isFetchingProgress.value = true
    error.value = ''
    try {
      const res = await groupService.getGroupProgress(groupId)
      groupProgress.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      error.value = 'Failed to fetch group progress.'
      groupProgress.value = []
    } finally {
      isFetchingProgress.value = false
    }
  }

  const joinGroup = async (joinCode: string) => {
    isJoiningGroup.value = true
    error.value = ''
    success.value = ''

    try {
      const res = await groupService.joinGroup(joinCode)
      success.value = res.data
      await fetchGroup()
    } catch (err: any) {
      if (err.response?.status === 400) {
        error.value = err.response.data || 'Invalid join code.'
      } else {
        error.value = 'Failed to join group. Try again later.'
      }
    } finally {
      isJoiningGroup.value = false
    }
  }

  const createGroup = async (data: { groupName: string; imageUrl: string }) => {
    isFetchingGroups.value = true
    error.value = ''
    success.value = ''

    try {
      const res = await groupService.createGroup(data)
      success.value =
        typeof res.data === 'string' ? `Group created: ${res.data}` : 'Group created successfully.'
      await fetchGroup()
    } catch (err: any) {
      error.value = 'Failed to create group.'
    } finally {
      isFetchingGroups.value = false
    }
  }

  return {
    groups,
    groupProgress,
    error,
    success,
    isFetchingGroups,
    isJoiningGroup,
    isFetchingProgress,
    fetchGroup,
    fetchGroupProgress,
    joinGroup,
    createGroup,
  }
})
