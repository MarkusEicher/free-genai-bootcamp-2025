# Frontend API Integration Tasks

## Overview
The backend has been updated to enforce strict local-only, privacy-focused operation. This document outlines the required changes to align the frontend with these updates.

## Critical Changes Required

### 1. API Path Updates
Current mismatches that need to be fixed:

| Endpoint | Current Frontend Path | Required Backend Path |
|----------|---------------------|-------------------|
| Dashboard Stats | `/api/dashboard/stats` | `/api/v1/dashboard/stats` |
| Latest Sessions | `/api/dashboard/activity` | `/api/v1/dashboard/latest-sessions` |
| Streak Data | `/api/dashboard/streak` | Part of `/api/v1/dashboard/stats` |
| Progress Data | No endpoint | `/api/v1/dashboard/progress` |

#### Required Actions:
1. Update `src/hooks/useApi.ts`:
   ```typescript
   // Update base URL configuration
   const BASE_URL = '/api/v1';
   
   // Update endpoint constants
   const ENDPOINTS = {
     dashboardStats: `${BASE_URL}/dashboard/stats`,
     latestSessions: `${BASE_URL}/dashboard/latest-sessions`,
     progress: `${BASE_URL}/dashboard/progress`
   };
   ```

2. Remove separate streak endpoint and use data from stats endpoint
3. Implement progress endpoint integration
4. Update all API hooks to use new paths

### 2. Data Model Synchronization

#### Dashboard Stats Model
Current frontend model needs to be updated to match backend:
```typescript
// Current frontend model
interface DashboardStats {
  masteredWords: number;
  totalWords: number;
  masteryRate: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalSessions: number;
  averageAccuracy: number;
  totalPracticeTime: number;
  progressData: ProgressDataPoint[];
}

// Required backend model
interface DashboardStats {
  success_rate: number;
  study_sessions_count: number;
  active_activities_count: number;
  active_groups_count: number;
  study_streak: {
    current_streak: number;
    longest_streak: number;
  };
}
```

#### Latest Sessions Model
Implement missing model:
```typescript
interface LatestSession {
  activity_name: string;
  activity_type: string;
  practice_direction: string;
  group_count: number;
  start_time: string;
  end_time: string | null;
  success_rate: number;
  correct_count: number;
  incorrect_count: number;
}
```

### 3. External Dependencies Removal
1. Replace external fonts:
   - Move required fonts to `/public/fonts/`
   - Update font-face declarations
   - Remove Google Fonts
   
2. Replace CDN dependencies:
   - Download and serve chart libraries locally
   - Update build configuration
   - Remove external script tags

3. Update asset references:
   - Move all assets to local server
   - Update image and media paths
   - Implement proper caching headers

### 4. Error Handling Updates
1. Implement local-only error handling:
   ```typescript
   const handleApiError = (error: ApiError) => {
     if (error.status === 403) {
       return {
         message: 'This application only works locally',
         status: 403
       };
     }
     // Handle other errors...
   };
   ```

2. Add loading states for all components
3. Implement error boundaries
4. Add retry mechanisms for failed requests

### 0. Privacy & Local-First Implementation
- [ ] Remove all external dependencies
  - [x] Replace date-fns with native Date formatting
  - [ ] Package required fonts locally
  - [ ] Remove any CDN references from Tailwind config
- [x] Implement privacy-focused error handling
  - [x] Remove detailed error logging
  - [x] Implement local-only error tracking
  - [x] Remove any external error reporting
- [ ] Update build configuration
  - [ ] Configure bundler for local assets only
  - [ ] Remove any CDN optimization settings
  - [ ] Implement local font loading strategy

### 1. API Path Updates
- [x] Update base URL configuration to '/api/v1'
- [x] Implement privacy-focused fetchApi utility
- [x] Update dashboard API endpoints
- [x] Update sessions API endpoints
- [x] Update vocabulary API endpoints
- [x] Remove potentially sensitive endpoints
- [ ] Update remaining API endpoints

## Testing Requirements

### 1. Unit Tests
- Test all updated API paths
- Verify error handling
- Test offline functionality
- Validate data transformations

### 2. Integration Tests
- Test complete dashboard flow
- Verify data synchronization
- Test error scenarios
- Validate loading states

### 3. E2E Tests
- Test full application flow
- Verify offline capabilities
- Test error recovery
- Validate performance

## Security Considerations

### 1. Local Storage
- Only store essential data
- Implement proper cleanup
- Handle sensitive data appropriately

### 2. API Requests
- Implement request timeouts
- Add retry logic
- Handle rate limiting
- Validate responses

## Performance Requirements

### 1. Loading Strategy
- Implement progressive loading
- Add proper loading indicators
- Handle large datasets efficiently

### 2. Caching
- Implement local caching
- Add cache invalidation
- Handle stale data

## Dependencies
- Backend changes are complete
- All endpoints are tested and working
- Security headers are in place
- Local-only access is enforced

## Timeline
- Estimated effort: 2-3 days
- Priority: High
- Dependencies: None (backend ready)

## Support
For questions about the backend changes, contact the backend team lead.

## Verification
After implementing these changes:
1. All tests should pass
2. No external requests should be made
3. Application should work offline
4. No security warnings in console
5. All data models should be in sync

## Next Steps
1. Review this document
2. Create implementation tasks
3. Prioritize API path updates
4. Begin external dependency removal
5. Update data models
6. Implement error handling
7. Add required tests 