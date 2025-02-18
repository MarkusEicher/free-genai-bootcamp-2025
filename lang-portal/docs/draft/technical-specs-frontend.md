# Technical Specs for Frontend

## Business Goal: 
A language learning school wants to build a prototype of learning portal which will act as three things:
1. Inventory of possible vocabulary that can be learned
2. Act as a  Learning record store (LRS), providing correct and wrong score on practice vocabulary
3. A unified launchpad to launch different learning apps

## Core Functionalities


## Pages and Components

### Home Page / Dashboard at /

On the home page, the user will see Quick Stats, The Study progress and the last session details. It will also have a button to start a new session.

- Quick Stats will show the overall score of all sessions and the total number of sessions and the total number of activities. It will also show the streak of concurrent days of practice.

- The Study Progress will show the total number of words practiced and the total number of words remaining. It will also show the percentage of words practiced vs the total number of words available for practice.

- The Last Session details will show the details of the last session, including the date, the activities practiced and the scores of these activities. It will show a link to the sessions page with an overview of all sessions.

### Sessions Page at /sessions

This page will show a list of all sessions, including the date, the activities practiced and the combined score of all activities done in that session. It will also show a link to the session details page.  

#### Session Details Page at /sessions/:session_id

This page will show the details of a specific session, including the date, the activities practiced and the individual scores of these activities.

##### Activity Details Page at /sessions/:session_id/activities/:activity_id

This page will show the details of a specific activity, including the date, the vocabulary-groups and vocabulary items practiced and the individual scores of these vocabulary items.

### Study at /launchpad

This page will show a list of all activities that can be practiced. It will have links to the pages that will launch the activities.

### Vocabulary Inventory at /vocabulary

This page will show a list of all vocabulary that can be learned. It will have links to the vocabulary details page.

#### Vocabulary Details Page at /vocabulary/:vocabulary_id

This page will show the details of a specific vocabulary, including the word, the translation and the groups it belongs to.

### Vocabulary Groups at /vocabulary-groups

This page will show a list of all vocabulary groups, including the name of the group and the number of vocabulary items it contains. It will have links to the vocabulary details page.

### Settings at /settings

This page will show the settings of the like the theme and the notification settings. It will also have a button to reset the session history and all activity reviews.

## Frontend Requirements Analysis

## Core Application Type
- Single Page Application (SPA)
- Multiple route management needed
- No authentication required (single user)

## Page Requirements

### 1. Dashboard (Home Page)
**Key Features:**
- Quick Stats Display
  - Overall score visualization
  - Total sessions counter
  - Total activities counter
  - Practice streak tracking
- Study Progress Section
  - Words practiced counter
  - Words remaining counter
  - Progress percentage visualization
- Last Session Details
  - Date display
  - Activities list
  - Score display
- New Session Button
- Navigation to sessions overview

### 2. Sessions Overview
**Key Features:**
- List of all practice sessions
- Date display for each session
- Activities per session display
- Combined score display
- Navigation to session details
- Pagination or infinite scroll needed

### 3. Session Details
**Key Features:**
- Specific session information
- List of activities performed
- Individual activity scores
- Navigation to activity details

### 4. Study/Launchpad
**Key Features:**
- Activity list display
- Activity launch functionality
- Activity type categorization
- Launch URL handling

### 5. Vocabulary Management
**Key Features:**
- Vocabulary list display
- Vocabulary details view
- Group management
- Search/Filter functionality
- Pagination

### 6. Settings
**Key Features:**
- Theme toggle (dark/light)
- Reset functionality for session history

## Technical Requirements

### State Management Needs
- Session tracking
- Activity progress
- Theme preference (localStorage)
- Vocabulary lists
- Practice groups

### UI/UX Requirements
- Responsive design
- Theme switching capability
- Progress visualizations
- List management
- Modal/Dialog support

### Data Management
- API integration
- JSON handling
- Local storage usage
- Cache management

### Navigation Requirements
- Multiple routes
- Nested routes
- Back/Forward navigation
- Deep linking support

## Performance Considerations
- Quick initial load
- Smooth transitions
- Efficient data caching
- Optimized re-renders
- Lazy loading where appropriate

This analysis will help inform our frontend technology choice and architecture decisions.

# Frontend Technology Stack Decision

## Requirements Analysis Weight
1. **Critical Requirements**
   - SPA with multiple routes
   - State management for learning progress
   - Component reusability
   - JSON API integration
   - Theme switching
   - Performance optimization

2. **Important Considerations**
   - Development speed
   - Learning curve
   - Bundle size
   - Community support
   - Documentation quality

## Technology Options Analysis

### 1. React + Vite
**Pros:**
- Large ecosystem
- Extensive component libraries
- Strong community support
- Great documentation
- Easy state management options
- Vite provides fast development experience

**Cons:**
- Bundle size can grow
- Multiple ways to do things (decision fatigue)
- Additional routing library needed

**Required Additional Libraries:**
- React Router
- State Management (Context API sufficient)
- Styling (TailwindCSS recommended)

### 2. Vue 3
**Pros:**
- Built-in routing
- Built-in state management
- Smaller bundle size
- Clear documentation
- Single-file components

**Cons:**
- Smaller ecosystem than React
- Fewer UI component libraries
- Learning curve for template syntax

### 3. Svelte
**Pros:**
- Smallest bundle size
- Great performance
- Simple state management
- Less boilerplate

**Cons:**
- Smaller ecosystem
- Fewer developers available
- Less mature tooling
- Fewer learning resources

## Decision: React + Vite

### Rationale:
1. **Development Speed**
   - Large ecosystem of ready components
   - Extensive documentation
   - Many solutions for common problems

2. **Technical Fit**
   - Easy route management with React Router
   - Context API sufficient for state needs
   - Great support for lazy loading
   - Excellent TypeScript support

3. **Specific Solutions**
   - React Router for navigation
   - Context API for state management
   - TailwindCSS for styling
   - Vite for build tooling

### Additional Tools:

1. **Core Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "@vitejs/plugin-react": "^4.x"
  }
}
```

2. **Development Dependencies:**
```json
{
  "devDependencies": {
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

### Project Structure:
```
src/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── sessions/
│   ├── vocabulary/
│   └── settings/
├── pages/
├── context/
├── hooks/
├── utils/
├── api/
└── styles/
```

### Key Benefits for Our Use Case:
1. Fast development cycle
2. Easy component organization
3. Simple state management
4. Great routing solution
5. Excellent documentation
6. Large community support
7. Easy to find developers
8. Strong TypeScript support

This stack will provide the best balance of development speed, maintainability, and performance for our language learning portal.


