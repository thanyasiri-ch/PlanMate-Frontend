import { defineStore } from 'pinia'
import type {
  StudySetupDTO,
  TermDTO,
  CourseDTO,
  AvailabilityDTO,
} from '@/types'

export const useStudySetupStore = defineStore('studySetup', {
  state: () => ({
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
    setUserUid(uid: string) {
      this.userUid = uid
    },

    setTerm(term: TermDTO) {
      this.term = term
    },

    updateCourse(updatedCourse: CourseDTO) {
      const index = this.term.courses.findIndex(c => c.id === updatedCourse.id)
      if (index !== -1) this.term.courses[index] = updatedCourse
      else this.term.courses.push(updatedCourse)
    },

    setAvailabilities(avail: AvailabilityDTO[]) {
      this.availabilities = avail
    },

    reset() {
      this.$reset()
    },
  },
})
