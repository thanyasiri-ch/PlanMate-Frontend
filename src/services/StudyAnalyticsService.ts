import apiClient from './AxiosClient'
import type { StudyAnalyticsDTO } from '@/types'

export default {
  getAnalytics(range: string, date: string) {
    return apiClient.get<StudyAnalyticsDTO>('/analytics', {
      params: { range, date },
    })
  },
}
