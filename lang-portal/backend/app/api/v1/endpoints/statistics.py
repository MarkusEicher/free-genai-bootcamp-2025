from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.database import get_db
from app.models.progress import VocabularyProgress
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.schemas.statistics import (
    VocabularyStats,
    GroupStats,
    OverallStats,
    UserStatistics,
    LanguagePairStatistics,
    VocabularyGroupStatistics,
    RecentActivity
)
from datetime import datetime, timedelta, UTC
import re
from app.models.language_pair import LanguagePair

router = APIRouter()

@router.get("/vocabulary/{vocab_id}", response_model=VocabularyStats)
def get_vocabulary_statistics(vocab_id: int, db: Session = Depends(get_db)):
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"msg": "Vocabulary not found", "code": "vocabulary_not_found"}
        )
    
    progress = vocab.progress
    
    return VocabularyStats(
        vocabulary_id=vocab_id,
        word=vocab.word,
        translation=vocab.translation,
        correct_attempts=progress.correct_attempts if progress else 0,
        incorrect_attempts=progress.incorrect_attempts if progress else 0,
        success_rate=vocab.success_rate,
        mastered=progress.mastered if progress else False,
        last_reviewed=progress.last_reviewed if progress else None
    )

@router.get("/vocabulary-group/{group_id}", response_model=VocabularyGroupStatistics)
def get_vocabulary_group_statistics(
    group_id: int,
    db: Session = Depends(get_db)
) -> VocabularyGroupStatistics:
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"msg": "Vocabulary group not found", "code": "group_not_found"}
        )

    # Get all vocabularies in the group
    vocabularies = group.vocabularies
    total_vocabularies = len(vocabularies)
    
    # Get progress for all vocabularies in the group
    vocabulary_ids = [v.id for v in vocabularies]
    progress_records = db.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id.in_(vocabulary_ids)
    ).all() if vocabulary_ids else []

    # Calculate statistics
    mastered_count = sum(1 for p in progress_records if p.mastered)
    total_success_rate = sum(p.success_rate for p in progress_records) if progress_records else 0
    avg_success_rate = total_success_rate / len(progress_records) if progress_records else 0

    # Get recent activity
    recent_progress = db.query(VocabularyProgress).join(Vocabulary).filter(
        Vocabulary.id.in_(vocabulary_ids)
    ).order_by(VocabularyProgress.last_reviewed.desc()).limit(5).all() if vocabulary_ids else []

    return VocabularyGroupStatistics(
        group_id=group_id,
        total_vocabularies=total_vocabularies,
        mastered_vocabularies=mastered_count,
        completion_rate=mastered_count / total_vocabularies * 100 if total_vocabularies > 0 else 0,
        average_success_rate=avg_success_rate,
        recent_activity=recent_progress
    )

@router.get("/user/", response_model=UserStatistics)
def get_user_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Validate dates
    if start_date and not is_valid_date(start_date):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail={"msg": "Invalid start date format", "code": "invalid_date_format"}
        )
    if end_date and not is_valid_date(end_date):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail={"msg": "Invalid end date format", "code": "invalid_date_format"}
        )
    
    # Convert strings to datetime
    start = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
    end = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None
    
    # Validate date range
    if start and end and start > end:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail={"msg": "Start date must be before end date", "code": "invalid_date_range"}
        )
    if end and end > datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail={"msg": "End date cannot be in the future", "code": "future_date"}
        )
    
    # Build query
    query = db.query(VocabularyProgress)
    if start:
        query = query.filter(VocabularyProgress.last_reviewed >= start)
    if end:
        query = query.filter(VocabularyProgress.last_reviewed <= end)
    
    progress_records = query.all()
    total_vocab = db.query(Vocabulary).count()
    
    return UserStatistics(
        total_vocabularies=total_vocab,
        total_reviews=sum(p.correct_attempts + p.incorrect_attempts for p in progress_records),
        correct_reviews=sum(p.correct_attempts for p in progress_records),
        incorrect_reviews=sum(p.incorrect_attempts for p in progress_records),
        mastered_count=sum(1 for p in progress_records if p.mastered),
        average_success_rate=sum(p.success_rate for p in progress_records) / len(progress_records) if progress_records else 0
    )

@router.get("/language-pair/{pair_id}", response_model=LanguagePairStatistics)
def get_language_pair_statistics(pair_id: int, db: Session = Depends(get_db)):
    pair = db.query(LanguagePair).filter(LanguagePair.id == pair_id).first()
    if not pair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"msg": "Language pair not found", "code": "language_pair_not_found"}
        )
    
    # Calculate statistics
    stats = calculate_language_pair_statistics(db, pair)
    return stats

def is_valid_date(date_str: str) -> bool:
    pattern = r'^\d{4}-\d{2}-\d{2}$'
    if not re.match(pattern, date_str):
        return False
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def calculate_language_pair_statistics(db: Session, language_pair) -> LanguagePairStatistics:
    # Get all vocabulary for this pair
    vocabularies = language_pair.vocabularies
    
    # Calculate statistics
    total_vocab = len(vocabularies)
    mastered = sum(1 for v in vocabularies if v.progress and v.progress.mastered)
    success_rates = [v.success_rate for v in vocabularies if v.progress]
    avg_success = sum(success_rates) / len(success_rates) if success_rates else 0
    
    # Calculate vocabularies by status
    vocab_by_status = {
        "not_started": sum(1 for v in vocabularies if not v.progress),
        "in_progress": sum(1 for v in vocabularies if v.progress and not v.progress.mastered),
        "mastered": mastered
    }
    
    # Get recent activity
    recent = db.query(VocabularyProgress)\
        .join(Vocabulary)\
        .filter(Vocabulary.language_pair_id == language_pair.id)\
        .order_by(VocabularyProgress.last_reviewed.desc())\
        .limit(5)\
        .all()
    
    return LanguagePairStatistics(
        pair_id=language_pair.id,
        source_language=language_pair.source_language.name,
        target_language=language_pair.target_language.name,
        total_vocabularies=total_vocab,
        mastered_vocabulary=mastered,
        average_success_rate=avg_success,
        vocabularies_by_status=vocab_by_status,
        recent_activity=[
            RecentActivity(
                vocabulary_id=p.vocabulary_id,
                word=p.vocabulary.word,
                success_rate=p.success_rate,
                last_reviewed=p.last_reviewed
            ) for p in recent
        ]
    )