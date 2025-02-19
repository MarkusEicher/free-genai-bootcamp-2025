from app.db.database import SessionLocal
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.models.language_pair import LanguagePair

def create_test_vocabulary_groups():
    db = SessionLocal()
    try:
        # Get English-Spanish language pair
        en_es = db.query(LanguagePair).filter(
            LanguagePair.source_language.has(code='en'),
            LanguagePair.target_language.has(code='es')
        ).first()

        if not en_es:
            print("Error: English-Spanish language pair not found")
            return

        # Create vocabulary groups
        groups = [
            VocabularyGroup(
                name="Basic Phrases",
                description="Essential everyday phrases",
                language_pair_id=en_es.id
            ),
            VocabularyGroup(
                name="Numbers",
                description="Cardinal numbers 1-100",
                language_pair_id=en_es.id
            ),
            VocabularyGroup(
                name="Food and Drinks",
                description="Common food and beverage vocabulary",
                language_pair_id=en_es.id
            )
        ]
        db.add_all(groups)
        db.commit()

        # Print created groups
        print("\nCreated vocabulary groups:")
        for group in groups:
            print(f"- {group.name}: {group.description} (ID: {group.id})")

        # Add some vocabulary to groups
        basic_vocab = [
            Vocabulary(word="hello", translation="hola", language_pair_id=en_es.id),
            Vocabulary(word="goodbye", translation="adiós", language_pair_id=en_es.id),
            Vocabulary(word="please", translation="por favor", language_pair_id=en_es.id)
        ]
        db.add_all(basic_vocab)
        db.commit()

        # Add vocabularies to "Basic Phrases" group
        groups[0].vocabularies.extend(basic_vocab)
        db.commit()

        print("\nAdded vocabularies to Basic Phrases group:")
        for vocab in basic_vocab:
            print(f"- {vocab.word}: {vocab.translation}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_vocabulary_groups() 