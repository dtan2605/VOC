import axiosInstance from './axiosInstance'
import type {
  Band,
  BandRequest,
  PagedResult,
  Topic,
  TopicRequest,
  VocabularyItem,
  VocabularyRequest,
} from '../types/vocabulary'

interface VocabularyQuery {
  search?: string
  topicId?: number
  bandId?: number
  page?: number
  pageSize?: number
}

const buildParams = (query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  })

  return params
}

export const vocabApi = {
  getVocabulary: async (query: VocabularyQuery) => {
    const params = buildParams({ ...query })
    const suffix = params.toString()
    const response = await axiosInstance.get<PagedResult<VocabularyItem>>(
      suffix ? `/api/vocabulary?${suffix}` : '/api/vocabulary'
    )
    return response.data
  },

  getVocabularyById: async (id: number) => {
    const response = await axiosInstance.get<VocabularyItem>(`/api/vocabulary/${id}`)
    return response.data
  },

  createVocabulary: async (data: VocabularyRequest) => {
    const response = await axiosInstance.post<VocabularyItem>('/api/vocabulary', data)
    return response.data
  },

  updateVocabulary: async (id: number, data: VocabularyRequest) => {
    const response = await axiosInstance.put<VocabularyItem>(`/api/vocabulary/${id}`, data)
    return response.data
  },

  deleteVocabulary: async (id: number) => {
    await axiosInstance.delete(`/api/vocabulary/${id}`)
  },

  getBands: async (search = '', page = 1, pageSize = 30) => {
    const params = buildParams({ search, page, pageSize })
    const suffix = params.toString()
    const response = await axiosInstance.get<PagedResult<Band>>(suffix ? `/api/bands?${suffix}` : '/api/bands')
    return response.data
  },

  createBand: async (data: BandRequest) => {
    const response = await axiosInstance.post<Band>('/api/bands', data)
    return response.data
  },

  updateBand: async (id: number, data: BandRequest) => {
    const response = await axiosInstance.put<Band>(`/api/bands/${id}`, data)
    return response.data
  },

  deleteBand: async (id: number) => {
    await axiosInstance.delete(`/api/bands/${id}`)
  },

  getTopics: async (search = '', page = 1, pageSize = 30) => {
    const params = buildParams({ search, page, pageSize })
    const suffix = params.toString()
    const response = await axiosInstance.get<PagedResult<Topic>>(suffix ? `/api/topics?${suffix}` : '/api/topics')
    return response.data
  },

  createTopic: async (data: TopicRequest) => {
    const response = await axiosInstance.post<Topic>('/api/topics', data)
    return response.data
  },

  updateTopic: async (id: number, data: TopicRequest) => {
    const response = await axiosInstance.put<Topic>(`/api/topics/${id}`, data)
    return response.data
  },

  deleteTopic: async (id: number) => {
    await axiosInstance.delete(`/api/topics/${id}`)
  },
}
