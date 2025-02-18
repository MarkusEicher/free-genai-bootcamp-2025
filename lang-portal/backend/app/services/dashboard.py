from datetime import datetime, timedelta, date, UTC
from typing import Dict, List, Optional
from sqlalchemy import func, distinct, and_, case, select, Index
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.declarative import declared_attr

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.schemas.dashboard import (
    DashboardStats,
    DashboardProgress,
    LatestSession,
    StudyStreak
)

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
        # Get all stats in a single query with optimized joins
        stats = db.query(
            func.count(distinct(ActivitySession.id)).label('total_sessions'),
            func.round(
                func.sum(case((SessionAttempt.is_correct, 1), else_=0)) * 1.0 /
                func.nullif(func.count(SessionAttempt.id), 0),
                3
            ).label('success_rate'),
            func.count(distinct(Activity.id)).label('active_activities'),
            func.count(distinct(VocabularyGroup.id)).label('active_groups')
        ).select_from(ActivitySession)\
        .outerjoin(SessionAttempt)\
        .outerjoin(Activity)\
        .outerjoin(Activity.vocabulary_groups.of_type(VocabularyGroup))\
        .first()

        # Calculate study streak
        streak = DashboardService._calculate_study_streak(db)

        return DashboardStats(
            success_rate=float(stats.success_rate or 0.0),
            study_sessions_count=stats.total_sessions,
            active_activities_count=stats.active_activities,
            active_groups_count=stats.active_groups,
            study_streak=streak
        )

    @staticmethod
    def get_progress(db: Session) -> DashboardProgress:
        """Get learning progress statistics."""
        # Get total vocabulary items from all groups used in activities
        total_items_subq = select([func.count(distinct(Vocabulary.id))])\
            .select_from(Activity)\
            .join(Activity.vocabulary_groups)\
            .join(VocabularyGroup.vocabularies)\
            .scalar_subquery()

        total_items = db.execute(total_items_subq).scalar() or 0

        if total_items == 0:
            return DashboardProgress(
                total_items=0,
                studied_items=0,
                mastered_items=0,
                progress_percentage=0.0
            )

        # Get studied items (at least one attempt)
        studied_items = db.query(func.count(distinct(SessionAttempt.vocabulary_id)))\
            .scalar() or 0

        # Calculate mastery (items with success rate >= 80%)
        mastery_threshold = 0.8
        mastered_items = db.query(
            func.count(distinct(SessionAttempt.vocabulary_id))
        ).filter(
            SessionAttempt.vocabulary_id.in_(
                db.query(SessionAttempt.vocabulary_id)
                .group_by(SessionAttempt.vocabulary_id)
                .having(
                    func.sum(case((SessionAttempt.is_correct, 1), else_=0)) * 1.0 /
                    func.count(SessionAttempt.id) >= mastery_threshold
                )
            )
        ).scalar() or 0

        # Calculate progress percentage
        progress_percentage = round((studied_items / total_items * 100), 1) if total_items > 0 else 0.0

        return DashboardProgress(
            total_items=total_items,
            studied_items=studied_items,
            mastered_items=mastered_items,
            progress_percentage=progress_percentage
        )

    @staticmethod
    def get_latest_sessions(
        db: Session,
        limit: int = 5
    ) -> List[LatestSession]:
        """Get the most recent study sessions."""
        if limit < 1 or limit > 50:
            limit = 5

        # Get sessions with activity and group information
        sessions = db.query(ActivitySession)\
            .join(Activity)\
            .options(
                joinedload(ActivitySession.activity)
                .joinedload(Activity.vocabulary_groups)
            )\
            .order_by(ActivitySession.start_time.desc())\
            .limit(limit)\
            .all()

        return [
            LatestSession(
                activity_name=session.activity.name,
                activity_type=session.activity.type,
                practice_direction=session.activity.practice_direction,
                group_count=len(session.activity.vocabulary_groups),
                start_time=session.start_time,
                end_time=session.end_time,
                success_rate=session.success_rate,
                correct_count=session.correct_count,
                incorrect_count=session.incorrect_count
            )
            for session in sessions
        ]

    @staticmethod
    def _calculate_study_streak(db: Session) -> StudyStreak:
        """Calculate the current and longest study streaks."""
        today = datetime.now(UTC).date()
        
        # Get all session dates ordered by date
        session_dates = db.query(
            func.date(ActivitySession.start_time).label('date')
        ).distinct().order_by(
            func.date(ActivitySession.start_time).desc()
        ).all()
        
        if not session_dates:
            return StudyStreak(current_streak=0, longest_streak=0)
            
        # Convert date strings to datetime.date objects and ensure timezone awareness
        dates = [
            datetime.strptime(str(date[0]), '%Y-%m-%d').replace(tzinfo=UTC).date()
            for date in session_dates
        ]
        
        # Calculate current streak
        current_streak = 0
        for i, date in enumerate(dates):
            if i == 0:
                if (today - date).days > 1:  # No activity today or yesterday
                    break
            elif (dates[i-1] - date).days > 1:  # Gap between dates
                break
            current_streak += 1
            
        # Calculate longest streak
        longest_streak = 0
        current = 1
        for i in range(1, len(dates)):
            if (dates[i-1] - dates[i]).days == 1:
                current += 1
            else:
                longest_streak = max(longest_streak, current)
                current = 1
        longest_streak = max(longest_streak, current, current_streak)
            
        return StudyStreak(
            current_streak=current_streak,
            longest_streak=longest_streak
        )

# Create service instance
dashboard_service = DashboardService()