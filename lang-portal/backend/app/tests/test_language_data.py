from app.db.database import SessionLocal
from app.models.language import Language
from app.models.language_pair import LanguagePair

def create_test_language_data():
    db = SessionLocal()
    try:
        # Create languages
        languages = [
            Language(code="en", name="English"),
            Language(code="es", name="Spanish"),
            Language(code="de", name="German"),
            Language(code="fr", name="French")
        ]
        db.add_all(languages)
        db.commit()

        # Print added languages
        print("\nAdded languages:")
        for lang in languages:
            print(f"- {lang.code}: {lang.name} (ID: {lang.id})")

        # Create language pairs
        pairs = [
            LanguagePair(
                source_language_id=languages[0].id,  # English
                target_language_id=languages[1].id   # Spanish
            ),
            LanguagePair(
                source_language_id=languages[0].id,  # English
                target_language_id=languages[2].id   # German
            ),
            LanguagePair(
                source_language_id=languages[1].id,  # Spanish
                target_language_id=languages[0].id   # English
            )
        ]
        db.add_all(pairs)
        db.commit()

        # Print added language pairs
        print("\nAdded language pairs:")
        for pair in pairs:
            print(f"- {pair.source_language.code} → {pair.target_language.code} (ID: {pair.id})")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_language_data() 