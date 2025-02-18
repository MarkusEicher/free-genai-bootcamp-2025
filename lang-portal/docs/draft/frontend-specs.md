# Frontend Specs

## Routes & Components Structure

### Dashboard (/dashboard)
- Layout Components
  - Sidebar Navigation
  - Header
    - Page Title
    - Start Studying Button
- Main Content
  - Last Study Session Card
    - Session Title
    - Date
    - Results (correct/wrong counts)
    - View Group Link
  - Study Progress Card
    - Total Words Counter
    - Mastery Progress Bar
    - Progress Percentage
  - Quick Stats Card
    - Success Rate
    - Study Sessions Count
    - Active Groups Count
    - Study Streak
## Dashboard Endpoints
GET /api/dashboard/stats
GET /api/dashboard/progress
GET /api/dashboard/latest-session


### Study Activities (/study-activities)
- Header
  - Page Title
- Study Activities List/Grid
  - Typing Tutor Card
  - Multiple Choice Card
  - Flashcards Card
  - (Other activity types)
## Study Activities Endpoints
GET /api/activities/list
GET /api/activities/start/{activityId}
POST /api/activities/complete
GET /api/activities/progress/{activityId}


### Words (/words)
- Header
  - Page Title
  - Add Word Button
- Words List
  - Word Items
    - Word Text
    - Translation
    - Edit/Delete Actions
- Search/Filter Controls
## Words Endpoints
GET /api/words/list
POST /api/words/create
PUT /api/words/{wordId}
DELETE /api/words/{wordId}
GET /api/words/search
GET /api/words/{wordId}


### Word Groups (/word-groups)
- Header
  - Page Title
  - Create Group Button
- Groups List
  - Group Items
    - Group Name
    - Word Count
    - Progress Indicator
    - Edit/Delete Actions
- Search/Filter Controls
## Word Groups Endpoints
GET /api/groups/list
POST /api/groups/create
PUT /api/groups/{groupId}
DELETE /api/groups/{groupId}
GET /api/groups/{groupId}/words
POST /api/groups/{groupId}/words
DELETE /api/groups/{groupId}/words/{wordId}
GET /api/groups/search


### Sessions (/sessions)
- Header
  - Page Title
- Sessions History List
  - Session Items
    - Date/Time
    - Activity Type
    - Performance Stats
    - Duration
- Filter/Sort Controls
## Sessions Endpoints
GET /api/sessions/list
GET /api/sessions/{sessionId}
GET /api/sessions/filter
DELETE /api/sessions/{sessionId}


### Settings (/settings)
- Theme Selector
  - Light/Dark Mode Dropdown
- Reset History Button
- Other Configuration Options
  - (Expandable based on requirements)
## Settings Endpoints
GET /api/settings
PUT /api/settings/theme
POST /api/settings/reset-history


## Shared Components
- Navigation Sidebar
  - Logo/Brand
  - Nav Links
  - Active State Indicators
- Header Layout
  - Page Title
  - Action Buttons
- Loading States
- Error States
- Success/Failure Notifications
