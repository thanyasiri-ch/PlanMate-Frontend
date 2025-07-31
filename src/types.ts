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
  | '2-3 reviews sessions per topic'
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
export interface TermRequestDTO {
  name: string
  startDate: string // "yyyy-MM-dd"
  endDate: string // "yyyy-MM-dd"
}

export interface TermResponseDTO {
  termId: number
  name: string
  startDate: string // "yyyy-MM-dd"
  endDate: string // "yyyy-MM-dd"
  courses: CourseDTO[]
}

export interface CourseBaseDTO {
  courseCode: string
  name: string
  credit: number
}

export interface CourseDTO extends CourseBaseDTO {
  courseId: number
  topics?: TopicDTO[]
  assignments?: AssignmentDTO[]
  exams?: ExamDTO[]
}

export interface TopicDTO {
  id: string
  name: string
  difficulty: number
  confidence: number
  estimatedStudyTime: number
  examType: ExamType
}

export interface ExamDTO {
  id: string
  type: ExamType
  date: string
  startTime: string
  endTime: string
}

export interface AssignmentDTO {
  id: string
  name: string
  dueDate: string // "yyyy-MM-dd"
  dueTime: string
  estimatedTime: number
  associatedTopicIds: string[]
  examType: ExamType
  completed: boolean
}

export interface AvailabilityDTO {
  id: number
  date: string // "yyyy-MM-dd"
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface AvailabilityRequestDTO {
  date: string // "yyyy-MM-dd"
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface StudySetupResponseDTO {
  userUid: string
  term: TermResponseDTO
  availabilities: AvailabilityDTO[]
}

export interface CourseDetailsRequestDTO {
  courseCode: string // Needs to identify which course these details belong to
  topics: TopicDTO[]
  assignments: AssignmentDTO[]
  exams: ExamDTO[]
}

export enum ExamType {
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL',
}

export enum SessionType {
  FINAL_REVIEW = 'FINAL_REVIEW',
  OVERVIEW = 'OVERVIEW',
  CORE_STUDY = 'CORE_STUDY',
  ASSIGNMENT = 'ASSIGNMENT',
}

export interface SessionDTO {
  sessionId: string
  courseId: number
  duration: number
  type: SessionType
  isScheduled: boolean
  date: string
  start: string
  end: string
  topicId: string | null
  assignmentId: string | null
  sessionNumber: number
  totalSessionsInGroup: number
}

export interface ScheduleDTO {
  id: string
  generatedAt: string
  examType: ExamType
  termId: number
  study_plan: SessionDTO[]
  unscheduled_plan: SessionDTO[]
}

export interface GroupRequestDTO {
  groupName: string
  imageUrl: string
}

export interface JoinGroupRequestDTO {
  joinCode: string
}

export interface StudyGroupResponseDTO {
  id: number
  name: string
  imageUrl: string
  joinCode: string
  members: GroupMemberDTO[]
}

export interface GroupMemberDTO {
  id: number
  user: User
}
