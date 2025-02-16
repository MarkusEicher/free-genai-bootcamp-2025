# LangPortal Application Specifications

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- React Query for data fetching
- Context API for global state
- Styled Components & Tailwind CSS
- TypeScript
- Jest & React Testing Library
- There will no authentication or authorization
Everything be treated as a single user

### Backend
- Next.js 14+ (App Router)
- Prisma ORM
- SQLite3 database
- Jest for testing
- TypeScript

## Application Structure

### Directory Structure
```typescript
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── activities/
│   ├── words/
│   ├── groups/
│   ├── settings/
│   └── api/
│       ├── auth/
│       ├── words/
│       ├── groups/
│       └── activities/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── Layout/
│   ├── dashboard/
│   ├── activities/
│   ├── words/
│   └── groups/
├── lib/
│   ├── prisma/
│   ├── cache.ts
│   └── constants.ts
├── services/
│   ├── api/
│   │   ├── baseApi.ts
│   │   ├── wordService.ts
│   │   └── groupService.ts
│   └── cache/
├── repositories/
│   ├── wordRepository.ts
│   └── groupRepository.ts
├── middleware/
│   ├── auth.ts
│   ├── rateLimiter.ts
│   └── cors.ts
├── config/
│   ├── env.ts
│   └── constants.ts
├── types/
│   ├── api.d.ts
│   └── env.d.ts
├── utils/
│   ├── validation.ts
│   └── errors.ts
└── styles/
    └── globals.css
```

## Core Implementation

### Environment Configuration
```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
  }
}

// config/env.ts
export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  nodeEnv: process.env.NODE_ENV!,
  port: parseInt(process.env.PORT!, 10),
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
  },
};
```

### API Base Service
```typescript
// services/api/baseApi.ts
export class BaseApi {
  static async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new CustomError(
        response.status,
        'API_ERROR',
        'Failed to fetch data'
      );
    }
    return response.json();
  }

  static async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new CustomError(
        response.status,
        'API_ERROR',
        'Failed to post data'
      );
    }
    return response.json();
  }
}
```

### Error Handling
```typescript
// utils/errors.ts
export class CustomError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CustomError';
  }
}

// middleware/errorHandler.ts
import { NextResponse } from 'next/server';

export function errorHandler(error: unknown) {
  if (error instanceof CustomError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
```

### Authentication Middleware
```typescript
// middleware/auth.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### Caching Implementation
```typescript
// lib/cache.ts
import { LRUCache } from 'lru-cache';

export const cache = new LRUCache<string, unknown>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// services/cache/cacheService.ts
export class CacheService {
  static async getOrSet<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const cached = cache.get(key) as T | undefined;
    if (cached) return cached;

    const fresh = await fn();
    cache.set(key, fresh);
    return fresh;
  }
}
```

### Repository Pattern
```typescript
// repositories/wordRepository.ts
import { prisma } from '@/lib/prisma';
import type { Word } from '@prisma/client';

export class WordRepository {
  static async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<Word[]> {
    return prisma.word.findMany({
      where: {
        text: {
          contains: params.search,
        },
      },
      skip: params.skip,
      take: params.take,
    });
  }

  static async create(data: {
    text: string;
    translation: string;
  }): Promise<Word> {
    return prisma.word.create({
      data,
    });
  }
}
```

### API Route Handler Example
```typescript
// app/api/words/route.ts
import { NextResponse } from 'next/server';
import { WordRepository } from '@/repositories/wordRepository';
import { errorHandler } from '@/middleware/errorHandler';
import { WordSchema } from '@/utils/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const words = await WordRepository.findMany({
      skip: Number(searchParams.get('skip')) || 0,
      take: Number(searchParams.get('take')) || 10,
      search: searchParams.get('search') || undefined,
    });

    return NextResponse.json({ data: words });
  } catch (error) {
    return errorHandler(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = WordSchema.parse(body);
    const word = await WordRepository.create(validated);

    return NextResponse.json({ data: word }, { status: 201 });
  } catch (error) {
    return errorHandler(error);
  }
}
```

### Validation
```typescript
// utils/validation.ts
import { z } from 'zod';

export const WordSchema = z.object({
  text: z.string().min(1),
  translation: z.string().min(1),
});

export const GroupSchema = z.object({
  name: z.string().min(1),
});
```

## Development Setup

### Required Environment Variables
```bash
DATABASE_URL="file:./words.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3000
```

### Installation Steps
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Additional Setup

1. **ESLint Configuration**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ]
}
```

2. **Jest Configuration**
```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
```

3. **Husky Pre-commit Hook**
```bash
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

## Database Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  words     Word[]
  groups    Group[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Word {
  id          String   @id @default(cuid())
  text        String
  translation String
  userId      String
  groupId     String?
  user        User     @relation(fields: [userId], references: [id])
  group       Group?   @relation(fields: [groupId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Group {
  id        String   @id @default(cuid())
  name      String
  userId    String
  words     Word[]
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/session

### Words
- GET /api/words
- POST /api/words
- PUT /api/words/:id
- DELETE /api/words/:id

### Groups
- GET /api/groups
- POST /api/groups
- PUT /api/groups/:id
- DELETE /api/groups/:id

Each endpoint should include:
- Request/Response types
- Authentication requirements
- Rate limiting rules
- Expected status codes

This specification now includes a modern Next.js 14 App Router structure, proper separation of concerns, type safety, security middleware, caching, and follows best practices for both frontend and backend development.

## Component Specifications

### Common Components
- Button: variants, props, styles
- Input: variants, validation, props
- Card: layout options, props
- Layout: page structure, navigation

### Feature Components
- WordList: sorting, filtering, pagination
- GroupSelector: selection modes, filtering
- ActivityTracker: progress tracking, stats

## State Management

### Context Structure
```typescript
interface AppState {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  words: Word[];
  groups: Group[];
  // ... other state
}

interface AppContext {
  state: AppState;
  dispatch: (action: Action) => void;
}
```

### React Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});
```

## Testing Strategy

### Unit Tests
- Components: rendering, user interactions
- Utilities: pure functions
- Hooks: state management

### Integration Tests
- API routes
- Database operations
- Authentication flow

### E2E Tests
- User journeys
- Critical paths

## Deployment

### Production Requirements
```bash
# Required Environment Variables
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NODE_ENV=production
PORT=3000

# Build Commands
npm run build
npm run start

# Database Migration
npx prisma migrate deploy
```

### CI/CD Pipeline
```yaml
# .github/workflows/main.yml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
      - name: Run tests
      - name: Build
```

## Implementation Checklist

### Phase 1: Setup
- [ ] Project initialization
- [ ] Database setup
- [ ] Authentication implementation
- [ ] Basic API structure

### Phase 2: Core Features
- [ ] Word management
- [ ] Group management
- [ ] Basic UI components

### Phase 3: Advanced Features
- [ ] Activities
- [ ] Statistics
- [ ] User settings

### Phase 4: Polish
- [ ] Performance optimization
- [ ] Error handling
- [ ] Testing
- [ ] Documentation

## Error Handling

### Error Types
```typescript
type ErrorCode = 
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

interface AppError {
  code: ErrorCode;
  message: string;
  status: number;
}
```

### Error Boundaries
- Global error boundary
- Feature-specific boundaries
- API error handling