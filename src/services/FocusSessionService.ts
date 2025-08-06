import apiClient from './AxiosClient'
import type { StartFocusSessionDTO } from '@/types'

export default {
  getToDoList() {
    return apiClient.get('/sessions/todo')
  },
  startSession(data: StartFocusSessionDTO) {
    return apiClient.post('/sessions/start', data)
  },
  endSession(focusSessionId: string) {
    return apiClient.post('/sessions/end', { focusSessionId })
  }
}
