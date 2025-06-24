/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineStore } from 'pinia'
import type {
  StudySetupResponseDTO,
  TermRequestDTO,
  TermResponseDTO,
  AvailabilityResponseDTO,
  CourseBaseDTO,
  CourseResponseDTO,
  CourseId,
} from '@/types'
import { studySetupService } from '@/services/StudySetupServices' // Import your API service

export const useStudySetupStore = defineStore('studySetup', {
  state: (): StudySetupResponseDTO => ({
    userUid: '', // Assuming this comes from auth
    term: {
      termId: 0, // Default to 0 for a new term, indicates no ID yet
      name: '',
      startDate: '',
      endDate: '',
      courses: [],
    } as TermResponseDTO,
    availabilities: [] as AvailabilityResponseDTO[],
  }),

  getters: {
    // This getter is useful for passing data to the API for creation/update
    termRequestDTO(state): TermRequestDTO {
      return {
        name: state.term.name,
        startDate: state.term.startDate,
        endDate: state.term.endDate,
      }
    },
  },

  actions: {
    /**
     * Sets the store's term data. This is the ONLY mutation point for the term.
     * @param term The complete term data, usually from a server response.
     */
    setTerm(term: TermResponseDTO) {
      this.term = term
    },

    /**
     * ACTION: Fetches a term from the server and populates the store.
     * This is called when a component needs to load data for an existing term.
     * @param termId The ID of the term to fetch.
     * @returns The fetched term data.
     */
    async fetchAndSetTerm(): Promise<TermResponseDTO | null> {
      // Return cached term if it exists and has a valid termId
      if (this.term && this.term.termId && this.term.termId !== 0) {
        console.log('STORE ACTION: Using cached current term from store.')
        return this.term
      }

      // Otherwise fetch from server
      try {
        console.log('STORE ACTION: Fetching current term from server...')
        const response = await studySetupService.getCurrentTerm()
        if (response.data) {
          this.setTerm(response.data)
          console.log('STORE ACTION: Store updated with current term')
          return response.data
        }
        return null
      } catch (error) {
        console.warn('STORE ACTION: No current term found or failed to fetch.')
        return null
      }
    },
    /**
     * ACTION: Saves a new term or updates an existing one.
     * This action handles the logic of differentiating between creation and update.
     * @param termData The term data (from localTerm.value)
     * @returns The saved/updated TermResponseDTO from the server.
     */
    async saveOrUpdateTerm(termData: TermResponseDTO): Promise<TermResponseDTO> {
      try {
        let response
        const requestDTO: TermRequestDTO = {
          name: termData.name,
          startDate: termData.startDate,
          endDate: termData.endDate,
        }

        if (termData.termId && termData.termId !== 0) {
          // If termId exists and is not 0, it's an update
          console.log(`STORE ACTION: Updating term with ID: ${termData.termId}`)
          response = await studySetupService.updateTerm(termData.termId, requestDTO)
        } else {
          // If termId is 0 or doesn't exist, it's a new creation
          console.log('STORE ACTION: Creating new term.')
          response = await studySetupService.createTerm(requestDTO)
        }

        // Update the Pinia store with the server's response (which now includes the new termId for creation)
        this.setTerm(response.data)
        console.log('STORE ACTION: Term saved/updated successfully.')
        return response.data // Return the full response from the server
      } catch (error) {
        console.error('STORE ACTION: Failed to save or update term.', error)
        throw error
      }
    },

    async saveAllCourses(coursesToSave: CourseResponseDTO[]): Promise<void> {
      if (!this.term.termId || this.term.termId === 0) {
        console.warn('Cannot save courses: Term ID is missing. Save the term first.');
        throw new Error('Term ID is required to save courses. Please save the term details first.');
      }

      try {
        console.log(`STORE ACTION: Saving all courses for term ID: ${this.term.termId}`);

        const courseBaseDTOs: CourseBaseDTO[] = coursesToSave.map(course => ({
          courseCode: course.courseCode,
          name: course.name,
          credit: course.credit,
        }));

        console.log('Save courses: ' + '\n' + courseBaseDTOs + '\nto term ' + this.term.name)
        const response = await studySetupService.saveAllCourses(this.term.termId, courseBaseDTOs);

        this.term.courses = response.data;
        console.log('STORE ACTION: All courses saved/updated successfully.');
      } catch (error) {
        console.error('STORE ACTION: Failed to save all courses.', error);
        throw error;
      }
    },

    async deleteCourse(courseId: CourseId): Promise<void> {
      await studySetupService.deleteCourse(courseId)
      this.term.courses = this.term.courses.filter(
        (c) => !(c.courseCode === courseId.courseCode && this.term.termId === courseId.termId),
      )
    },

    reset() {
      // Ensure reset sets termId back to 0 for a fresh start
      this.$reset()
      this.term.termId = 0
      this.term.courses = []
      this.availabilities = []
    },
  },
})
