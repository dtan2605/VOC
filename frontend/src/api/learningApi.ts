import axiosInstance from './axiosInstance'
import type { PagedResult } from '../types/vocabulary'
import type {
  LearningProgressResponse,
  LearningSessionDetail,
  ReviewHistoryItem,
  StartLearningSessionRequest,
  SubmitReviewRequest,
  SubmitReviewResponse,
} from '../types/learning'

export const learningApi = {
  getProgress: async () => {
    const response = await axiosInstance.get<LearningProgressResponse>('/api/learning/progress')
    return response.data
  },

  startSession: async (data: StartLearningSessionRequest) => {
    const response = await axiosInstance.post<LearningSessionDetail>('/api/learning/sessions', data)
    return response.data
  },

  getSession: async (sessionId: number) => {
    const response = await axiosInstance.get<LearningSessionDetail>(`/api/learning/sessions/${sessionId}`)
    return response.data
  },

  submitReview: async (sessionId: number, data: SubmitReviewRequest) => {
    const response = await axiosInstance.post<SubmitReviewResponse>(
      `/api/learning/sessions/${sessionId}/reviews`,
      data
    )
    return response.data
  },

  getHistory: async (page = 1, pageSize = 12) => {
    const response = await axiosInstance.get<PagedResult<ReviewHistoryItem>>(
      `/api/learning/history?page=${page}&pageSize=${pageSize}`
    )
    return response.data
  },
}
