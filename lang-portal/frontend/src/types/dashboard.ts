export interface DashboardStats {
  success_rate: number;
  study_sessions_count: number;
  active_activities_count: number;
  active_groups_count: number;
  study_streak: {
    current_streak: number;
    longest_streak: number;
  };
}

export interface DashboardProgress {
  total_items: number;
  studied_items: number;
  mastered_items: number;
  progress_percentage: number;
}

export interface LatestSession {
  activity_name: string;
  activity_type: string;
  practice_direction: string;
  group_count: number;
  start_time: string;
  end_time: string | null;
  success_rate: number;
  correct_count: number;
  incorrect_count: number;
}

export interface ProgressDataPoint {
  date: string
  masteredWords: number
  totalWords: number
}

export interface Activity {
  id: number
  type: 'practice' | 'word_added' | 'group_created' | 'achievement_earned'
  description: string
  timestamp: string
  metadata: {
    wordId?: number
    groupId?: number
    achievementId?: number
    score?: number
  }
} 