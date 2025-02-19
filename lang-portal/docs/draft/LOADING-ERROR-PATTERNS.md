# Loading and Error Handling Patterns

## Overview
This document describes the standardized patterns for handling loading states and errors in the Language Learning Portal frontend application.

## Loading States

### Components

#### 1. Basic Loading State
```tsx
import { LoadingState } from '@/components/common/LoadingState';

// Spinner variant
<LoadingState />

// Skeleton variant
<LoadingState variant="skeleton" height={200} width={400} />
```

#### 2. Skeleton Text
```tsx
import { SkeletonText } from '@/components/common/LoadingState';

// Single line
<SkeletonText />

// Multiple lines
<SkeletonText lines={3} />
```

#### 3. Skeleton Card
```tsx
import { SkeletonCard } from '@/components/common/LoadingState';

<SkeletonCard />
```

### Hook Usage

#### useLoadingState Hook
```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const MyComponent = () => {
  const { isLoading, error, data, execute } = useLoadingState<UserData>({
    onSuccess: (data) => {
      console.log('Data loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading data:', error);
    }
  });

  useEffect(() => {
    execute(api.getUserData());
  }, [execute]);

  if (isLoading) return <LoadingState />;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
};
```

## Error Handling

### Components

#### 1. API Error Boundary
```tsx
import { ApiErrorBoundary } from '@/components/error/ApiErrorBoundary';

<ApiErrorBoundary
  onError={(error, errorInfo) => {
    // Handle error
  }}
  fallback={<CustomErrorComponent />}
>
  <YourComponent />
</ApiErrorBoundary>
```

#### 2. Route Error Boundary
```tsx
import { ErrorBoundaryRoute } from '@/components/error/ErrorBoundaryRoute';

<ErrorBoundaryRoute path="/your-path">
  <YourComponent />
</ErrorBoundaryRoute>
```

### Error Types

#### ApiError
```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

## Best Practices

### 1. Loading States
- Use skeleton loading for content-heavy components
- Use spinner for quick operations
- Always provide loading feedback for operations > 300ms
- Implement progressive loading for large datasets

### 2. Error Handling
- Use error boundaries for component-level errors
- Implement retry mechanisms for transient failures
- Provide user-friendly error messages
- Log errors appropriately in development

### 3. Component Structure
```tsx
const MyComponent = () => {
  const { data, isLoading, error } = useLoadingState();

  if (isLoading) {
    return <LoadingState variant="skeleton" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!data) {
    return null;
  }

  return <div>{/* Your component content */}</div>;
};
```

## Testing

### 1. Loading States
```typescript
it('shows loading state', () => {
  render(<MyComponent />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

### 2. Error States
```typescript
it('shows error message', () => {
  const error = new ApiError('Not found', 404);
  render(<ErrorMessage error={error} />);
  expect(screen.getByText('The requested resource was not found.')).toBeInTheDocument();
});
```

### 3. Hook Testing
```typescript
it('handles loading state', () => {
  const { result } = renderHook(() => useLoadingState());
  act(() => {
    result.current.execute(new Promise(() => {}));
  });
  expect(result.current.isLoading).toBe(true);
});
```

## Common Patterns

### 1. Data Fetching
```tsx
const DataComponent = () => {
  const { data, isLoading, error, execute } = useLoadingState<Data>();

  useEffect(() => {
    execute(fetchData());
  }, [execute]);

  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return <DataDisplay data={data} />;
};
```

### 2. Form Submission
```tsx
const FormComponent = () => {
  const { isLoading, error, execute } = useLoadingState();

  const handleSubmit = async (data: FormData) => {
    try {
      await execute(submitForm(data));
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isLoading && <LoadingState />}
      {error && <ErrorMessage error={error} />}
      {/* Form fields */}
    </form>
  );
};
```

## Accessibility Considerations

### 1. Loading States
- Use appropriate ARIA attributes
- Provide meaningful loading messages
- Maintain focus management during loading

### 2. Error Messages
- Use semantic HTML for error messages
- Provide clear error descriptions
- Ensure error messages are announced by screen readers

## Performance Considerations

### 1. Skeleton Loading
- Use appropriate skeleton sizes
- Implement staggered loading for large lists
- Optimize animation performance

### 2. Error Recovery
- Implement exponential backoff for retries
- Cache valid data during error states
- Provide offline support where possible 