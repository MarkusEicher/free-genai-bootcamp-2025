from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.progress import VocabularyProgress
from app.models.vocabulary import Vocabulary
from app.schemas.progress import (
    VocabularyProgress as ProgressSchema,
    ProgressUpdate
)

router = APIRouter()

@router.post("/vocabulary/{vocab_id}/progress", response_model=ProgressSchema)
def record_progress(
    vocab_id: int,
    update: ProgressUpdate,
    db: Session = Depends(get_db)
):
    # Get or create progress record
    progress = db.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id == vocab_id
    ).first()
    
    if not progress:
        progress = VocabularyProgress(vocabulary_id=vocab_id)
        db.add(progress)
    
    # Update attempts
    if update.correct:
        progress.correct_attempts += 1
    else:
        progress.incorrect_attempts += 1
    
    # Update last reviewed
    progress.last_reviewed = datetime.utcnow()
    
    # Check if mastered (e.g., 90% success rate over at least 10 attempts)
    total_attempts = progress.correct_attempts + progress.incorrect_attempts
    if total_attempts >= 10 and progress.success_rate >= 90:
        progress.mastered = True
    
    db.commit()
    db.refresh(progress)
    return progress

@router.get("/vocabulary/{vocab_id}/progress", response_model=ProgressSchema)
def get_vocabulary_progress(vocab_id: int, db: Session = Depends(get_db)):
    progress = db.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id == vocab_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this vocabulary")
    return progress

@router.get("/progress/statistics")
def get_learning_statistics(db: Session = Depends(get_db)):
    # Get total statistics
    total_vocab = db.query(Vocabulary).count()
    total_progress = db.query(VocabularyProgress).count()
    mastered = db.query(VocabularyProgress).filter(
        VocabularyProgress.mastered == True
    ).count()
    
    # Calculate average success rate
    avg_success = db.query(func.avg(
        (VocabularyProgress.correct_attempts * 100.0) /
        (VocabularyProgress.correct_attempts + VocabularyProgress.incorrect_attempts)
    )).scalar() or 0.0
    
    return {
        "total_vocabulary": total_vocab,
        "vocabulary_started": total_progress,
        "vocabulary_mastered": mastered,
        "average_success_rate": round(avg_success, 2),
        "completion_percentage": round((mastered / total_vocab * 100) if total_vocab > 0 else 0, 2)
    }

@router.get("/progress/recent", response_model=List[ProgressSchema])
def get_recent_progress(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return db.query(VocabularyProgress)\
        .order_by(VocabularyProgress.last_reviewed.desc())\
        .limit(limit)\
        .all()