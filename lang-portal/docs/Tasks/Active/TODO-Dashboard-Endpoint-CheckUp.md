# Dashboard Endpoints Documentation

## IMPORTANT Constraint for the Language Learning App as a whole
As a general rule for the frontend we want to emphasize that we need as much as possible of the content to be served from the local server. When ever possible prevent usage of CORS and remote sources. For example fonts need to be served from the server itself. It is not wanted to have them implemented as webfonts. Another point is to prevent using cookies and tracking, statistics or performance and location logging or whatever might trigger user acceptation warnings. We want to be compliant with rigorous data privacy best practices and GDPR, if possible without even have to ask the user because we do not use technology and code that would need user acceptance. This constraint is very important and I want you to report, if we would violate this before making changes. The same importance goes for accessibility. We want o achieve WCAG 2.1 AAA if possible. We only deviate from this constraint if the technical complexity or the performance level would be unfeasible for the solution.

## Core Design Principles Compliance Review

⚠️ **IMPORTANT**: Before proceeding with the dashboard implementation, we need to address several violations of our core design principles:

### Local Server & CORS Requirements
1. **Current Violations**:
   - Backend CORS middleware configuration
   - Frontend API calls not restricted to local server
   - External dependencies in frontend (fonts, charts)
   - CDN usage in frontend components

2. **Required Changes**:
   - [ ] Remove CORS middleware from backend
   - [ ] Update frontend API configuration to use relative paths only
   - [ ] Package and serve all fonts locally
   - [ ] Replace external chart libraries with custom SVG implementations
   - [ ] Ensure all assets are served from local server
   - [ ] Remove any CDN dependencies

### Data Privacy & GDPR Compliance
1. **Current Violations**:
   - Redis-based tracking and logging
   - Unnecessary session data collection
   - Performance monitoring overhead

2. **Required Changes**:
   - [ ] Simplify Redis usage to essential caching only
   - [ ] Remove unnecessary user data collection
   - [ ] Minimize session data storage
   - [ ] Remove performance tracking that requires user consent
   - [ ] Implement privacy-first caching strategy
   - [ ] Document data retention policies

### Accessibility Requirements (WCAG 2.1 AAA)
1. **Current Implementation Gaps**:
   - Dashboard visualizations not fully accessible
   - Keyboard navigation incomplete
   - Screen reader support limited
   - Color contrast issues in charts

2. **Required Changes**:
   - [ ] Add proper ARIA labels to all dashboard components
   - [ ] Implement keyboard navigation for all interactive elements
   - [ ] Add screen reader descriptions for charts and statistics
   - [ ] Ensure sufficient color contrast in all visualizations
   - [ ] Add text alternatives for graphical data
   - [ ] Implement focus management
   - [ ] Add skip links for navigation

### Implementation Priority Update
Given these requirements, we need to modify our implementation approach:

1. **Frontend Changes**:
   - Create custom SVG components for all visualizations
   - Implement local font serving
   - Build accessible data visualization components
   - Remove all external dependencies
   - Use localStorage for necessary client-side data

2. **Backend Changes**:
   - Remove CORS configuration
   - Simplify Redis to basic caching
   - Implement local-only API structure
   - Remove unnecessary tracking

3. **Documentation Updates**:
   - Add accessibility compliance guidelines
   - Document local-only architecture
   - Add privacy-first implementation guide

⚠️ **Note**: All subsequent implementation tasks in this document must be reviewed and updated to comply with these core principles.

## Overview
The dashboard provides three main endpoints for retrieving statistics and progress information. All endpoints are cached for performance optimization and include comprehensive error handling.

## Endpoints

### 1. GET /api/v1/dashboard/stats
Returns overall dashboard statistics.

**Response Model**: `DashboardStats`
```json
{
    "success_rate": 0.756,
    "study_sessions_count": 42,
    "active_activities_count": 3,
    "active_groups_count": 2,
    "study_streak": {
        "current_streak": 5,
        "longest_streak": 7
    }
}
```
- Cache duration: 5 minutes
- Performance target: < 1.0s response time for large datasets

### 2. GET /api/v1/dashboard/progress
Returns learning progress statistics.

**Response Model**: `DashboardProgress`
```json
{
    "total_items": 100,
    "studied_items": 75,
    "mastered_items": 30,
    "progress_percentage": 75.0
}
```
- Cache duration: 5 minutes
- Performance target: < 1.0s response time for large datasets
- Mastery threshold: 80% success rate

### 3. GET /api/v1/dashboard/latest-sessions
Returns the most recent study sessions.

