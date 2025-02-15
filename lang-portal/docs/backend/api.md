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