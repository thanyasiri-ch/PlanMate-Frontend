// study preferences
export type PreferredStudyTime =
  | 'early morning'
  | 'late morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late night'

export type RevisionFrequency =
  | 'single deep review before exam'
  | '2-3 reviews per topic'
  | 'daily review sessions'

export type BreakDuration = 5 | 10 | 15 | 20 | 25 | 30

export interface StudyPreference {
  minSessionDuration: number
  maxSessionDuration: number
  preferredStudyTimes: PreferredStudyTime[]
  revisionFrequency: RevisionFrequency
  breakDurations: BreakDuration
}

export interface User {
  uid: string
  displayName: string
  email: string
  image: string
}

// study-setup
export interface TopicDTO {
  name: string
  difficulty: number
  confidence: number
  estimatedStudyTime: number
  examType: ExamType
}

export interface AssignmentDTO {
  name: string
  dueDate: string // "yyyy-MM-dd"
  dueTime: string
  estimatedTime: number
  associatedTopicTitles: string[]
  completed: boolean
}

export interface ExamDTO {
  type: ExamType
  date: string // "yyyy-MM-dd"
  startTime: string
  endTime: string
}

export interface CourseDTO {
  id: string
  name: string
  credit: number
  topics: TopicDTO[]
  assignments: AssignmentDTO[]
  exams: ExamDTO[]
}

export interface TermDTO {
  name: string
  startDate: string // "yyyy-MM-dd"
  endDate: string   // "yyyy-MM-dd"
  courses: CourseDTO[]
}

export interface AvailabilityDTO {
  date: string // "yyyy-MM-dd"
  startTime: string // "HH:mm"
  endTime: string   // "HH:mm"
}

export interface StudySetupDTO {
  userUid: string
  term: TermDTO
  availabilities: AvailabilityDTO[]
}

export enum ExamType {
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL'
}
