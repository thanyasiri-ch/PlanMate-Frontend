import { defineStore } from 'pinia'
import type {
  StudySetupResponseDTO,
  TermRequestDTO,
  TermResponseDTO,
  AvailabilityResponseDTO,
  CourseBaseDTO,
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
    // ... (your existing getters remain the same) ...

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
    async fetchAndSetTerm(termId: number): Promise<TermResponseDTO> {
      try {
        console.log(`STORE ACTION: Fetching term with ID: ${termId}`);
        const response = await studySetupService.getTermById(termId);
        this.setTerm(response.data);
        console.log('STORE ACTION: Store updated with fetched term.');
        return response.data;
      } catch (error) {
        console.error(`STORE ACTION: Failed to fetch term ${termId}`, error);
        throw error;
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
        let response;
        const requestDTO: TermRequestDTO = {
          name: termData.name,
          startDate: termData.startDate,
          endDate: termData.endDate,
        };

        if (termData.termId && termData.termId !== 0) {
          // If termId exists and is not 0, it's an update
          console.log(`STORE ACTION: Updating term with ID: ${termData.termId}`);
          response = await studySetupService.updateTerm(termData.termId, requestDTO);
        } else {
          // If termId is 0 or doesn't exist, it's a new creation
          console.log('STORE ACTION: Creating new term.');
          response = await studySetupService.createTerm(requestDTO);
        }

        // Update the Pinia store with the server's response (which now includes the new termId for creation)
        this.setTerm(response.data);
        console.log('STORE ACTION: Term saved/updated successfully.');
        return response.data; // Return the full response from the server
      } catch (error) {
        console.error('STORE ACTION: Failed to save or update term.', error);
        throw error;
      }
    },

    /**
     * ACTION: Saves the courses for the current term.
     * This action will require the termId from the store.
     * @param courses The list of CourseBaseDTOs to save.
     */
    async saveCourses(courses: CourseBaseDTO[]): Promise<void> {
      if (!this.term.termId || this.term.termId === 0) {
        console.warn('Cannot save courses: Term ID is missing. Save the term first.');
        throw new Error('Term ID is required to save courses. Please save the term details first.');
      }

      try {
        console.log(`STORE ACTION: Saving courses for term ID: ${this.term.termId}`);
        // Adjust the courses to include the termId in their CourseIdDTO part if your backend expects it for new courses
        const coursesWithTermId = courses.map(course => ({
            ...course,
            courseId: {
                termId: this.term.termId,
                courseCode: course.courseCode
            }
        }));
        await studySetupService.saveCourses(this.term.termId, coursesWithTermId);
        // Optionally refetch the term to ensure courses in store are up-to-date after saving
        // await this.fetchAndSetTerm(this.term.termId); // Uncomment if backend updates term with new course info directly on saveCourses
        console.log('STORE ACTION: Courses saved successfully.');
      } catch (error) {
        console.error('STORE ACTION: Failed to save courses.', error);
        throw error;
      }
    },

    // ... (your other actions like updateCourse, updateCourseBaseInfo, etc., remain the same) ...

    reset() {
      // Ensure reset sets termId back to 0 for a fresh start
      this.$reset();
      this.term.termId = 0; // Explicitly reset termId
      this.term.courses = []; // Ensure courses are cleared
    },
  },
})
