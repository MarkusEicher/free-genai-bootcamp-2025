from app.db.database import SessionLocal
from app.models.vocabulary import Vocabulary
from app.models.progress import VocabularyProgress
from datetime import datetime, timedelta
import random

def create_test_progress_data():
    db = SessionLocal()
    try:
        # Get all vocabularies
        vocabularies = db.query(Vocabulary).all()
        
        if not vocabularies:
            print("No vocabularies found. Please run vocabulary test data first.")
            return

        print("\nCreating progress data for vocabularies:")
        
        for vocab in vocabularies:
            # Simulate different levels of progress
            total_attempts = random.randint(5, 20)
            correct_ratio = random.uniform(0.6, 0.95)  # 60% to 95% success rate
            correct_attempts = int(total_attempts * correct_ratio)
            incorrect_attempts = total_attempts - correct_attempts
            
            # Create progress entry
            progress = VocabularyProgress(
                vocabulary_id=vocab.id,
                correct_attempts=correct_attempts,
                incorrect_attempts=incorrect_attempts,
                last_reviewed=datetime.utcnow() - timedelta(days=random.randint(0, 14)),
                mastered=correct_ratio > 0.9 and total_attempts >= 10
            )
            
            db.add(progress)
            print(f"- {vocab.word}: {correct_attempts}/{total_attempts} correct " +
                  f"({correct_ratio*100:.1f}% success rate)" +
                  f" {'[MASTERED]' if progress.mastered else ''}")
        
        db.commit()
        
        # Print summary statistics
        total_progress = db.query(VocabularyProgress).count()
        mastered = db.query(VocabularyProgress).filter(
            VocabularyProgress.mastered == True
        ).count()
        
        print(f"\nSummary:")
        print(f"Total vocabularies with progress: {total_progress}")
        print(f"Mastered vocabularies: {mastered}")
        print(f"Mastery rate: {(mastered/total_progress*100 if total_progress > 0 else 0):.1f}%")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_progress_data() 