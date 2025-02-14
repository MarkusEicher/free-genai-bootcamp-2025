## 1 Data Flow Diagram
```mermaid
graph LR
    F[Frontend SPA] -- HTTP Requests --> B[FastAPI Backend]
    B -- JSON Responses --> F
    B -- CRUD Operations --> DB[(SQLite3)]
```
## 2 Key Interactions

### A Dashboard View

```mermaid
sequenceDiagram
    Frontend->>Backend: GET /dashboard/stats
    Backend->>Database: Query stats data
    Database-->>Backend: Return stats
    Backend-->>Frontend: JSON stats response
    Frontend->>Backend: GET /dashboard/last_session
    Backend->>Database: Query session data
    Database-->>Backend: Return session
    Backend-->>Frontend: JSON session response
``` 
### Learning Session Flow

```mermaid
sequenceDiagram
    Frontend->>Backend: GET /vocabulary_groups
    Backend-->>Frontend: List of available groups
    Frontend->>Backend: GET /activities
    Backend-->>Frontend: Available activities
    Frontend->>Backend: GET /activities/{id}/launch
    Backend-->>Frontend: Activity launch URL
    Frontend->>Backend: POST /activity_reviews
    Backend->>Database: Store review results
    Database-->>Backend: Confirmation
    Backend-->>Frontend: Success response
```
### Progress Tracking

```mermaid
sequenceDiagram
    Frontend->>Backend: GET /vocabulary/progress
    Backend->>Database: Calculate progress
    Database-->>Backend: Progress data
    Backend-->>Frontend: JSON progress response
```
## 3 API Response Format
	
```json
{
    "success": true,
    "data": {
        // Endpoint specific data
    },
    "error": null,
    "metadata": {
        "timestamp": "2024-03-21T10:00:00Z",
        "pagination": {
            "total": 100,
            "page": 1,
            "per_page": 20
        }
    }
}
```

## 4 Error Response Format

```json
{
    "success": false,
    "data": null,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {}
    },
    "metadata": {
        "timestamp": "2024-03-21T10:00:00Z"
    }
}
```
