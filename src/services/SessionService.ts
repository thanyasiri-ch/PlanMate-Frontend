import apiClient from './AxiosClient'

export default {
  getToDoList() {
    return apiClient.get('/sessions/todo')
  }
}
