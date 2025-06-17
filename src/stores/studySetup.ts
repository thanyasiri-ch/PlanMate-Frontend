import { defineStore } from 'pinia'
import type {
  StudySetupDTO,
  TermDTO,
  CourseDTO,
  AvailabilityDTO,
  ExamDTO,
  TopicDTO,
  AssignmentDTO,
  ExamType, 
} from '@/types'

export const useStudySetupStore = defineStore('studySetup', {
  state: (): StudySetupDTO => ({
    userUid: '',
    term: {
      name: '',
      startDate: '',
      endDate: '',
      courses: [],
    } as TermDTO,
    availabilities: [] as AvailabilityDTO[],
  }),

  getters: {
    studySetupDTO(state): StudySetupDTO {
      return {
        userUid: state.userUid,
        term: state.term,
        availabilities: state.availabilities,
      }
    },
  },

  actions: {
    setTerm(term: TermDTO) {
      this.term = term
    },

    updateCourse(updatedCourse: CourseDTO) {
      const index = this.term.courses.findIndex((c) => c.id === updatedCourse.id)
      if (index !== -1) {
        this.term.courses[index] = updatedCourse
      } else {
        this.term.courses.push(updatedCourse)
      }
    },

    setAvailabilities(avail: AvailabilityDTO[]) {
      this.availabilities = avail
    },

    // --- NEW ACTIONS TO SUPPORT THE COMPONENT ---

    /**
     * Finds a specific exam within a course and updates its details.
     */
    updateExamDetails(courseId: string, examType: ExamType, newDetails: Partial<ExamDTO>) {
      const course = this.term.courses.find((c) => c.id === courseId)
      if (course) {
        const examIndex = course.exams.findIndex((e) => e.type === examType)
        if (examIndex !== -1) {
          // Merge the existing exam data with the new details
          course.exams[examIndex] = { ...course.exams[examIndex], ...newDetails }
        }
      }
    },

    /**
     * Adds a new topic to a specific exam.
     */
    addTopic(courseId: string, topic: TopicDTO) {
      const course = this.term.courses.find((c) => c.id === courseId)
      if (course) {
        course.topics.push(topic)
      }
    },

    /**
     * Deletes a topic from a specific exam.
     */
    deleteTopic(courseId: string, topicName: string) {
      const course = this.term.courses.find((c) => c.id === courseId)
      if (course) {
        course.topics = course.topics.filter(t => t.name !== topicName)
      }
    },
    
    /**
     * Adds a new assignment to a course.
     */
    addAssignment(courseId: string, assignment: AssignmentDTO) {
      const course = this.term.courses.find((c) => c.id === courseId)
      if (course) {
        course.assignments.push(assignment)
      }
    },

    /**
     * Deletes an assignment from a course.
     */
    deleteAssignment(courseId: string, assignmentToDelete: AssignmentDTO) {
      const course = this.term.courses.find((c) => c.id === courseId)
      if (course) {
        const assignmentIndex = course.assignments.findIndex(a => a.name === assignmentToDelete.name); // Or a more robust ID
        if (assignmentIndex !== -1) {
          course.assignments.splice(assignmentIndex, 1)
        }
      }
    },

    reset() {
      this.$reset()
    },
  },
})