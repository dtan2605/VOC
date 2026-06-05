import axiosInstance from './axiosInstance'
import type { HealthResponse, SpeakingScoreBreakdown, SpeakingSessionResponse, SubmitSpeakingResponse } from '../types/speaking'
import type { PagedResult } from '../types/vocabulary'

const SPEECH_URL = '/api/speaking'

export const speakingApi = {
  health: async () => {
    try {
      const response = await axiosInstance.get<HealthResponse>(`${SPEECH_URL}/health`, { validateStatus: () => true })
      if (response.status >= 400) return null
      return response.data
    } catch {
      return null
    }
  },

  listSessions: async (page = 1, pageSize = 20) => {
    const response = await axiosInstance.get<PagedResult<SpeakingSessionResponse>>(
      `${SPEECH_URL}/sessions?page=${page}&pageSize=${pageSize}`
    )
    return response.data
  },

  getSession: async (sessionId: string) => {
    const response = await axiosInstance.get<SpeakingSessionResponse>(`${SPEECH_URL}/sessions/${sessionId}`)
    return response.data
  },

  createSession: async (payload: {
    part?: string
    topic?: string
    autoSpeak?: boolean
    userGoal?: string
  }) => {
    const response = await axiosInstance.post<SpeakingSessionResponse>(`${SPEECH_URL}/sessions`, payload)
    return response.data
  },

  submitTextTurn: async (sessionId: string, text: string) => {
    const data = new FormData()
    data.append('text', text)
    const response = await axiosInstance.post<SubmitSpeakingResponse>(
      `${SPEECH_URL}/sessions/${sessionId}/turns`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  submitAudioTurn: async (sessionId: string, audio: File) => {
    const data = new FormData()
    data.append('audio', audio)
    const response = await axiosInstance.post<SubmitSpeakingResponse>(
      `${SPEECH_URL}/sessions/${sessionId}/turns`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
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
