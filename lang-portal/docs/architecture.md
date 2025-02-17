# System Architecture

This document provides a comprehensive overview of the Language Learning Portal's architecture, including system components, data flow, and interactions.

## System Overview

```mermaid
graph TB
    subgraph Client Layer
        Web[Web Browser]
        Mobile[Mobile Browser]
        PWA[Progressive Web App]
    end

    subgraph Frontend Layer
        React[React Application]
        Redux[State Management]
        PWACache[Service Worker Cache]
    end

    subgraph API Layer
        FastAPI[FastAPI Application]
        Auth[Authentication]
        Cache[Redis Cache]
    end

    subgraph Service Layer
        UserService[User Service]
        LearningService[Learning Service]
        ProgressService[Progress Service]
        ActivityService[Activity Service]
    end

    subgraph Data Layer
        DB[(SQLite Database)]
        Redis[(Redis Cache)]
        FileStore[(Static Files)]
    end

    Web --> React
    Mobile --> React
    PWA --> React
    React --> FastAPI
    React --> PWACache
    FastAPI --> Auth
    FastAPI --> Cache
    Auth --> UserService
    Cache --> Redis
    UserService --> DB
    LearningService --> DB
    ProgressService --> DB
    ActivityService --> DB
    LearningService --> Redis
    ProgressService --> Redis
```

## Component Details

### Frontend Architecture

```mermaid
graph TB
    subgraph Components
        Pages[Pages]
        Components[Reusable Components]
        Hooks[Custom Hooks]
    end

    subgraph State Management
        Store[Redux Store]
        Actions[Actions]
        Reducers[Reducers]
        Middleware[Middleware]
    end

    subgraph API Integration
        APIClient[API Client]
        Interceptors[Interceptors]
        ErrorHandling[Error Handling]
    end

    Pages --> Components
    Components --> Hooks
    Components --> Store
    Store --> Actions
    Actions --> APIClient
    APIClient --> Interceptors
    Interceptors --> ErrorHandling
```

### Backend Architecture

```mermaid
graph TB
    subgraph API Routes
        Endpoints[API Endpoints]
        Middleware[Middleware]
        Dependencies[Dependencies]
    end

    subgraph Business Logic
        Services[Services]
        Models[Models]
        Schemas[Schemas]
    end

    subgraph Data Access
        Database[Database]
        Cache[Cache]
        FileSystem[File System]
    end

    Endpoints --> Middleware
    Middleware --> Dependencies
    Dependencies --> Services
    Services --> Models
    Models --> Database
    Services --> Cache
```

## Data Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Auth
    participant DB

    User->>Frontend: Login Request
    Frontend->>API: POST /auth/login
    API->>Auth: Validate Credentials
    Auth->>DB: Check User
    DB-->>Auth: User Data
    Auth-->>API: Generate Token
    API-->>Frontend: JWT Token
    Frontend->>Frontend: Store Token
    Frontend-->>User: Login Success
```

### Learning Session Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Cache
    participant DB

    User->>Frontend: Start Activity
    Frontend->>API: GET /activities/{id}
    API->>Cache: Check Cache
    Cache-->>API: Cache Miss
    API->>DB: Fetch Activity
    DB-->>API: Activity Data
    API->>Cache: Store in Cache
    API-->>Frontend: Activity Data
    Frontend-->>User: Display Activity

    User->>Frontend: Complete Exercise
    Frontend->>API: POST /progress
    API->>DB: Update Progress
    API->>Cache: Invalidate Cache
    API-->>Frontend: Updated Progress
    Frontend-->>User: Show Results
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ PROGRESS : tracks
    ACTIVITIES ||--o{ SESSIONS : contains
    ACTIVITIES ||--o{ PROGRESS : measures
    VOCABULARY ||--o{ PROGRESS : includes

    USERS {
        int id PK
        string email
        string name
        datetime created_at
    }

    ACTIVITIES {
        int id PK
        string type
        string name
        string description
    }

    SESSIONS {
        int id PK
        int user_id FK
        int activity_id FK
        datetime start_time
        datetime end_time
        int correct_count
        int incorrect_count
        float success_rate
    }

    PROGRESS {
        int id PK
        int user_id FK
        int activity_id FK
        int vocabulary_id FK
        int correct_count
        int attempt_count
        float success_rate
        datetime last_attempt
    }

    VOCABULARY {
        int id PK
        string word
        string translation
        string category
        int difficulty
    }
```

## Caching Strategy

```mermaid
graph TD
    subgraph Cache Types
        RC[Redis Cache]
        BWC[Browser Cache]
        SWC[Service Worker Cache]
    end

    subgraph Cached Data
        SD[Static Data]
        UD[User Data]
        AD[Activity Data]
        PD[Progress Data]
    end

    subgraph Invalidation
        TI[Time-based]
        EI[Event-based]
        VI[Version-based]
    end

    RC --> UD
    RC --> AD
    RC --> PD
    BWC --> SD
    SWC --> SD

    UD --> TI
    AD --> EI
    PD --> EI
    SD --> VI
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Production
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]
        RC[Redis Cluster]
        DB[(Database)]
        CDN[CDN]
    end

    subgraph Monitoring
        Logs[Log Aggregation]
        Metrics[Metrics Collection]
        Alerts[Alert System]
    end

    Client --> LB
    LB --> API1
    LB --> API2
    API1 --> RC
    API2 --> RC
    API1 --> DB
    API2 --> DB
    Client --> CDN

    API1 --> Logs
    API2 --> Logs
    RC --> Metrics
    DB --> Metrics
    Metrics --> Alerts
```

## Security Architecture

```mermaid
graph TB
    subgraph Security Layers
        WAF[Web Application Firewall]
        Auth[Authentication]
        RBAC[Role-Based Access]
        Encrypt[Encryption]
    end

    subgraph Security Measures
        Input[Input Validation]
        XSS[XSS Prevention]
        CSRF[CSRF Protection]
        SQLi[SQL Injection Prevention]
    end

    Client --> WAF
    WAF --> Auth
    Auth --> RBAC
    RBAC --> Input
    Input --> XSS
    Input --> CSRF
    Input --> SQLi
    SQLi --> Encrypt
```

## Performance Optimization

```mermaid
graph LR
    subgraph Frontend
        LC[Load Time]
        FCP[First Content Paint]
        TTI[Time to Interactive]
    end

    subgraph Backend
        RT[Response Time]
        TP[Throughput]
        CPU[CPU Usage]
    end

    subgraph Optimization
        Cache[Caching]
        CDN[CDN]
        Index[DB Indexing]
        Pool[Connection Pooling]
    end

    LC --> Cache
    FCP --> CDN
    RT --> Index
    TP --> Pool
    CPU --> Cache
```

## Monitoring and Logging

```mermaid
graph TB
    subgraph Data Collection
        AL[Application Logs]
        PM[Performance Metrics]
        UM[User Metrics]
        SM[System Metrics]
    end

    subgraph Processing
        ELK[ELK Stack]
        Grafana[Grafana]
        Alert[Alert Manager]
    end

    subgraph Visualization
        Dashboard[Dashboards]
        Reports[Reports]
        Alerts[Alerts]
    end

    AL --> ELK
    PM --> Grafana
    UM --> Grafana
    SM --> Grafana
    ELK --> Dashboard
    Grafana --> Dashboard
    Grafana --> Alert
    Alert --> Alerts
```

This architecture documentation provides a comprehensive view of the system's components and their interactions. For specific implementation details, refer to the respective component documentation. 