/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GroupMemberProgressDTO, StudyGroupResponseDTO } from '@/types'
import { groupService } from '@/services/GroupService'
import defaultGroupImage from '@/assets/images/group.png'
import { getCurrentUser } from '@/services/auth'
import { notificationService } from '@/services/NotificationService'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<StudyGroupResponseDTO[]>([])
  const groupProgress = ref<GroupMemberProgressDTO[]>([])
  const joinError = ref('')
  const joinSuccess = ref('')

  const createError = ref('')
  const createSuccess = ref('')

  const fetchGroupsError = ref('')
  const fetchProgressError = ref('')

  const isFetchingGroups = ref(false)
  const isJoiningGroup = ref(false)
  const isFetchingProgress = ref(false)

  const fetchGroup = async () => {
    isFetchingGroups.value = true
    fetchGroupsError.value = ''
    try {
      const res = await groupService.getGroup()
      groups.value = res.data
    } catch (err) {
      fetchGroupsError.value = 'Failed to fetch groups.'
      groups.value = []
    } finally {
      isFetchingGroups.value = false
    }
  }

  const fetchGroupProgress = async (groupId: number) => {
    isFetchingProgress.value = true
    fetchProgressError.value = ''
    try {
      const res = await groupService.getGroupProgress(groupId)
      groupProgress.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      fetchProgressError.value = 'Failed to fetch group progress.'
      groupProgress.value = []
    } finally {
      isFetchingProgress.value = false
    }
  }

  const joinGroup = async (joinCode: string) => {
    isJoiningGroup.value = true
    joinError.value = ''
    joinSuccess.value = ''

    try {
      const res = await groupService.joinGroup(joinCode)
      joinSuccess.value = res.data.message

      const joinedGroupId = res.data.groupId
      if (!joinedGroupId) {
        console.warn('No groupId returned from joinGroup response')
        return
      }

      await fetchGroup()

      const currentUser = await getCurrentUser()
      const currentUserId = currentUser?.uid

      const joinedGroup = groups.value.find((g) => g.id === joinedGroupId)
      if (!joinedGroup) {
        console.warn('Joined group not found in fetched list')
        return
      }

      if (!joinedGroup) {
        console.warn('Could not identify joined group from fetched data')
        return
      }

      // Notify all group members about the new joiner
      for (const member of joinedGroup.members) {
        if (!member.user.uid) continue

        const isCurrentUser = member.user.uid === currentUserId
        const title = isCurrentUser
          ? 'Welcome to your new group! 🎉'
          : 'A new member just joined your group 👋'
        const content = isCurrentUser
          ? `You’ve successfully joined ${joinedGroup.name}.`
          : `${currentUser?.displayName || 'Someone'} has joined ${joinedGroup.name}!.`

        await notificationService.sendNotification({
          userUid: member.user.uid,
          type: 'GENERAL',
          title,
          content,
        })
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        joinError.value = err.response.data || 'Invalid join code.'
      } else {
        joinError.value = 'Failed to join group. Try again later.'
      }
    } finally {
      isJoiningGroup.value = false
    }
  }

  const createGroup = async (data: { groupName: string; imageUrl: string }) => {
    isFetchingGroups.value = true
    createError.value = ''
    createSuccess.value = ''

    try {
      const payload = {
        groupName: data.groupName,
        imageUrl: data.imageUrl || defaultGroupImage,
      }

      const res = await groupService.createGroup(payload)
      createSuccess.value =
        typeof res.data === 'string' ? `Group created: ${res.data}` : 'Group created successfully.'
      await fetchGroup()

      // Auto-clear success after 2s
      setTimeout(() => {
        createSuccess.value = ''
      }, 2000)
    } catch (err: any) {
      createError.value = 'Failed to create group.'

      // Auto-clear error after 2s
      setTimeout(() => {
        createError.value = ''
      }, 2000)
    } finally {
      isFetchingGroups.value = false
    }
  }

  return {
    groups,
    groupProgress,
    createError,
    createSuccess,
    joinError,
    joinSuccess,
    fetchGroupsError,
    fetchProgressError,
    isFetchingGroups,
    isJoiningGroup,
    isFetchingProgress,
    fetchGroup,
    fetchGroupProgress,
    joinGroup,
    createGroup,
  }
})
