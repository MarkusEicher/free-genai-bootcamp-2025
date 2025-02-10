# LangPortal Application Specifications

## Tech Stack

### Frontend
- React 18+
- React Query for data fetching
- Context API for global state
- Styled Components & Tailwind CSS
- TypeScript
- Jest & React Testing Library

### Backend
- Next.js 14+
- Prisma ORM
- SQLite3 database
- Jest for testing
- TypeScript

## Frontend Structure

### Directory Structure
```typescript
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   └── Layout/
│   │   ├── dashboard/
│   │   ├── activities/
│   │   ├── words/
│   │   ├── groups/
│   │   ├── sessions/
│   │   └── settings/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWords.ts
│   │   ├── useGroups.ts
│   │   └── useStudySession.ts
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   └── SettingsContext.tsx
│   ├── services/
│   │   └── api/
│   ├── types/
│   └── utils/
├── tests/
└── public/
```

### Core Components Structure
[Previous components structure remains with added TypeScript interfaces]

## Backend Structure

### Directory Structure
```typescript
backend/
├── src/
│   ├── pages/
│   │   └── api/
│   │       ├── dashboard/
│   │       ├── activities/
│   │       ├── words/
│   │       ├── groups/
│   │       ├── sessions/
│   │       └── settings/
│   ├── lib/
│   │   ├── prisma/
│   │   ├── validation/
│   │   └── utils/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── tests/
```

## Database Schema (Prisma)

```prisma
model Word {
  id          Int           @id @default(autoincrement())
  text        String
  translation String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  groups      WordGroup[]
  progress    WordProgress?

  @@index([text])
}

model Group {
  id        Int         @id @default(autoincrement())
  name      String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  words     WordGroup[]
  sessions  Session[]

  @@index([name])
}

model WordGroup {
  word     Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
  wordId   Int
  group    Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  groupId  Int
  addedAt  DateTime @default(now())

  @@id([wordId, groupId])
}

model Session {
  id           Int      @id @default(autoincrement())
  activityType String
  startTime    DateTime @default(now())
  endTime      DateTime?
  correctCount Int      @default(0)
  wrongCount   Int      @default(0)
  group        Group    @relation(fields: [groupId], references: [id])
  groupId      Int

  @@index([startTime])
}

model WordProgress {
  word          Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
  wordId        Int      @id
  correctCount  Int      @default(0)
  attemptCount  Int      @default(0)
  lastStudiedAt DateTime?

  @@index([lastStudiedAt])
}

model Settings {
  id        Int      @id @default(autoincrement())
  theme     String   @default("light")
  updatedAt DateTime @updatedAt
}
```

## API Endpoints with TypeScript Interfaces

```typescript
// Common Response Types
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

// Dashboard Types
interface DashboardStats {
  successRate: number;
  studySessions: number;
  activeGroups: number;
  studyStreak: number;
}

interface StudyProgress {
  totalWords: number;
  studiedWords: number;
  masteryProgress: number;
}

// Words Types
interface Word {
  id: number;
  text: string;
  translation: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Endpoints with Error Handling
GET /api/dashboard/stats
Response: ApiResponse<DashboardStats>

GET /api/words/list
Query: { page: number; limit: number; search?: string }
Response: ApiResponse<{ words: Word[]; total: number }>

[Additional endpoints follow same pattern...]
```

## Error Handling

```typescript
// Global Error Types
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Error Handling Middleware
const errorHandler = (err: Error): ApiError => {
  if (err instanceof PrismaError) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed'
    };
  }
  // Additional error types...
};
```

## Validation

```typescript
// Using Zod for validation
import { z } from 'zod';

const WordSchema = z.object({
  text: z.string().min(1),
  translation: z.string().min(1)
});

const GroupSchema = z.object({
  name: z.string().min(1)
});

[Additional schemas...]
```

This specification provides a complete structure for both frontend and backend, including proper TypeScript support, error handling, validation, and database schema with proper indexing and relationships.