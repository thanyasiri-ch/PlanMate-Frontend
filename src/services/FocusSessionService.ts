import apiClient from './AxiosClient'
import type { StartFocusSessionDTO } from '@/types'

export default {
  fetchActiveSession() {
    return apiClient.get('/focus/active');
  },
  startSession(data: StartFocusSessionDTO) {
    return apiClient.post('/focus/start', data)
  },
  endSession(focusSessionId: string) {
    return apiClient.post('/focus/end', { focusSessionId })
  }
}
