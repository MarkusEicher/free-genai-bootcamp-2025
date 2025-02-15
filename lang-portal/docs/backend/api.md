# API Documentation

## Base Endpoints

### Root (/)
- **Method**: GET
- **Description**: Redirects to the API documentation
- **Response**: Redirects to /docs

### Health Check (/health)
- **Method**: GET
- **Description**: Returns API health status
- **Response**:
  ```json
  {
    "status": "healthy",
    "version": "0.1.0"
  }
  ```

### Documentation (/docs)
- **Method**: GET
- **Description**: Swagger UI documentation
- **URL**: http://localhost:8000/docs