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
  assignmentId: string
  topicId: string
  sessionId: string
  courseId: number
  duration: number
  type: SessionType
  isScheduled: boolean
  isCompleted: boolean
  date: string
  start: string
  end: string
  topicName: string
  assignmentName: string
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

export interface MemberProfileDTO {
  memberId: string
  displayName: string
  photoUrl: string
}

export interface GroupMemberProgressDTO {
  member: MemberProfileDTO
  completedSessions: number
  totalFocusSeconds: number
  percentageCompleted: number
  points: number
}

export interface GroupMemberDTO {
  id: number
  user: User
}

export enum FocusStatus {
  INCOMPLETE,
  FOCUSING,
  COMPLETED,
  CANCELLED,
  INTERRUPTED
}

export interface FocusSessionDTO {
  id: string
  displayName: string
  session: SessionDTO
  courseId?: number
  topicId?: string | null
  assignmentId?: string | null
  courseName: string
  focusStart: string
  focusEnd?: string | null
  elapsedSeconds?: number
  plannedDuration: number
  status: FocusStatus
  sessionType: SessionType
}

export interface ToDoListResponseDTO {
  overdue: SessionDTO[]
  today: SessionDTO[]
  tomorrow: SessionDTO[]
  upcoming: SessionDTO[]
}

export interface FocusSessionDetailDTO {
  id: string
  courseName: string
  focusStart: string
  focusEnd: string
  elapsed: number
}

export interface StudyAnalyticsDTO {
  totalCompletedFocusSessions: number
  totalFocusDuration: number
  subjectBreakdown: Record<string, number>
  focusSessions: FocusSessionDetailDTO[]
}

export interface FriendItem {
  id: string
  name: string
  image: string
  timeLeft: number
  status?: string
  sessionDuration?: number
}

export type FocusRequest = {
  from: string
  fromName: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: number
}

export interface Invitation {
  id: string
  from: string
  fromName: string
  roomId: string
  timestamp: number
}

export interface Notification {
  token: string
  title: string
  body: string
}
