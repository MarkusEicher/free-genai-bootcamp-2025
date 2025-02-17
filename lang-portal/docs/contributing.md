# Contributing to Language Learning Portal

This guide explains how to contribute to the Language Learning Portal project, whether you're fixing bugs, improving documentation, or adding new features.

## Contribution Workflow

```mermaid
graph TD
    A[Fork Repository] --> B[Create Branch]
    B --> C[Make Changes]
    C --> D[Run Tests]
    D -->|Tests Pass| E[Create PR]
    D -->|Tests Fail| C
    E --> F[Code Review]
    F -->|Changes Requested| C
    F -->|Approved| G[Merge PR]
```

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/lang-portal.git
   cd lang-portal
   ```

2. **Set Up Development Environment**
   ```bash
   # Backend setup
   cd backend
   python -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\activate on Windows
   pip install -r requirements-dev.txt

   # Frontend setup
   cd ../frontend
   npm install
   ```

## Project Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        State[State Management]
        API[API Client]
    end
    
    subgraph Backend
        Router[API Router]
        Service[Services]
        Cache[Redis Cache]
        DB[(Database)]
    end
    
    UI --> State
    State --> API
    API --> Router
    Router --> Service
    Service --> Cache
    Service --> DB
```

## Testing Workflow

```mermaid
flowchart LR
    A[Write Code] --> B[Write Tests]
    B --> C{Run Tests}
    C -->|Pass| D[Create PR]
    C -->|Fail| E[Debug]
    E --> A
    D --> F[Code Review]
    F -->|Approved| G[Merge]
    F -->|Changes Needed| A
```

## Code Review Process

```mermaid
sequenceDiagram
    participant D as Developer
    participant R as Reviewer
    participant CI as CI/CD
    
    D->>R: Submit PR
    R->>D: Request changes
    D->>R: Update PR
    R->>CI: Approve PR
    CI->>D: Run tests
    CI->>D: Deploy
```

## Documentation Standards

### File Structure
```mermaid
graph TD
    docs[docs/] --> user[User Docs]
    docs --> dev[Developer Docs]
    docs --> api[API Docs]
    
    user --> guide[user-guide.md]
    user --> faq[faq.md]
    user --> mobile[mobile-guide.md]
    
    dev --> setup[setup.md]
    dev --> contrib[contributing.md]
    dev --> arch[architecture.md]
    
    api --> spec[api-spec.md]
    api --> ref[api-reference.md]
    api --> ex[examples.md]
```

## Making Changes

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes
- Follow code style guidelines
- Add tests for new features
- Update documentation
- Add comments for complex logic

### 3. Commit Changes
```bash
# Good commit messages
git commit -m "feat: add user progress tracking"
git commit -m "fix: resolve mobile layout issues"
git commit -m "docs: update API documentation"
```

## Testing Guidelines

### Test Coverage Requirements

```mermaid
pie title Minimum Test Coverage
    "Unit Tests" : 80
    "Integration Tests" : 15
    "E2E Tests" : 5
```

### Testing Flow

```mermaid
graph LR
    A[Unit Tests] --> B[Integration Tests]
    B --> C[E2E Tests]
    C -->|Pass| D[Ready for Review]
    C -->|Fail| E[Fix Issues]
    E --> A
```

## Documentation Requirements

### For Features
1. Technical documentation
2. User guide updates
3. API documentation
4. Example usage
5. Test cases

### For Bug Fixes
1. Description of the bug
2. Steps to reproduce
3. Solution explanation
4. Test cases

## Review Checklist

```mermaid
stateDiagram-v2
    [*] --> CodeReview
    CodeReview --> TestReview
    TestReview --> DocReview
    DocReview --> SecurityReview
    SecurityReview --> PerformanceReview
    PerformanceReview --> [*]
```

### Code Review
- [ ] Follows style guide
- [ ] No hardcoded values
- [ ] Error handling
- [ ] Input validation

### Test Review
- [ ] Unit tests added/updated
- [ ] Integration tests if needed
- [ ] Edge cases covered
- [ ] Meets coverage requirements

### Documentation Review
- [ ] Updated relevant docs
- [ ] Clear commit messages
- [ ] Code comments
- [ ] API documentation

### Security Review
- [ ] Input sanitization
- [ ] Authentication/Authorization
- [ ] Data validation
- [ ] No sensitive data exposure

### Performance Review
- [ ] No N+1 queries
- [ ] Proper indexing
- [ ] Caching where appropriate
- [ ] Resource optimization

## Getting Help

Need help with your contribution? Here are your options:

1. **Questions about implementation**
   - Create a draft PR
   - Tag relevant reviewers
   - Ask in #dev-help channel

2. **Technical issues**
   - Check troubleshooting guide
   - Ask in GitHub discussions
   - Contact core team

3. **Documentation questions**
   - Check style guide
   - Ask in #docs channel
   - Reference examples

## Release Process

```mermaid
graph TD
    A[Feature Branch] --> B[Development]
    B --> C[Staging]
    C --> D[Production]
    
    B -->|Tests| B1[CI/CD]
    C -->|Tests| C1[CI/CD]
    D -->|Tests| D1[CI/CD]
```

Remember: Quality contributions make the portal better for everyone! 