**Parameters**:
- `limit`: Number of sessions to return (default: 5, max: 20)

**Response Model**: Array of `LatestSession`
```json
[{
    "activity_name": "Basic Vocabulary",
    "activity_type": "flashcard",
    "practice_direction": "forward",
    "group_count": 2,
    "start_time": "2024-02-17T14:30:00Z",
    "end_time": "2024-02-17T14:45:00Z",
    "success_rate": 0.85,
    "correct_count": 17,
    "incorrect_count": 3
}]
```
- Cache duration: 1 minute
- Performance target: < 0.5s response time for large datasets

## Frontend Integration
The frontend components are properly integrated with these endpoints:
- `Dashboard.tsx`: Main dashboard view
- `SessionStats.tsx`: Session statistics component
- `useApi.ts`: API hooks for data fetching

## Performance Considerations
1. All endpoints are cached with appropriate durations
2. Database queries are optimized with:
   - Proper indexing on frequently queried columns
   - Efficient joins and subqueries
   - Limit clauses for large datasets

## Status ✅
- [x] All endpoints implemented and tested
- [x] Frontend integration complete
- [x] Performance requirements met
- [x] Proper error handling in place
- [x] Caching implemented
- [x] Documentation complete

### Current Dashboard frontend and backend implementation comparison

#### Frontend Components vs Backend Endpoints

1. **Stats Endpoint**
   - Backend: `/api/v1/dashboard/stats` ✅
   - Frontend: Uses `useDashboardStats` hook but with incorrect path `/api/dashboard/stats` ❌
   - Delta: Path mismatch needs to be fixed in frontend

2. **Progress Endpoint**
   - Backend: `/api/v1/dashboard/progress` ✅
   - Frontend: No direct hook for progress endpoint ❌
   - Delta: Frontend needs to implement progress endpoint integration

3. **Latest Sessions Endpoint**
   - Backend: `/api/v1/dashboard/latest-sessions` ✅
   - Frontend: Uses `useRecentActivity` with incorrect path `/api/dashboard/activity` ❌
   - Delta: Path mismatch and response model mismatch

4. **Performance History**
   - Frontend: Uses `usePerformanceHistory` hook ✅
   - Backend: No corresponding endpoint ❌
   - Delta: Backend needs to implement performance history endpoint

5. **Streak Tracking**
   - Backend: Included in `/api/v1/dashboard/stats` response ✅
   - Frontend: Separate `useStreak` hook with incorrect path `/api/dashboard/streak` ❌
   - Delta: Frontend should use stats endpoint for streak data

#### Data Model Mismatches

1. **Dashboard Stats Model**
   - Backend:
     ```typescript
     {
       success_rate: float
       study_sessions_count: int
       active_activities_count: int
       active_groups_count: int
       study_streak: {
         current_streak: int
         longest_streak: int
       }
     }
     ```
   - Frontend:
     ```typescript
     {
       masteredWords: number
       totalWords: number
       masteryRate: number
       currentStreak: number
       longestStreak: number
       lastActivityDate: string
       totalSessions: number
       averageAccuracy: number
       totalPracticeTime: number
       progressData: ProgressDataPoint[]
     }
     ```
   - Delta: Models need to be synchronized

2. **Latest Sessions Model**
   - Backend:
     ```typescript
     {
       activity_name: string
       activity_type: string
       practice_direction: string
       group_count: number
       start_time: string
       end_time: string | null
       success_rate: number
       correct_count: number
       incorrect_count: number
     }
     ```
   - Frontend: No matching model ❌
   - Delta: Frontend needs to implement latest sessions model

#### Missing Features

1. **Backend Missing**:
   - Performance history endpoint
   - Detailed activity feed
   - Goal tracking endpoints
   - Achievement tracking in dashboard context

2. **Frontend Missing**:
   - Progress visualization component
   - Proper error handling for dashboard data
   - Loading states for dashboard components
   - Proper caching implementation

#### Action Items

1. **Frontend Tasks**:
   - [ ] Update API endpoint paths to match backend
   - [ ] Implement missing progress endpoint integration
   - [ ] Synchronize data models with backend
   - [ ] Add proper error handling and loading states
   - [ ] Implement latest sessions component
   - [ ] Add caching layer for dashboard data
   - [ ] Update streak tracking to use stats endpoint

