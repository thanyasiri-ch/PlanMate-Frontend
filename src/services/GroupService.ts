import apiClient from './AxiosClient'
import type {
  GroupRequestDTO,
  StudyGroupResponseDTO,
  GroupMemberProgressDTO,
} from '@/types'

export const groupService = {
  getGroup: () => {
    return apiClient.get<StudyGroupResponseDTO[]>('/groups')
  },
  createGroup: (data: GroupRequestDTO) => {
    return apiClient.post('/groups', data)
  },

  joinGroup: (joinCode: string) => {
    return apiClient.post(`/groups/join/${joinCode}`)
  },

  getGroupProgress: (groupId: number) =>
    apiClient.get<GroupMemberProgressDTO[]>(`/groups/${groupId}/progress`),
}
