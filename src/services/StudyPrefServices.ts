import apiClient from "./AxiosClient"
import type { StudyPreference } from "@/types"

export default {
  getPref() {
    return apiClient.get('/study-preferences')
  },
  savePref(studyPref: StudyPreference) {
    return apiClient.post('/study-preferences', studyPref)
  },
  updatePref(studyPref: StudyPreference) {
    return apiClient.put('/study-preferences', studyPref)
  }
}