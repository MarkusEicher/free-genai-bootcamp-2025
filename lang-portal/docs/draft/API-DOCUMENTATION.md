# Language Learning Portal API Documentation

## Overview

This document describes the API endpoints for the Language Learning Portal, with a focus on activities, vocabulary groups, and practice sessions.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

> Note: Authentication is not currently implemented. All endpoints are publicly accessible.

## Activities

### Create Activity

```http
POST /activities
```

Creates a new learning activity with associated vocabulary groups.

**Request Body:**
```json
{
  "type": "flashcard",
  "name": "Basic Verbs Practice",
  "description": "Practice common verbs",
  "practice_direction": "forward",
  "vocabulary_group_ids": [1, 2]
}
```

- `type`: Type of activity (e.g., "flashcard", "quiz")
- `name`: Activity name (required)
- `description`: Optional activity description
- `practice_direction`: Either "forward" (source → target) or "reverse" (target → source)
- `vocabulary_group_ids`: Array of vocabulary group IDs (at least one required)

**Response:** `200 OK`
```json
{
  "id": 1,
  "type": "flashcard",
  "name": "Basic Verbs Practice",
  "description": "Practice common verbs",
  "practice_direction": "forward",
  "created_at": "2024-03-21T10:00:00Z",
  "vocabulary_groups": [
    {
      "id": 1,
      "name": "Basic Verbs"
    },
    {
      "id": 2,
      "name": "Advanced Verbs"
    }
  ]
}
```

### Get Activity Practice Items

```http
GET /activities/{activity_id}/practice
```

Retrieves vocabulary items for practice in the specified direction.

**Response:** `200 OK`
```json
{
  "items": [
    {
      "word": "run",
      "translation": "laufen",
      "vocabulary_id": 1,
      "language_pair_id": 1
    }
  ]
}
```

### Record Practice Attempt

```http
POST /sessions/{session_id}/attempts
```

Records a practice attempt for a vocabulary item.

**Request Body:**
```json
{
  "vocabulary_id": 1,
  "is_correct": true,
  "response_time_ms": 1500
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "session_id": 1,
  "vocabulary_id": 1,
  "is_correct": true,
  "response_time_ms": 1500,
  "created_at": "2024-03-21T10:00:00Z"
}
```

### Get Activity Progress

```http
GET /activities/{activity_id}/progress
```

Retrieves progress statistics for all vocabulary items in the activity.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "activity_id": 1,
    "vocabulary_id": 1,
    "correct_count": 8,
    "attempt_count": 10,
    "success_rate": 0.8,
    "last_attempt": "2024-03-21T10:00:00Z"
  }
]
```

## Vocabulary Groups

### Create Vocabulary Group

```http
POST /vocabulary-groups
```

Creates a new vocabulary group.

**Request Body:**
```json
{
  "name": "Basic Verbs",
  "description": "Common verbs for beginners",
  "language_pair_id": 1
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Basic Verbs",
  "description": "Common verbs for beginners",
  "language_pair_id": 1,
  "vocabulary_count": 0,
  "created_at": "2024-03-21T10:00:00Z"
}
```

### Add Vocabularies to Group

```http
POST /vocabulary-groups/{group_id}/vocabularies
```

Adds vocabulary items to a group.

**Request Body:**
```json
{
  "vocabulary_ids": [1, 2, 3]
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Basic Verbs",
  "vocabularies": [
    {
      "id": 1,
      "word": "run",
      "translation": "laufen"
    }
  ]
}
```

## Practice Sessions

### Create Practice Session

```http
POST /activities/{activity_id}/sessions
```

Creates a new practice session for an activity.

**Request Body:**
```json
{
  "start_time": "2024-03-21T10:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "activity_id": 1,
  "start_time": "2024-03-21T10:00:00Z",
  "end_time": null,
  "created_at": "2024-03-21T10:00:00Z",
  "attempts": [],
  "correct_count": 0,
  "incorrect_count": 0,
  "success_rate": 0.0
}
```

## Error Responses

### Common Error Formats

#### Not Found (404)
```json
{
  "detail": "Resource not found"
}
```

#### Validation Error (400)
```json
{
  "code": "EMPTY_GROUP_IDS",
  "message": "At least one vocabulary group must be specified"
}
```

#### Invalid Vocabulary (400)
```json
{
  "code": "INVALID_VOCABULARY",
  "message": "Vocabulary does not belong to activity's groups"
}
```

## Important Notes

1. **Practice Direction:**
   - "forward": Shows source language word, expects target language translation
   - "reverse": Shows target language word, expects source language translation

2. **Progress Tracking:**
   - Progress is tracked per activity
   - Success rates are calculated based on attempts within the activity only
   - Each vocabulary item's progress is independent across different activities

3. **Vocabulary Groups:**
   - Groups can be used in multiple activities
   - Deleting a group is not allowed if it's used in any active activities
   - Vocabulary items can belong to multiple groups

4. **Sessions:**
   - Sessions track practice attempts for an activity
   - Multiple sessions can exist for the same activity
   - Session attempts are used to calculate progress statistics

## Best Practices

1. **Creating Activities:**
   - Group related vocabulary items into vocabulary groups
   - Assign appropriate groups to activities based on learning goals
   - Consider practice direction based on user proficiency

2. **Practice Sessions:**
   - Create a new session for each practice attempt
   - Record all attempts, both correct and incorrect
   - End sessions when practice is complete

3. **Progress Monitoring:**
   - Regularly check progress statistics
   - Use success rates to identify areas needing more practice
   - Consider both overall and recent performance

## Rate Limits

Currently, there are no rate limits implemented. However, please be mindful of request frequency to ensure optimal performance for all users.

## Changelog

### Version 1.0.0 (2024-03-21)
- Initial API release
- Activity-VocabularyGroup relationship implementation
- Progress tracking per activity
- Practice direction support 