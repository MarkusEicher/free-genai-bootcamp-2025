from datetime import datetime, timedelta, date, UTC
from typing import Dict, List, Optional
from sqlalchemy import func, distinct, and_, case
from sqlalchemy.orm import Session

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.schemas.dashboard import (
    DashboardStats,
    DashboardProgress,
    LatestSession,
    StudyStreak
)

class DashboardService:
    @staticmethod
    def get_stats(db: Session) -> DashboardStats:
        """Get dashboard statistics."""
        # Get total sessions
        total_sessions = db.query(ActivitySession).count()

        # Calculate overall success rate
        if total_sessions > 0:
            success_rate_query = db.query(
                func.round(
                    func.sum(case((SessionAttempt.is_correct, 1), else_=0)) * 1.0 / 
                    func.count(SessionAttempt.id),
                    3
                )
            ).scalar()
            success_rate = float(success_rate_query or 0.0)
        else:
            success_rate = 0.0

        # Get active activities count (activities with at least one session)
        active_activities = db.query(Activity)\
            .join(ActivitySession)\
            .distinct()\
            .count()

        # Calculate study streak
        streak = DashboardService._calculate_study_streak(db)

        return DashboardStats(
            success_rate=success_rate,
            study_sessions_count=total_sessions,
            active_activities_count=active_activities,
            study_streak=streak
        )

    @staticmethod
    def get_progress(db: Session) -> DashboardProgress:
        """Get learning progress statistics."""
        # Get total vocabulary items with attempts
        total_items = db.query(distinct(SessionAttempt.vocabulary_id))\
            .join(ActivitySession)\
            .join(Activity)\
            .count()

        if total_items == 0:
            return DashboardProgress(
                total_items=0,
                studied_items=0,
                mastered_items=0,
                progress_percentage=0.0
            )

        # Get studied items (at least one attempt)
        studied_items = total_items

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

        sessions = db.query(ActivitySession)\
            .join(Activity)\
            .order_by(ActivitySession.start_time.desc())\
            .limit(limit)\
            .all()

        return [
            LatestSession(
                activity_name=session.activity.name,
                activity_type=session.activity.type,
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
            
        # Convert date strings to datetime.date objects
        dates = [datetime.strptime(str(date[0]), '%Y-%m-%d').date() for date in session_dates]
        
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