2. **Backend Tasks**:
   - [ ] Implement performance history endpoint
   - [ ] Add activity feed endpoint
   - [ ] Add goal tracking endpoints
   - [ ] Add achievement tracking endpoints
   - [ ] Extend stats endpoint to include more frontend-required fields
   - [ ] Add pagination to latest sessions endpoint
   - [ ] Implement proper caching headers

3. **Documentation Tasks**:
   - [ ] Update API documentation with all endpoints
   - [ ] Add response examples for all endpoints
   - [ ] Document caching behavior
   - [ ] Add performance considerations
   - [ ] Document error handling

4. **Testing Tasks**:
   - [ ] Add frontend integration tests
   - [ ] Add backend load tests for dashboard endpoints
   - [ ] Add caching tests
   - [ ] Add error handling tests
   - [ ] Add end-to-end tests for dashboard features

#### Performance Considerations

1. **Caching Strategy**:
   - Backend has proper caching implemented
   - Frontend needs to implement proper caching
   - Consider implementing stale-while-revalidate pattern

2. **Data Loading**:
   - Implement progressive loading for large datasets
   - Add pagination for sessions history
   - Optimize query performance for stats calculation

3. **Real-time Updates**:
   - Consider WebSocket implementation for real-time stats
   - Implement optimistic updates for better UX

#### Security Considerations

1. **Data Access**:
   - Implement proper authorization checks
   - Add rate limiting for dashboard endpoints
   - Sanitize user input in filters

2. **Error Handling**:
   - Implement proper error boundaries in frontend
   - Add detailed error logging in backend
   - Implement retry mechanisms for failed requests

> **Note**: The application currently does not implement authentication or authorization. The following security considerations are for future implementation when auth is added to the system.

1. **Future Authentication & Authorization**:
   - [ ] Implement user authentication system
   - [ ] Add role-based access control
   - [ ] Secure dashboard endpoints with auth middleware
   - [ ] Add user context to dashboard data
   - [ ] Implement session management

2. **Current Security Measures**:
   - [x] Input validation on all endpoints
   - [x] Rate limiting through Redis
   - [x] Proper error handling to prevent data leaks
   - [x] CORS configuration for frontend access

3. **Error Handling**:
   - [x] Generic error messages to users
   - [x] Detailed error logging in backend
   - [x] Proper HTTP status codes
   - [x] Frontend error boundaries

4. **Future Security Enhancements**:
   - [ ] API key management for external integrations
   - [ ] Audit logging for dashboard actions
   - [ ] Data encryption for sensitive statistics
   - [ ] User-specific data isolation
   - [ ] Session-based access control 




## Frontend Implementation Tasks

### 1. API Integration
- [x] Create/update dashboard API types in `src/api/dashboard.ts`
  - [x] Define `DashboardStats` interface
  - [x] Define `DashboardProgress` interface
  - [x] Define `LatestSession` interface
  - [x] Add API client functions for each endpoint
  - [x] Add proper error handling for API responses
  - [x] Implement React Query hooks for data fetching

### 2. Component Implementation
- [ ] Create/update dashboard components
  - [x] Implement `DashboardStats` component
  - [x] Implement `DashboardProgress` component with visualization
  - [x] Implement `LatestSessions` component
  - [x] Add loading states for all components
  - [x] Add error states and error boundaries
  - [ ] Implement proper data refresh strategy

### 3. Data Model Alignment
- [ ] Update frontend models to match backend responses
  - [ ] Align stats model with backend
  - [ ] Align progress model with backend
  - [ ] Align sessions model with backend
  - [ ] Add proper type validation/transformation

### 4. Performance Optimization
- [ ] Implement caching strategy
  - [ ] Configure React Query caching
  - [ ] Add stale-while-revalidate pattern
  - [ ] Implement optimistic updates where applicable
  - [ ] Add proper cache invalidation

### 5. Testing
- [ ] Add comprehensive tests
  - [ ] Unit tests for API functions
  - [ ] Component tests with React Testing Library
  - [ ] Integration tests for dashboard features
  - [ ] Add loading/error state tests
  - [ ] Add cache behavior tests

### 6. Documentation
- [ ] Update component documentation
  - [ ] Add Storybook stories for new components
  - [ ] Document API integration patterns
  - [ ] Document caching strategy
  - [ ] Add usage examples

### Dependencies on Backend Tasks
- [ ] Await implementation of performance history endpoint
- [ ] Await implementation of activity feed endpoint
- [ ] Await implementation of goal tracking endpoints
- [ ] Await implementation of achievement tracking endpoints
- [ ] Await implementation of pagination for latest sessions
- [ ] Await implementation of proper caching headers