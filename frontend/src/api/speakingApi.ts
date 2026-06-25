import axiosInstance from './axiosInstance'
import type {
  HealthResponse,
  SpeakingScoreBreakdown,
  SpeakingSessionResponse,
  SpeakingTurnResult,
} from '../types/speaking'

const SPEECH_URL = '/api/speaking'

export const speakingApi = {
  health: async (): Promise<HealthResponse | null> => {
    try {
      const response = await axiosInstance.get<HealthResponse>(`${SPEECH_URL}/health`, {
        validateStatus: () => true,
      })
      if (response.status >= 400) return null
      return response.data
    } catch {
      return null
    }
  },

  getSession: async (sessionId: string): Promise<SpeakingSessionResponse | null> => {
    try {
      const response = await axiosInstance.get<SpeakingSessionResponse>(
        `${SPEECH_URL}/sessions/${sessionId}`
      )
      return response.data
    } catch {
      return null
    }
  },

  createSession: async (payload: {
    part?: string
    topic?: string
    autoSpeak?: boolean
    userGoal?: string
  }): Promise<SpeakingSessionResponse | null> => {
    try {
      const response = await axiosInstance.post<SpeakingSessionResponse>(
        `${SPEECH_URL}/sessions`,
        payload
      )
      return response.data
    } catch {
      return null
    }
  },

  submitTextTurn: async (
    sessionId: string,
    text: string
  ): Promise<SpeakingTurnResult | null> => {
    try {
      const data = new FormData()
      data.append('text', text)
      const response = await axiosInstance.post<SpeakingTurnResult>(
        `${SPEECH_URL}/sessions/${sessionId}/turns`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    } catch {
      return null
    }
  },

  submitAudioTurn: async (
    sessionId: string,
    audio: File
  ): Promise<SpeakingTurnResult | null> => {
    try {
      const data = new FormData()
      data.append('audio', audio)
      const response = await axiosInstance.post<SpeakingTurnResult>(
        `${SPEECH_URL}/sessions/${sessionId}/turns`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    } catch {
      return null
    }
  },
}

export const formatScores = (scores: SpeakingScoreBreakdown) => {
  return {
    fluencyAndCoherence: scores.fluencyAndCoherence.toFixed(1),
    lexicalResource: scores.lexicalResource.toFixed(1),
    grammaticalRangeAccuracy: scores.grammaticalRangeAccuracy.toFixed(1),
    pronunciation: scores.pronunciation.toFixed(1),
    overall: scores.overall.toFixed(1),
  }
}
