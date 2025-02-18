# Code Review Checklist

## General Checks
- [ ] Code follows project structure and organization
- [ ] All files are in correct locations
- [ ] No sensitive information in code (credentials, keys, etc.)
- [ ] Code is properly documented
- [ ] Changes are covered by tests
- [ ] All tests pass
- [ ] No debug code or commented-out code
- [ ] Error handling is implemented appropriately

## Backend Checks
### Code Quality
- [ ] Follows PEP 8 style guide
- [ ] Type hints are used correctly
- [ ] Docstrings present for functions/classes
- [ ] Functions/methods are single-responsibility
- [ ] Error handling uses standard response format
- [ ] Logging is implemented where appropriate

### API Endpoints
- [ ] Follows REST principles
- [ ] Uses correct HTTP methods
- [ ] Input validation implemented
- [ ] Returns standard response format
- [ ] Swagger documentation updated
- [ ] Error responses documented

### Database
- [ ] Database migrations are clean
- [ ] Indexes used appropriately
- [ ] No N+1 query problems
- [ ] Transactions used where needed

## Frontend Checks
### Code Quality
- [ ] Follows ESLint/Prettier configuration
- [ ] TypeScript types properly defined
- [ ] Components are reusable where possible
- [ ] Props are properly typed
- [ ] No any types unless justified

### Components
- [ ] Follows component structure guidelines
- [ ] Uses proper state management
- [ ] Implements error boundaries where needed
- [ ] Handles loading states
- [ ] Implements proper error handling
- [ ] Responsive design implemented correctly

### Performance
- [ ] No unnecessary re-renders
- [ ] Proper use of useMemo/useCallback
- [ ] Images are optimized
- [ ] Bundle size considered
- [ ] Lazy loading used where appropriate

## Testing
- [ ] Unit tests cover new functionality
- [ ] Integration tests added where needed
- [ ] Edge cases are tested
- [ ] Error scenarios are tested
- [ ] UI component tests include user interactions
- [ ] Test coverage meets requirements

## Security
- [ ] Input is properly sanitized
- [ ] Authentication/Authorization checked
- [ ] No security vulnerabilities introduced
- [ ] CORS configured correctly
- [ ] API endpoints properly protected

## Documentation
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Code changes are well-commented
- [ ] Complex logic is explained
- [ ] Configuration changes documented

## Deployment
- [ ] Environment variables documented
- [ ] Dependencies updated properly
- [ ] No breaking changes
- [ ] Database migrations are backwards compatible
- [ ] Deployment documentation updated

## Pull Request Quality
- [ ] PR description is clear and complete
- [ ] Related issues are linked
- [ ] Changes are atomic and focused
- [ ] No unrelated changes included
- [ ] Commit messages are clear and follow conventions 