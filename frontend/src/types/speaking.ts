export type SpeakingPart = 'part_1' | 'part_2' | 'part_3'
export type SpeakSource = 'audio' | 'text'
export type SessionStatus = 'active' | 'completed'

export interface SpeakingScoreBreakdown {
  fluencyAndCoherence: number
  lexicalResource: number
  grammaticalRangeAccuracy: number
  pronunciation: number
  overall: number
}

export interface SpeakingErrorItem {
  issue: string
  correction: string
  example: string
}

export interface SpeakingTurnResponse {
  turnId: string
  question: string
  userTranscript: string
  assistantReply: string
  followUpQuestion: string
  speakingSummary: string
  pronunciationSummary: string
  memorySummary: string
  source: SpeakSource
  scores: SpeakingScoreBreakdown
  errors: SpeakingErrorItem[]
  rephrasing: string
  wordCount: number
  ttsAudioBase64?: string | null
  ttsMimeType?: string | null
  createdAtUtc: string
}

export interface SpeakingSessionResponse {
  sessionId: string
  part: SpeakingPart
  topic: string
  autoSpeak: boolean
  status: SessionStatus
  currentQuestion: string
  memorySummary: string
  turns: SpeakingTurnResponse[]
  createdAtUtc: string
  updatedAtUtc: string
}

export interface SpeakingTurnResult {
  session: SpeakingSessionResponse
  turn: SpeakingTurnResponse
}

export interface HealthResponse {
  status: string
  stt: string
  llm: string
  tts: string
  memoryStore?: string | null
  whisperModel?: string | null
  ollamaModel?: string | null
  voice?: string | null
}

export interface StartSpeakingRequest {
  part?: SpeakingPart
  topic?: string
  autoSpeak?: boolean
  userGoal?: string
}

export interface AudioChunkMessage {
  type: 'audio_start'
  mimeType?: string | null
}

export interface AudioEndMessage {
  type: 'audio_end'
}

export interface StartMessage {
  type: 'start'
  part?: SpeakingPart
  topic?: string
  autoSpeak?: boolean
  userGoal?: string
}

export interface TextMessage {
  type: 'text'
  text: string
}

export interface ResetMessage {
  type: 'reset'
}

export type WebSocketInbound =
  | { type: 'session_started'; session: SpeakingSessionResponse }
  | { type: 'segment_started' }
  | { type: 'segment_empty' }
  | { type: 'transcript'; text: string }
  | { type: 'analysis'; speakingSummary: string; pronunciationSummary: string; memorySummary: string; scores: SpeakingScoreBreakdown; errors: SpeakingErrorItem[]; rephrasing: string; expectedAnswer: string }
  | { type: 'assistant_sentence'; text: string; index: number; audioBase64?: string | null; mimeType?: string | null; final: boolean }
  | { type: 'turn_complete'; session: SpeakingSessionResponse; turn: SpeakingTurnResponse }
  | { type: 'turn_skipped'; reason: string }
  | { type: 'reset_ack' }
  | { type: 'error'; message: string }

export type WebSocketOutbound =
  | StartMessage
  | AudioChunkMessage
  | AudioEndMessage
  | TextMessage
  | ResetMessage

export type SubmitSpeakingResponse = SpeakingSessionResponse

export interface SubmitSpeakingForm {
  text?: string
  audio?: File | null
}
