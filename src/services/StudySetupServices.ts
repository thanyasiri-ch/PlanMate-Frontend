import apiClient from './AxiosClient'
import type {
  AssignmentDTO,
  AvailabilityDTO,
  AvailabilityRequestDTO,
  CourseBaseDTO,
  CourseDTO,
  ExamDTO,
  TermRequestDTO,
  TermResponseDTO,
  TopicDTO,
} from '@/types'

export const studySetupService = {
  // Term
  getTermById(termId: number): Promise<{ data: TermResponseDTO }> {
    return apiClient.get(`/study-setup/terms/${termId}`)
  },

  getCurrentTerm(): Promise<{ data: TermResponseDTO | null }> {
    return apiClient.get('/study-setup/terms/current')
  },

  createTerm(termData: TermRequestDTO): Promise<{ data: TermResponseDTO }> {
    return apiClient.post('/study-setup/terms', termData)
  },

  updateTerm(termId: number, termData: TermRequestDTO): Promise<{ data: TermResponseDTO }> {
    return apiClient.put(`/study-setup/terms/${termId}`, termData)
  },

  // Courses
  saveAllCourses(termId: number, courses: CourseBaseDTO[]): Promise<{ data: CourseDTO[] }> {
    return apiClient.put(`/study-setup/terms/${termId}/courses`, courses)
  },

  deleteCourse(courseId: number): Promise<void> {
    return apiClient.delete(`/study-setup/terms/courses/${courseId}`)
  },

  saveCourseDetails(details: CourseDTO): Promise<{ data: CourseDTO }> {
    return apiClient.put(`/study-setup/courses/details`, details)
  },

  // TOPICS
  addTopic(courseCode: string, topic: TopicDTO) {
    return apiClient.post(`/study-setup/courses/${courseCode}/topics`, topic)
  },

  deleteTopic(courseCode: string, topicId: string) {
    return apiClient.delete(`/study-setup/courses/${courseCode}/topics/${topicId}`)
  },

  // ASSIGNMENTS
  addAssignment(courseCode: string, assignment: AssignmentDTO) {
    return apiClient.post(`/study-setup/courses/${courseCode}/assignments`, assignment)
  },

  deleteAssignment(courseCode: string, assignmentId: string) {
    return apiClient.delete(`/study-setup/courses/${courseCode}/assignments/${assignmentId}`)
  },

  // EXAMS
  updateExam(courseCode: string, exam: ExamDTO) {
    return apiClient.put(`/study-setup/courses/${courseCode}/exams/${exam.type}`, exam)
  },

  getAvailabilities(): Promise<{ data: AvailabilityDTO[] }> {
  return apiClient.get('/study-setup/availabilities')
  },

  // AVAILABILITY
  updateAvailabilities(avails: AvailabilityRequestDTO[]): Promise<{ data: AvailabilityDTO[] }> {
  return apiClient.put('/study-setup/availabilities', avails)
  }
}
