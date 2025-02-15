from app.db.database import SessionLocal
from app.models.vocabulary import Vocabulary

def create_test_data():
    db = SessionLocal()
    try:
        # Create test vocabulary entries
        test_words = [
            Vocabulary(word="hello", translation="hola"),
            Vocabulary(word="world", translation="mundo"),
            Vocabulary(word="good morning", translation="buenos días"),
            Vocabulary(word="thank you", translation="gracias")
        ]
        
        # Add to database
        db.add_all(test_words)
        db.commit()
        
        # Verify data was added
        words = db.query(Vocabulary).all()
        print("\nAdded vocabulary entries:")
        for word in words:
            print(f"- {word.word}: {word.translation}")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data() 