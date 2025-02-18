# API Workflows

This document outlines the key API workflows in the Language Learning Portal, showing how different components interact during common operations.

## Dashboard Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant Service
    participant DB

    Client->>API: GET /api/v1/dashboard/stats
    API->>Cache: Check stats cache
    alt Cache Hit
        Cache-->>API: Return cached stats
    else Cache Miss
        API->>Service: Get dashboard stats
        Service->>DB: Query user sessions
        DB-->>Service: Sessions data
        Service->>DB: Query activities
        DB-->>Service: Activities data
        Service->>Cache: Store computed stats
        Service-->>API: Return stats
    end
    API-->>Client: Return dashboard data
```

## Learning Session Workflow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant ActivityService
    participant ProgressService
    participant DB

    Client->>API: GET /api/v1/activities/{id}
    API->>ActivityService: Get activity
    ActivityService->>DB: Fetch activity data
    DB-->>ActivityService: Activity details
    ActivityService-->>API: Return activity
    API-->>Client: Activity data

    loop For Each Answer
        Client->>API: POST /api/v1/activities/{id}/answer
        API->>ActivityService: Process answer
        ActivityService->>ProgressService: Update progress
        ProgressService->>DB: Save progress
        DB-->>ProgressService: Confirm save
        ProgressService-->>ActivityService: Progress updated
        ActivityService-->>API: Answer processed
        API-->>Client: Result & next item
    end

    Client->>API: POST /api/v1/activities/{id}/complete
    API->>ActivityService: Complete session
    ActivityService->>DB: Save session results
    DB-->>ActivityService: Session saved
    ActivityService-->>API: Session completed
    API-->>Client: Final results
```

## Progress Tracking Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant ProgressService
    participant DB

    Client->>API: GET /api/v1/dashboard/progress
    API->>Cache: Check progress cache
    
    alt Cache Hit
        Cache-->>API: Return cached progress
    else Cache Miss
        API->>ProgressService: Get user progress
        ProgressService->>DB: Query vocabulary progress
        DB-->>ProgressService: Vocabulary data
        ProgressService->>DB: Query activity progress
        DB-->>ProgressService: Activity data
        ProgressService->>Cache: Store computed progress
        ProgressService-->>API: Return progress data
    end
    API-->>Client: Return progress stats
```

## Activity Management Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant ActivityService
    participant DB

    alt Create Activity
        Client->>API: POST /api/v1/activities
        API->>ActivityService: Create activity
        ActivityService->>DB: Store activity
        DB-->>ActivityService: Activity created
        ActivityService->>Cache: Invalidate activities cache
        ActivityService-->>API: Return new activity
        API-->>Client: Activity details
    end

    alt Update Activity
        Client->>API: PUT /api/v1/activities/{id}
        API->>ActivityService: Update activity
        ActivityService->>DB: Update record
        DB-->>ActivityService: Update confirmed
        ActivityService->>Cache: Invalidate related caches
        ActivityService-->>API: Return updated activity
        API-->>Client: Updated details
    end

    alt Delete Activity
        Client->>API: DELETE /api/v1/activities/{id}
        API->>ActivityService: Delete activity
        ActivityService->>DB: Mark as deleted
        DB-->>ActivityService: Deletion confirmed
        ActivityService->>Cache: Invalidate all related caches
        ActivityService-->>API: Confirm deletion
        API-->>Client: Success response
    end
```

## Vocabulary Management Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant VocabService
    participant DB

    alt Add Words
        Client->>API: POST /api/v1/vocabulary/batch
        API->>VocabService: Add vocabulary items
        VocabService->>DB: Store items
        DB-->>VocabService: Items stored
        VocabService->>Cache: Invalidate vocab cache
        VocabService-->>API: Return added items
        API-->>Client: New vocabulary items
    end

    alt Get Words by Category
        Client->>API: GET /api/v1/vocabulary?category={cat}
        API->>Cache: Check category cache
        alt Cache Hit
            Cache-->>API: Return cached words
        else Cache Miss
            API->>VocabService: Get vocabulary
            VocabService->>DB: Query by category
            DB-->>VocabService: Category words
            VocabService->>Cache: Store category results
            VocabService-->>API: Return words
        end
        API-->>Client: Vocabulary list
    end
```

## Session Analysis Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant AnalyticsService
    participant DB

    Client->>API: GET /api/v1/dashboard/latest-sessions
    API->>Cache: Check sessions cache
    
    alt Cache Hit
        Cache-->>API: Return cached sessions
    else Cache Miss
        API->>AnalyticsService: Get recent sessions
        AnalyticsService->>DB: Query sessions
        DB-->>AnalyticsService: Session data
        AnalyticsService->>DB: Query performance metrics
        DB-->>AnalyticsService: Performance data
        AnalyticsService->>Cache: Store computed results
        AnalyticsService-->>API: Return session analysis
    end
    API-->>Client: Session statistics
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant ErrorHandler
    participant Logger

    alt Client Error
        Client->>API: Invalid Request
        API->>ErrorHandler: Handle client error
        ErrorHandler->>Logger: Log error details
        ErrorHandler-->>API: Format error response
        API-->>Client: 4xx Error Response
    end

    alt Server Error
        Client->>API: Valid Request
        API->>ErrorHandler: Internal error occurs
        ErrorHandler->>Logger: Log error with stack trace
        Logger->>Logger: Save error details
        ErrorHandler-->>API: Format error response
        API-->>Client: 5xx Error Response
    end
```

## Cache Invalidation Flow

```mermaid
sequenceDiagram
    participant Service
    participant Cache
    participant EventBus
    participant Workers

    Service->>Cache: Invalidate specific key
    Service->>EventBus: Publish invalidation event
    EventBus->>Workers: Notify all workers
    Workers->>Cache: Clear related caches
    
    par Parallel Cache Updates
        Workers->>Cache: Rebuild dashboard cache
        Workers->>Cache: Rebuild progress cache
        Workers->>Cache: Rebuild session cache
    end
    
    Workers-->>EventBus: Cache rebuild complete
    EventBus-->>Service: Invalidation complete
```

These workflow diagrams illustrate the main API interactions in our system. They show:
- Data flow between components
- Caching strategies
- Error handling
- Cache invalidation patterns
- Service interactions

For specific endpoint details, refer to the API reference documentation. 