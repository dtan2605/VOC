export type LearningDirection = 'English_to_Vietnamese' | 'Vietnamese_to_English'

export interface LearningVocabularyCard {
  vocabularyId: number
  word: string
  meaning: string
  partOfSpeech: string
  pronunciation: string
  bandName: string
  topicName: string
  bandId: number
  topicId: number
  topicColorHex: string
  exampleCount: number
  examplePreview: string
  masteryScore: number
  reviewedInSession: boolean
  sessionResult?: string | null
  promptText: string
  promptLabel: string
  answerPlaceholder: string
}

export interface LearningSessionSummary {
  id: number
  mode: string
  direction: LearningDirection
  bandId?: number | null
  topicId?: number | null
  totalItems: number
  completedItems: number
  currentStreak: number
  bestStreak: number
  status: string
  startedAtUtc: string
  completedAtUtc?: string | null
}

export interface LearningSessionDetail {
  session: LearningSessionSummary
  items: LearningVocabularyCard[]
  nextItem?: LearningVocabularyCard | null
}

export interface SubmitReviewResponse {
  sessionId: number
  completedItems: number
  totalItems: number
  sessionCompleted: boolean
  updatedMasteryScore: number
  isCorrect: boolean
  expectedAnswer: string
  userAnswer: string
  currentStreak: number
  bestStreak: number
  nextItem?: LearningVocabularyCard | null
}

export interface ReviewHistoryItem {
  id: number
  sessionId: number
  vocabularyId: number
  word: string
  meaning: string
  bandName: string
  topicName: string
  direction: LearningDirection
  userAnswer: string
  expectedAnswer: string
  isCorrect: boolean
  result: string
  scoreSnapshot: number
  secondsSpent: number
  reviewedAtUtc: string
}

export interface BandLearningProgress {
  bandId: number
  bandName: string
  totalWords: number
  reviewedWords: number
  masteredWords: number
  averageMasteryScore: number
}

export interface TopicLearningProgress {
  topicId: number
  topicName: string
  colorHex: string
  totalWords: number
  reviewedWords: number
  masteredWords: number
  averageMasteryScore: number
}

export interface ProgressOverview {
  totalSessions: number
  activeSessions: number
  totalReviews: number
  masteredWords: number
  wordsInProgress: number
  averageMasteryScore: number
  currentStudyStreakDays: number
  bestAnswerStreak: number
}

export interface LearningProgressResponse {
  overview: ProgressOverview
  recentSessions: LearningSessionSummary[]
  recentReviews: ReviewHistoryItem[]
  bandProgress: BandLearningProgress[]
  topicProgress: TopicLearningProgress[]
  focusWords: LearningVocabularyCard[]
}

export interface StartLearningSessionRequest {
  mode: 'mixed' | 'band' | 'topic'
  direction: LearningDirection
  bandId?: number
  topicId?: number
  itemCount: number
}

export interface SubmitReviewRequest {
  vocabularyId: number
  userAnswer: string
  secondsSpent: number
}
