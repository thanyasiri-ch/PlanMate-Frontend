import apiClient from './AxiosClient'
import type {
  AssignmentDTO,
  AvailabilityRequestDTO,
  CourseBaseDTO,
  CourseId,
  CourseResponseDTO,
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
  saveAllCourses(termId: number, courses: CourseBaseDTO[]): Promise<{ data: CourseResponseDTO[] }> {
    return apiClient.put(`/study-setup/terms/${termId}/courses`, courses)
  },

  deleteCourse(courseId: CourseId): Promise<void> {
    return apiClient.delete(`/study-setup/terms/${courseId.termId}/courses/${courseId.courseCode}`)
  },

  // COURSE DETAILS
  getCourseDetails(termId: number, courseCode: string): Promise<{ data: CourseResponseDTO }> {
    return apiClient.get(`/study-setup/terms/${termId}/courses/${courseCode}/details`);
  },

  saveCourseDetails(courseCode: string, details: CourseResponseDTO): Promise<{ data: CourseResponseDTO }> {
    return apiClient.put(`/study-setup/courses/${courseCode}/details`, details)
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

  // AVAILABILITY
  saveAvailabilities(avails: AvailabilityRequestDTO[]) {
    return apiClient.post('/study-setup/availabilities', avails)
  },
}
