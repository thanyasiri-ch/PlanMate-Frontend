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
  },
  inviteFriend(targetUserId: string) {
    return apiClient.post(`/focus/invite/${targetUserId}`);
  },
  joinSharedRoom(roomId: string) {
    return apiClient.post(`/focus/join-room/${roomId}`);
  },
  declineInvitation(invitationId: string) {
    return apiClient.post(`/focus/invite/${invitationId}/decline`);
  },
  leaveSharedRoom(roomId: string) {
    return apiClient.post(`/focus/leave-room/${roomId}`);
  }
}
