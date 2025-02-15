# API Documentation

## Base Endpoints
- **/** - Redirects to API documentation
- **/health** - Health check endpoint
- **/docs** - Swagger UI documentation

## Vocabulary Endpoints

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