import apiClient from './AxiosClient'
import type { StartFocusSessionDTO } from '@/types'

export default {
  startFocus(payload: StartFocusSessionDTO) {
    return apiClient.post('/focus-session/start', payload)
  },

  stopFocus(sessionId: string) {
    return apiClient.post(`/focus-session/${sessionId}/stop`)
  },
}
