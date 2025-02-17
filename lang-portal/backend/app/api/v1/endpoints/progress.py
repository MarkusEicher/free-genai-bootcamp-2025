from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, UTC
from app.db.database import get_db
from app.models.progress import VocabularyProgress
from app.models.vocabulary import Vocabulary
from app.schemas.progress import (
    VocabularyProgress as ProgressSchema,
    ProgressUpdate,
    ProgressRead,
    ProgressCreate
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
        progress = VocabularyProgress(
            vocabulary_id=vocab_id,
            correct_attempts=0,
            incorrect_attempts=0
        )
        db.add(progress)
        db.commit()
    
    # Update attempts based on correct/incorrect
    if update.correct_attempts is not None:
        progress.correct_attempts = update.correct_attempts
    if update.incorrect_attempts is not None:
        progress.incorrect_attempts = update.incorrect_attempts
    if update.mastered is not None:
        progress.mastered = update.mastered
    
    progress.last_reviewed = datetime.utcnow()
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

@router.post("/progress/", response_model=ProgressRead)
def create_progress(progress: ProgressCreate, db: Session = Depends(get_db)):
    # Verify vocabulary exists
    vocabulary = db.query(Vocabulary).filter(Vocabulary.id == progress.vocabulary_id).first()
    if not vocabulary:
        raise HTTPException(
            status_code=404,
            detail={"msg": "Vocabulary not found"}
        )
    
    # Check for existing progress
    existing = db.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id == progress.vocabulary_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"msg": "Progress already exists for this vocabulary"}
        )
    
    # Validate attempts
    if progress.correct_attempts < 0 or progress.incorrect_attempts < 0:
        raise HTTPException(
            status_code=422,
            detail={"msg": "Attempts cannot be negative"}
        )
    
    db_progress = VocabularyProgress(**progress.model_dump())
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress

@router.get("/progress/{progress_id}", response_model=ProgressRead)
def get_progress(progress_id: int, db: Session = Depends(get_db)):
    progress = db.query(VocabularyProgress).filter(VocabularyProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail={"msg": "Progress not found"})
    return progress

@router.put("/progress/{progress_id}", response_model=ProgressRead)
def update_progress(
    progress_id: int,
    progress_update: ProgressUpdate,
    db: Session = Depends(get_db)
):
    progress = db.query(VocabularyProgress).filter(VocabularyProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail={"msg": "Progress not found"})

    # Validate attempts
    new_correct = progress_update.correct_attempts if progress_update.correct_attempts is not None else progress.correct_attempts
    new_incorrect = progress_update.incorrect_attempts if progress_update.incorrect_attempts is not None else progress.incorrect_attempts
    
    if new_correct < 0 or new_incorrect < 0:
        raise HTTPException(status_code=422, detail={"msg": "Attempts cannot be negative"})
    
    # Check for inconsistent state
    if progress_update.mastered and (new_correct / (new_correct + new_incorrect) < 0.8):
        raise HTTPException(
            status_code=422,
            detail={"msg": "Cannot mark as mastered with success rate below 80%"}
        )

    for field, value in progress_update.model_dump(exclude_unset=True).items():
        setattr(progress, field, value)
    
    progress.last_reviewed = datetime.now(UTC)
    db.commit()
    db.refresh(progress)
    return progress