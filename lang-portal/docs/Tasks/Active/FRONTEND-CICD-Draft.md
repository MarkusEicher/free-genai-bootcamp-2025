# Deployment Architecture Analysis

## Executive Summary

This document analyzes the deployment architecture for the Language Learning Portal, focusing on a constrained single-machine development environment while planning for future scalability. The analysis considers the application's privacy-first and local-first principles while providing a path to production deployment.

## Current State Assessment

### 1. Application Characteristics
- Privacy-focused, local-first architecture
- FastAPI backend with SQLite database
- React/TypeScript frontend
- File-based caching system
- Nginx reverse proxy
- No external dependencies

### 2. Development Environment
- Windows with WSL (Ubuntu)
- Docker Desktop available
- Constrained single-machine environment
- Local development focus

## Containerization Strategy

### 1. Docker-based Local Development
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - backend_data:/app/data
    ports:
      - "8000:8000"
    environment:
      - DEV_MODE=true
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./backend/scripts/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - backend
      - frontend

volumes:
  backend_data:
```

### 2. Production Container Structure
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    volumes:
      - backend_data:/app/data
    environment:
      - DEV_MODE=false
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    volumes:
      - frontend_build:/app/build
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./backend/scripts/nginx.conf:/etc/nginx/nginx.conf:ro
      - frontend_build:/usr/share/nginx/html
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  backend_data:
  frontend_build:
```

## Local GitOps Implementation

### 1. K3d Local Cluster Setup
```bash
# Create local registry
k3d registry create registry.localhost --port 5000

# Create local cluster
k3d cluster create lang-portal \
  --registry-use k3d-registry.localhost:5000 \
  --agents 2

# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Argo CD Application Configuration
```yaml
# lang-portal-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: lang-portal
  namespace: argocd
spec:
  project: default
  source:
    repoURL: file:///path/to/local/repo
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: lang-portal
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Kubernetes Resource Configuration

### 1. Base Configuration
```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - backend-deployment.yaml
  - frontend-deployment.yaml
  - nginx-deployment.yaml
  - persistent-volume-claims.yaml
```

### 2. Development Overlay
```yaml
# k8s/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
  - ../../base
patchesStrategicMerge:
  - dev-patches.yaml
```

## WebAssembly Integration Strategy

### 1. Frontend Optimization
- Compile compute-intensive frontend components to WebAssembly
- Use Rust for WebAssembly modules
```rust
// vocabulary_processing.rs
#[wasm_bindgen]
pub fn process_vocabulary(input: &str) -> String {
    // Vocabulary processing logic
}
```

### 2. Backend Integration
- Use Wasmtime for server-side WebAssembly execution
```python
from wasmtime import Engine, Store, Module, Instance

def load_wasm_module(path: str):
    engine = Engine()
    store = Store(engine)
    module = Module.from_file(engine, path)
    instance = Instance(store, module, [])
    return instance
```

## NATS.io Integration Considerations

### 1. Event-Driven Architecture
```python
# backend/app/core/events.py
from nats.aio import client

class EventBus:
    def __init__(self):
        self.nc = client.Client()
        
    async def connect(self):
        await self.nc.connect("nats://localhost:4222")
        
    async def publish(self, subject: str, data: dict):
        await self.nc.publish(subject, json.dumps(data).encode())
```

### 2. Local Development Setup
```yaml
# docker-compose.nats.yml
version: '3.8'
services:
  nats:
    image: nats:alpine
    ports:
      - "4222:4222"
    command: ["-js"]
```

## Recommendations

### 1. Initial Development Phase
- Use Docker Compose for local development
- Implement local GitOps with k3d and Argo CD
- Start with monolithic deployment
- Focus on containerization and local testing

### 2. Future Scalability
- Consider microservices only when specific components need independent scaling
- Use NATS.io for event-driven features
- Implement WebAssembly for compute-intensive tasks
- Keep data privacy as primary concern

### 3. Migration Path
- Start with containerization
- Add Kubernetes deployment
- Introduce NATS.io for specific features
- Gradually adopt WebAssembly where beneficial

### 4. Testing Strategy
- Use k3d for local Kubernetes testing
- Implement integration tests with containerized services
- Test WebAssembly modules independently
- Verify data privacy in containerized environment

## Privacy and Security Considerations

### 1. Data Privacy
- Maintain local-first architecture in containerized environment
- Ensure data isolation between containers
- Implement secure volume management
- Maintain privacy-focused logging

### 2. Security Measures
- Implement container security best practices
- Use security contexts in Kubernetes
- Regular security scanning of container images
- Secure configuration management

## Conclusion

The application's local-first, privacy-focused nature suggests a careful approach to containerization and deployment. While the current architecture is monolithic, the proposed setup allows for future scalability while maintaining data privacy and local operation principles.

The recommended approach uses Docker and Kubernetes for local development and testing, with Argo CD for GitOps, while keeping the door open for NATS.io and WebAssembly optimizations. This provides a solid foundation for both development and future production deployment.

## Next Steps

1. **Immediate Actions**
   - Set up Docker Compose development environment
   - Implement k3d local cluster
   - Configure Argo CD for local GitOps

2. **Short-term Goals**
   - Create Kubernetes resource configurations
   - Implement basic monitoring
   - Set up local testing environment

3. **Long-term Planning**
   - Evaluate NATS.io integration points
   - Identify WebAssembly optimization opportunities
   - Plan production deployment strategy 