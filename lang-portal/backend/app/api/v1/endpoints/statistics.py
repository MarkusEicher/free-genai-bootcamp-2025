from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.progress import VocabularyProgress
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.schemas.statistics import (
    VocabularyStats,
    GroupStats,
    OverallStats
)

router = APIRouter()

@router.get("/statistics/vocabulary/{vocab_id}", response_model=VocabularyStats)
def get_vocabulary_statistics(vocab_id: int, db: Session = Depends(get_db)):
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    progress = vocab.progress
    
    return {
        "vocabulary_id": vocab_id,
        "word": vocab.word,
        "translation": vocab.translation,
        "correct_attempts": progress.correct_attempts if progress else 0,
        "incorrect_attempts": progress.incorrect_attempts if progress else 0,
        "success_rate": vocab.success_rate,
        "mastered": progress.mastered if progress else False,
        "last_reviewed": progress.last_reviewed if progress else None
    }

@router.get("/statistics/group/{group_id}", response_model=GroupStats)
def get_group_statistics(group_id: int, db: Session = Depends(get_db)):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    
    # Calculate group statistics
    vocab_count = len(group.vocabularies)
    mastered_count = sum(1 for v in group.vocabularies if v.progress and v.progress.mastered)
    
    # Calculate average success rate
    success_rates = [v.success_rate for v in group.vocabularies if v.progress]
    avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
    
    return {
        "group_id": group_id,
        "name": group.name,
        "total_vocabulary": vocab_count,
        "mastered_vocabulary": mastered_count,
        "completion_rate": (mastered_count / vocab_count * 100) if vocab_count > 0 else 0,
        "average_success_rate": avg_success_rate
    }

@router.get("/statistics/overall", response_model=OverallStats)
def get_overall_statistics(db: Session = Depends(get_db)):
    # Total counts
    total_vocab = db.query(Vocabulary).count()
    total_started = db.query(VocabularyProgress).count()
    total_mastered = db.query(VocabularyProgress).filter(
        VocabularyProgress.mastered == True
    ).count()
    
    # Average success rate
    avg_success = db.query(func.avg(
        (VocabularyProgress.correct_attempts * 100.0) /
        (VocabularyProgress.correct_attempts + VocabularyProgress.incorrect_attempts)
    )).scalar() or 0.0
    
    # Recent activity
    recent_progress = db.query(VocabularyProgress)\
        .order_by(VocabularyProgress.last_reviewed.desc())\
        .limit(5)\
        .all()
    
    return {
        "total_vocabulary": total_vocab,
        "vocabulary_started": total_started,
        "vocabulary_mastered": total_mastered,
        "completion_rate": (total_mastered / total_vocab * 100) if total_vocab > 0 else 0,
        "average_success_rate": round(avg_success, 2),
        "recent_activity": [
            {
                "vocabulary_id": p.vocabulary_id,
                "word": p.vocabulary.word,
                "success_rate": p.success_rate,
                "last_reviewed": p.last_reviewed
            } for p in recent_progress
        ]
    } 