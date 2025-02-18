# Database Models

## Vocabulary Model

### Structure
```python
class Vocabulary(Base):
    __tablename__ = "vocabularies"
    
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, unique=True, index=True)
    translation = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Fields Explanation
- `id`: Unique identifier for each vocabulary entry
  - Auto-incrementing primary key
  - Indexed for faster lookups

- `word`: The vocabulary word to learn
  - Must be unique
  - Indexed for faster searches
  - String type with no length limit

- `translation`: The word's translation
  - Can contain multiple translations
  - Not indexed (not used for searching)
  - String type with no length limit

- `created_at`: Timestamp of creation
  - Automatically set on record creation
  - Includes timezone information
  - Uses database server time

- `updated_at`: Last modification timestamp
  - Automatically updated on record changes
  - Includes timezone information
  - NULL if never modified

### Indexes
1. Primary Key index on `id`
2. Unique index on `word`

### Usage
```python
# Create new vocabulary
vocab = Vocabulary(word="hello", translation="hola")

# Update translation
vocab.translation = "hola, salut"
# updated_at will automatically update

# Query example
vocab = db.query(Vocabulary).filter(Vocabulary.word == "hello").first()
``` 