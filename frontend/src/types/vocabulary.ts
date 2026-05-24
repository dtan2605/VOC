export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface Band {
  id: number
  name: string
  description: string
  sortOrder: number
  vocabularyCount: number
}

export interface Topic {
  id: number
  name: string
  description: string
  colorHex: string
  vocabularyCount: number
}

export interface VocabularyExample {
  id: number
  englishText: string
  vietnameseMeaning: string
  displayOrder: number
}

export interface VocabularyItem {
  id: number
  word: string
  meaning: string
  partOfSpeech: string
  pronunciation: string
  bandId: number
  bandName: string
  topicId: number
  topicName: string
  createdAt: string
  updatedAt: string
  examples: VocabularyExample[]
}

export interface BandRequest {
  name: string
  description: string
  sortOrder: number
}

export interface TopicRequest {
  name: string
  description: string
  colorHex: string
}

export interface VocabularyExampleRequest {
  englishText: string
  vietnameseMeaning: string
  displayOrder: number
}

export interface VocabularyRequest {
  word: string
  meaning: string
  partOfSpeech: string
  pronunciation: string
  bandId: number
  topicId: number
  examples: VocabularyExampleRequest[]
}
