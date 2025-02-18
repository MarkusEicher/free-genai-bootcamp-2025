# Business Requirements and Constraints

> This document contains the ***BUSINESS*** requirements and constraints for the project. It is a living document that will be updated as we add more requirements. It is based on the specifications and requirements of the Language Learning Portal Application built during the ***free Exampro GenAI Bootcamp 2025***.

## Business Goal:

A language learning school wants to build a prototype of learning portal which will act as three things:
- Inventory of possible vocabulary that can be learned
- Act as a  Learning record store (LRS), providing correct and wrong score on practice vocabulary
- A unified launchpad to launch different learning apps


## Technical Requirements and Constraints

- The database will be SQLite3.
- The API will be built using OpenAPI (Swagger).
- The api will always return JSON objects.
- There is no need for authentication and authorization.
- Everything will be in the scope of a single user.


## API Endpoints

### Dashboard Endpoints
- GET /api/dashboard/stats
  - Returns: success rate, study sessions count, active groups count, study streak
- GET /api/dashboard/progress
  - Returns: total words, studied words count, mastery progress percentage
- GET /api/dashboard/latest-session
  - Returns: most recent study session details

### Study Activities Endpoints
- GET /api/activities/list
  - Returns: list of available study activities
- GET /api/activities/start/{activityId}
  - Returns: activity configuration and word set
- POST /api/activities/complete
  - Accepts: activity results (correct/incorrect answers)
  - Returns: session summary
- GET /api/activities/progress/{activityId}
  - Returns: progress stats for specific activity

### Words Endpoints
- GET /api/words/list
  - Returns: paginated list of words
- POST /api/words/create
  - Accepts: word data (text, translation)
- PUT /api/words/{wordId}
  - Accepts: updated word data
- DELETE /api/words/{wordId}
- GET /api/words/search
  - Accepts: search parameters
- GET /api/words/{wordId}
  - Returns: specific word details

### Word Groups Endpoints
- GET /api/groups/list
  - Returns: list of word groups
- POST /api/groups/create
  - Accepts: group name and configuration
- PUT /api/groups/{groupId}
  - Accepts: updated group data
- DELETE /api/groups/{groupId}
- GET /api/groups/{groupId}/words
  - Returns: words in specific group
- POST /api/groups/{groupId}/words
  - Accepts: word IDs to add to group
- DELETE /api/groups/{groupId}/words/{wordId}
- GET /api/groups/search
  - Accepts: search parameters

### Sessions Endpoints
- GET /api/sessions/list
  - Returns: paginated list of study sessions
- GET /api/sessions/{sessionId}
  - Returns: detailed session data
- GET /api/sessions/filter
  - Accepts: filter parameters
- DELETE /api/sessions/{sessionId}

### Settings Endpoints
- GET /api/settings
  - Returns: user settings
- PUT /api/settings/theme
  - Accepts: theme preference
- POST /api/settings/reset-history
  - Resets user study history


## Directory Structure

backend-next/
├── src/
│ ├── api/
│ │ ├── controllers/
│ │ │ ├── dashboardController.js
│ │ │ ├── activitiesController.js
│ │ │ ├── wordsController.js
│ │ │ ├── groupsController.js
│ │ │ ├── sessionsController.js
│ │ │ └── settingsController.js
│ │ ├── routes/
│ │ │ ├── dashboard.js
│ │ │ ├── activities.js
│ │ │ ├── words.js
│ │ │ ├── groups.js
│ │ │ ├── sessions.js
│ │ │ └── settings.js
│ │ └── middleware/
│ ├── db/
│ │ ├── models/
│ │ ├── migrations/
│ │ └── seeds/
│ ├── services/
│ └── utils/
├── tests/
├── words.db
└── config/


## Database Schema

### Words Table

sql:backend-specs.md
CREATE TABLE words (
id INTEGER PRIMARY KEY AUTOINCREMENT,
text TEXT NOT NULL,
translation TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### Groups Table
```sql
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### WordGroups Table (Junction Table)
```sql
CREATE TABLE word_groups (
    word_id INTEGER,
    group_id INTEGER,
    FOREIGN KEY (word_id) REFERENCES words(id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    PRIMARY KEY (word_id, group_id)
);
```

### Sessions Table
```sql:backend-specs.md
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_type TEXT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    group_id INTEGER,
    FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

### Settings Table
```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme TEXT DEFAULT 'light',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### WordProgress Table
```sql
CREATE TABLE word_progress (
    word_id INTEGER,
    correct_count INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    last_studied_at TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id),
    PRIMARY KEY (word_id)
);
```

This structure provides:
1. Clear API endpoint definitions with request/response details
2. Organized directory structure following Node.js/Express best practices
3. Comprehensive database schema with necessary tables and relationships
4. Support for all features shown in the frontend specs