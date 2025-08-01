import apiClient from './AxiosClient'
import type { GroupRequestDTO, JoinGroupRequestDTO, StudyGroupResponseDTO } from '@/types'

export const groupService = {
  getGroup: () => {
    return apiClient.get<StudyGroupResponseDTO[]>('/groups')
  },
  createGroup: (data: GroupRequestDTO) => {
    return apiClient.post('/groups', data)
  },

  joinGroup: (data: JoinGroupRequestDTO) => {
    return apiClient.post('/groups/join', data)
  },
}
