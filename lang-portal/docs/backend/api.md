# API Documentation

## Base Endpoints
- **/** - Redirects to API documentation
- **/health** - Health check endpoint
- **/docs** - Swagger UI documentation

## Language Management

### Languages
#### List Languages
- **GET /api/v1/languages/**
- **Response:** List of languages
```json
[
  {
    "id": 1,
    "code": "en",
    "name": "English"
  },
  {
    "id": 2,
    "code": "es",
    "name": "Spanish"
  }
]
```

#### Get Language
- **GET /api/v1/languages/{language_id}**
- **Response:** Single language
```json
{
  "id": 1,
  "code": "en",
  "name": "English"
}
```

#### Create Language
- **POST /api/v1/languages/**
- **Body:**
```json
{
  "code": "fr",
  "name": "French"
}
```

### Language Pairs
#### List Language Pairs
- **GET /api/v1/language-pairs/**
- **Response:** List of language pairs with related language details
```json
[
  {
    "id": 1,
    "source_language_id": 1,
    "target_language_id": 2,
    "source_language": {
      "id": 1,
      "code": "en",
      "name": "English"
    },
    "target_language": {
      "id": 2,
      "code": "es",
      "name": "Spanish"
    }
  }
]
```

#### Get Language Pair
- **GET /api/v1/language-pairs/{pair_id}**
- **Response:** Single language pair with related languages

#### Create Language Pair
- **POST /api/v1/language-pairs/**
- **Body:**
```json
{
  "source_language_id": 1,
  "target_language_id": 2
}
```

## Vocabulary Management

### List Vocabularies
- **GET /vocabularies/**
- **Parameters:**
  - `skip` (int, default: 0): Records to skip
  - `limit` (int, default: 10, max: 100): Records per page
- **Response:** List of vocabulary items

### Search Vocabularies
- **GET /vocabularies/search/**
- **Parameters:**
  - `query` (string): Search term for words/translations
  - `skip` (int, default: 0): Records to skip
  - `limit` (int, default: 10, max: 100): Records per page
- **Response:** List of matching vocabulary items

### Create Vocabulary
- **POST /vocabularies/**
- **Body:**
  ```json
  {
    "word": "string",
    "translation": "string"
  }
  ```

### Get Vocabulary
- **GET /vocabularies/{vocab_id}**
- **Parameters:**
  - `vocab_id` (int): Vocabulary ID
- **Response:** Single vocabulary item

### Update Vocabulary
- **PUT /vocabularies/{vocab_id}**
- **Parameters:**
  - `vocab_id` (int): Vocabulary ID
- **Body:**
  ```json
  {
    "word": "string (optional)",
    "translation": "string (optional)"
  }
  ```

### Delete Vocabulary
- **DELETE /vocabularies/{vocab_id}**
- **Parameters:**
  - `vocab_id` (int): Vocabulary ID
- **Response:** No content (204)

## Vocabulary Groups

### List Vocabulary Groups
- **GET /api/v1/vocabulary-groups/**
- **Parameters:**
  - `language_pair_id` (optional): Filter by language pair
  - `skip` (optional): Number of records to skip
  - `limit` (optional): Number of records to return
- **Response:**
```json
[
  {
    "id": 1,
    "name": "Basic Phrases",
    "description": "Essential everyday phrases",
    "language_pair_id": 1,
    "language_pair": {
      "id": 1,
      "source_language": {"code": "en", "name": "English"},
      "target_language": {"code": "es", "name": "Spanish"}
    }
  }
]
```

### Get Vocabulary Group
- **GET /api/v1/vocabulary-groups/{group_id}**
- **Response:** Group details with vocabularies
```json
{
  "id": 1,
  "name": "Basic Phrases",
  "description": "Essential everyday phrases",
  "language_pair_id": 1,
  "language_pair": {
    "id": 1,
    "source_language": {"code": "en", "name": "English"},
    "target_language": {"code": "es", "name": "Spanish"}
  },
  "vocabularies": [
    {
      "id": 1,
      "word": "hello",
      "translation": "hola"
    }
  ]
}
```

### Create Vocabulary Group
- **POST /api/v1/vocabulary-groups/**
- **Body:**
```json
{
  "name": "Basic Phrases",
  "description": "Essential everyday phrases",
  "language_pair_id": 1
}
```

### Update Vocabulary Group
- **PUT /api/v1/vocabulary-groups/{group_id}**
- **Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Add Vocabulary to Group
- **POST /api/v1/vocabulary-groups/{group_id}/vocabularies/{vocab_id}**
- **Response:** Success message

### Remove Vocabulary from Group
- **DELETE /api/v1/vocabulary-groups/{group_id}/vocabularies/{vocab_id}**
- **Response:** Success message

## Learning Progress and Statistics

### Progress Tracking
#### Record Progress
- **POST /api/v1/vocabulary/{vocab_id}/progress**
- **Body:**
```json
{
  "correct": true
}
```
- **Response:** Updated progress information

#### Get Vocabulary Progress
- **GET /api/v1/vocabulary/{vocab_id}/progress**
- **Response:** Progress details for specific vocabulary

### Statistics

#### Vocabulary Statistics
- **GET /api/v1/statistics/vocabulary/{vocab_id}**
- **Response:**
```json
{
  "vocabulary_id": 1,
  "word": "hello",
  "translation": "hola",
  "correct_attempts": 8,
  "incorrect_attempts": 2,
  "success_rate": 80.0,
  "mastered": false,
  "last_reviewed": "2024-01-20T15:30:00Z"
}
```

#### Group Statistics
- **GET /api/v1/statistics/group/{group_id}**
- **Response:**
```json
{
  "group_id": 1,
  "name": "Basic Phrases",
  "total_vocabulary": 20,
  "mastered_vocabulary": 15,
  "completion_rate": 75.0,
  "average_success_rate": 85.5
}
```

#### Overall Statistics
- **GET /api/v1/statistics/overall**
- **Response:**
```json
{
  "total_vocabulary": 100,
  "vocabulary_started": 80,
  "vocabulary_mastered": 40,
  "completion_rate": 40.0,
  "average_success_rate": 78.5,
  "recent_activity": [
    {
      "vocabulary_id": 1,
      "word": "hello",
      "success_rate": 80.0,
      "last_reviewed": "2024-01-20T15:30:00Z"
    }
  ]
}
```