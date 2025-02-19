export interface SessionActivity {
  id: number
  name: string
  score: number
  duration: number
}

export interface Session {
  id: number
  type: 'practice' | 'quiz' | 'review'
  status: 'in_progress' | 'completed' | 'abandoned'
  created_at: string
  completed_at?: string
  stats: {
    total_items: number
    completed_items: number
    correct_items: number
    success_rate: number
  }
}

export interface SessionStats {
  currentStreak: number
  bestStreak: number
  totalSessions: number
  averageScore: number
  averageDuration: number
}

export interface SessionAttempt {
  id: number
  session_id: number
  word_id: number
  correct: boolean
  created_at: string
  response_time_ms: number
}

export interface SessionCreate {
  type: 'practice' | 'quiz' | 'review'
  group_ids: number[]
  practice_direction: 'forward' | 'reverse'
}

export interface SessionUpdate {
  status: 'completed' | 'abandoned'
  stats?: {
    completed_items: number
    correct_items: number
  }
}

export interface SessionResponse extends Session {
  current_item?: {
    id: number
    prompt: string
    answer: string
  }
  next_review_date?: string
}

export interface SessionListResponse {
  items: Session[]
  total: number
  page: number
  size: number
} 