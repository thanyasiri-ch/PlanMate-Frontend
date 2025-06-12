import apiClient from "./AxiosClient"
import type { StudySetupDTO} from "@/types"

export default {
  getPref() {
    return apiClient.get('/study-setup')
  },
  saveSetup(studySetup: StudySetupDTO){
    return apiClient.post('/study-setup', studySetup)
  },
  updateSetup(studySetup: StudySetupDTO){
    return apiClient.put('/study-setup', studySetup)
  }
}
