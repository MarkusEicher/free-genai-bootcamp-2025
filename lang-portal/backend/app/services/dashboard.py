from datetime import datetime, timedelta, date, UTC
from typing import Dict, List, Optional
from sqlalchemy import func, distinct, and_, case, select, Index, text
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.declarative import declared_attr
import logging

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.schemas.dashboard import (
    DashboardStats,
    DashboardProgress,
    LatestSession,
    StudyStreak
)

logger = logging.getLogger(__name__)

# Add performance indexes
@declared_attr
def __table_args__(cls):
    return (
        Index('ix_session_attempts_is_correct', 'is_correct'),
        Index('ix_activity_sessions_start_time', 'start_time'),
        Index('ix_activity_sessions_activity_id', 'activity_id'),
    )

class DashboardService:
    @staticmethod
    def get_stats(db: Session) -> DashboardStats:
        """Get dashboard statistics."""
        try:
            # First check if we have any sessions at all
            session_count = db.query(func.count(ActivitySession.id)).scalar() or 0
            
            # Get success rate from attempts
            success_rate_query = text("""
                SELECT COALESCE(
                    ROUND(
                        CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) /
                        NULLIF(COUNT(*), 0),
                        3
                    ),
                    0
                ) as success_rate
                FROM session_attempts
                WHERE is_correct IS NOT NULL
            """)
            success_rate = float(db.execute(success_rate_query).scalar() or 0.0)
            success_rate = max(0.0, min(1.0, success_rate))  # Ensure between 0 and 1

            # Get activity and group counts
            counts_query = text("""
                SELECT 
                    COUNT(DISTINCT a.id) as active_activities,
                    COUNT(DISTINCT vg.id) as active_groups
                FROM activities a
                LEFT JOIN activity_vocabulary_group avg ON a.id = avg.activity_id
                LEFT JOIN vocabulary_groups vg ON avg.group_id = vg.id
            """)
            counts = db.execute(counts_query).first()
            
            # Calculate study streak
            streak = DashboardService._calculate_study_streak(db)

            stats = DashboardStats(
                success_rate=success_rate,
                study_sessions_count=max(0, session_count),
                active_activities_count=max(0, int(counts.active_activities or 0)),
                active_groups_count=max(0, int(counts.active_groups or 0)),
                study_streak=streak
            )
            
            logger.debug(f"Generated stats: {stats.dict()}")
            return stats

        except Exception as e:
            logger.error(f"Error in get_stats: {str(e)}")
            return DashboardStats(
                success_rate=0.0,
                study_sessions_count=0,
                active_activities_count=0,
                active_groups_count=0,
                study_streak=StudyStreak(current_streak=0, longest_streak=0)
            )

    @staticmethod
    def get_progress(db: Session) -> DashboardProgress:
        """Get learning progress statistics."""
        try:
            # Get total and studied items counts
            counts_query = text("""
                WITH total_items AS (
                    SELECT COUNT(DISTINCT v.id) as total
                    FROM vocabularies v
                    JOIN vocabulary_group_association vga ON v.id = vga.vocabulary_id
                    JOIN vocabulary_groups vg ON vga.group_id = vg.id
                    JOIN activity_vocabulary_group avg ON vg.id = avg.group_id
                ),
                studied_items AS (
                    SELECT COUNT(DISTINCT vocabulary_id) as studied
                    FROM session_attempts
                    WHERE vocabulary_id IS NOT NULL
                ),
                mastered_items AS (
                    SELECT COUNT(DISTINCT vocabulary_id) as mastered
                    FROM (
                        SELECT 
                            vocabulary_id,
                            CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) / 
                            NULLIF(COUNT(*), 0) as success_rate
                        FROM session_attempts
                        WHERE vocabulary_id IS NOT NULL
                        GROUP BY vocabulary_id
                        HAVING success_rate >= 0.8
                    ) as mastered_vocab
                )
                SELECT 
                    COALESCE((SELECT total FROM total_items), 0) as total_items,
                    COALESCE((SELECT studied FROM studied_items), 0) as studied_items,
                    COALESCE((SELECT mastered FROM mastered_items), 0) as mastered_items
            """)
            
            result = db.execute(counts_query).first()
            
            total_items = max(0, int(result.total_items))
            studied_items = max(0, min(total_items, int(result.studied_items)))
            mastered_items = max(0, min(studied_items, int(result.mastered_items)))
            
            # Calculate progress percentage
            progress_percentage = min(100.0, max(0.0,
                round((studied_items / total_items * 100), 1) if total_items > 0 else 0.0
            ))

            progress = DashboardProgress(
                total_items=total_items,
                studied_items=studied_items,
                mastered_items=mastered_items,
                progress_percentage=progress_percentage
            )
            
            logger.debug(f"Generated progress: {progress.dict()}")
            return progress

        except Exception as e:
            logger.error(f"Error in get_progress: {str(e)}")
            return DashboardProgress(
                total_items=0,
                studied_items=0,
                mastered_items=0,
                progress_percentage=0.0
            )

    @staticmethod
    def get_latest_sessions(
        db: Session,
        limit: int = 5
    ) -> List[LatestSession]:
        """Get the most recent study sessions."""
        try:
            # Validate and bound the limit
            limit = max(1, min(50, limit))

            # Use a simpler query with explicit joins and validation
            query = text("""
                SELECT 
                    COALESCE(a.name, 'Unknown Activity') as activity_name,
                    COALESCE(a.type, 'unknown') as activity_type,
                    COALESCE(a.practice_direction, 'both') as practice_direction,
                    s.start_time,
                    s.end_time,
                    COALESCE(s.correct_count, 0) as correct_count,
                    COALESCE(s.incorrect_count, 0) as incorrect_count,
                    COALESCE(
                        ROUND(
                            CAST(s.correct_count AS FLOAT) / 
                            NULLIF(s.correct_count + s.incorrect_count, 0),
                            3
                        ),
                        0
                    ) as success_rate,
                    COALESCE(
                        (
                            SELECT COUNT(*)
                            FROM activity_vocabulary_group avg
                            WHERE avg.activity_id = a.id
                        ),
                        0
                    ) as group_count
                FROM sessions s
                JOIN activities a ON s.activity_id = a.id
                WHERE s.start_time IS NOT NULL
                ORDER BY s.start_time DESC
                LIMIT :limit
            """)

            result = db.execute(query, {"limit": limit})
            
            sessions = []
            for row in result:
                try:
                    # Ensure all numeric values are within bounds
                    correct_count = max(0, int(row.correct_count))
                    incorrect_count = max(0, int(row.incorrect_count))
                    success_rate = max(0.0, min(1.0, float(row.success_rate)))
                    group_count = max(0, int(row.group_count))
                    
                    # Ensure we have valid timestamps
                    start_time = row.start_time or datetime.now(UTC)
                    end_time = row.end_time if row.end_time and row.end_time > start_time else None
                    
                    session = LatestSession(
                        activity_name=str(row.activity_name),
                        activity_type=str(row.activity_type),
                        practice_direction=str(row.practice_direction),
                        group_count=group_count,
                        start_time=start_time,
                        end_time=end_time,
                        success_rate=success_rate,
                        correct_count=correct_count,
                        incorrect_count=incorrect_count
                    )
                    sessions.append(session)
                except Exception as e:
                    logger.error(f"Error processing session row: {str(e)}")
                    continue

            logger.debug(f"Retrieved {len(sessions)} latest sessions")
            return sessions

        except Exception as e:
            logger.error(f"Error in get_latest_sessions: {str(e)}")
            return []

    @staticmethod
    def _calculate_study_streak(db: Session) -> StudyStreak:
        """Calculate the current and longest study streaks."""
        try:
            today = datetime.now(UTC).date()
            
            # Get distinct session dates in UTC
            streak_query = text("""
                WITH RECURSIVE dates AS (
                    SELECT DISTINCT DATE(start_time AT TIME ZONE 'UTC') as session_date
                    FROM sessions
                    WHERE start_time IS NOT NULL
                    ORDER BY session_date DESC
                ),
                streak_calc AS (
                    SELECT 
                        session_date,
                        session_date = CURRENT_DATE as is_today,
                        1 as streak_length,
                        1 as streak_group
                    FROM dates
                    WHERE session_date = (SELECT MAX(session_date) FROM dates)
                    
                    UNION ALL
                    
                    SELECT 
                        d.session_date,
                        false as is_today,
                        CASE 
                            WHEN s.session_date - d.session_date = 1 
                            THEN s.streak_length + 1
                            ELSE 1
                        END as streak_length,
                        CASE 
                            WHEN s.session_date - d.session_date = 1 
                            THEN s.streak_group
                            ELSE s.streak_group + 1
                        END as streak_group
                    FROM dates d
                    JOIN streak_calc s ON d.session_date < s.session_date
                )
                SELECT 
                    COALESCE(
                        MAX(CASE WHEN is_today OR session_date = CURRENT_DATE - 1 
                            THEN streak_length ELSE 0 END),
                        0
                    ) as current_streak,
                    COALESCE(MAX(streak_length), 0) as longest_streak
                FROM streak_calc
            """)
            
            result = db.execute(streak_query).first()
            
            streak = StudyStreak(
                current_streak=max(0, int(result.current_streak)),
                longest_streak=max(0, int(result.longest_streak))
            )
            
            logger.debug(f"Calculated streak: {streak.dict()}")
            return streak

        except Exception as e:
            logger.error(f"Error in _calculate_study_streak: {str(e)}")
            return StudyStreak(current_streak=0, longest_streak=0)

# Create service instance
dashboard_service = DashboardService()