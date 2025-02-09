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

### Study Activities (/study-activities)
- Header
  - Page Title
- Study Activities List/Grid
  - Typing Tutor Card
  - Multiple Choice Card
  - Flashcards Card
  - (Other activity types)

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

### Settings (/settings)
- Theme Selector
  - Light/Dark Mode Dropdown
- Reset History Button
- Other Configuration Options
  - (Expandable based on requirements)

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
