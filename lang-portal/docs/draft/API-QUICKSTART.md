# Language Learning Portal API Quick Start Guide

## Getting Started

This guide provides practical examples for common use cases of the Language Learning Portal API.

## Prerequisites

- HTTP client (curl, Postman, or your preferred tool)
- Base URL: `http://localhost:8000/api/v1`

## Common Workflows

### 1. Setting Up a Practice Activity

```bash
# 1. Create a vocabulary group
curl -X POST http://localhost:8000/api/v1/vocabulary-groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Verbs",
    "description": "Common verbs for beginners",
    "language_pair_id": 1
  }'

# 2. Add vocabulary to the group
curl -X POST http://localhost:8000/api/v1/vocabulary-groups/1/vocabularies \
  -H "Content-Type: application/json" \
  -d '{
    "vocabulary_ids": [1, 2, 3]
  }'

# 3. Create an activity using the group
curl -X POST http://localhost:8000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d '{
    "type": "flashcard",
    "name": "Basic Verbs Practice",
    "description": "Practice common verbs",
    "practice_direction": "forward",
    "vocabulary_group_ids": [1]
  }'
```

### 2. Running a Practice Session

```bash
# 1. Create a new session
curl -X POST http://localhost:8000/api/v1/activities/1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2024-03-21T10:00:00Z"
  }'

# 2. Get practice items
curl -X GET http://localhost:8000/api/v1/activities/1/practice

# 3. Record attempts
curl -X POST http://localhost:8000/api/v1/sessions/1/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "vocabulary_id": 1,
    "is_correct": true,
    "response_time_ms": 1500
  }'

# 4. Check progress
curl -X GET http://localhost:8000/api/v1/activities/1/progress
```

### 3. Managing Vocabulary Groups

```bash
# 1. List all groups
curl -X GET http://localhost:8000/api/v1/vocabulary-groups

# 2. Get group details
curl -X GET http://localhost:8000/api/v1/vocabulary-groups/1

# 3. Update group
curl -X PUT http://localhost:8000/api/v1/vocabulary-groups/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Verbs Group",
    "description": "Updated description"
  }'
```

## Example Application Flow

Here's a complete example of how to implement a flashcard practice session:

```javascript
// 1. Create a practice session
async function startPracticeSession(activityId) {
  const response = await fetch(`/api/v1/activities/${activityId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_time: new Date().toISOString()
    })
  });
  return await response.json();
}

// 2. Get practice items
async function getPracticeItems(activityId) {
  const response = await fetch(`/api/v1/activities/${activityId}/practice`);
  return await response.json();
}

// 3. Record an attempt
async function recordAttempt(sessionId, vocabularyId, isCorrect, responseTimeMs) {
  const response = await fetch(`/api/v1/sessions/${sessionId}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vocabulary_id: vocabularyId,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs
    })
  });
  return await response.json();
}

// 4. Check progress
async function checkProgress(activityId) {
  const response = await fetch(`/api/v1/activities/${activityId}/progress`);
  return await response.json();
}

// Example usage
async function runPracticeSession() {
  // Start session
  const session = await startPracticeSession(1);
  
  // Get practice items
  const { items } = await getPracticeItems(1);
  
  // Practice each item
  for (const item of items) {
    const startTime = Date.now();
    
    // Show word to user and get their answer
    // ... user interface logic here ...
    
    const responseTime = Date.now() - startTime;
    
    // Record the attempt
    await recordAttempt(
      session.id,
      item.vocabulary_id,
      userAnswerCorrect,
      responseTime
    );
  }
  
  // Show progress
  const progress = await checkProgress(1);
  console.log('Session complete! Progress:', progress);
}
```

## Common Patterns

### Error Handling

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### Progress Monitoring

```javascript
function calculateMasteryLevel(progress) {
  return progress.map(item => ({
    vocabularyId: item.vocabulary_id,
    mastered: item.success_rate >= 0.8,
    needsPractice: item.success_rate < 0.6,
    attempts: item.attempt_count
  }));
}
```

## Tips and Best Practices

1. **Session Management:**
   - Create a new session for each practice attempt
   - Record all attempts, even incorrect ones
   - Keep sessions focused on specific learning goals

2. **Error Handling:**
   - Always check for error responses
   - Handle 404s gracefully for missing resources
   - Validate input before sending to API

3. **Progress Tracking:**
   - Monitor success rates regularly
   - Use progress data to adjust difficulty
   - Consider both recent and overall performance

4. **Performance:**
   - Cache practice items locally when appropriate
   - Batch progress checks rather than checking after each attempt
   - Use appropriate error handling and loading states

## Troubleshooting

### Common Issues

1. **404 Not Found**
   - Check that all IDs exist before using them
   - Verify vocabulary belongs to the specified group

2. **400 Bad Request**
   - Ensure all required fields are provided
   - Validate vocabulary belongs to activity's groups

3. **Progress Not Updating**
   - Verify attempts are being recorded correctly
   - Check session ID is valid
   - Ensure activity ID matches the session

## Need Help?

- Check the full API documentation in `API-DOCUMENTATION.md`
- Refer to the test suite for more examples
- Submit issues for bugs or feature requests 