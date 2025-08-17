import apiClient from './AxiosClient'

export default {
  fetchActiveSession() {
    return apiClient.get('/focus/active');
  },
  startSession(sessionId: string) {
    return apiClient.post(`/focus/${sessionId}/start`);
  },
  pauseSession(focusSessionId: string) {
    return apiClient.post(`/focus/${focusSessionId}/pause`);
  },
  resumeSession(focusSessionId: string) {
    return apiClient.post(`/focus/${focusSessionId}/resume`);
  },
  endSession(focusSessionId: string) {
    return apiClient.post(`/focus/${focusSessionId}/end`); 
  }
}
