# AGENTS.md - Golf Pool Development Guide

This file contains essential information for AI agents working on the Fantasy Golf Pool Invitational (2026) application.

## 🚀 Development Commands

### Core Development
```bash
bun install          # Install dependencies
bun --bun run dev          # Start dev server (port 3000)
bun --bun run build        # Production build
bun --bun run preview      # Preview production build
```

### Testing
```bash
bun --bun run test         # Run all tests with Vitest
bun --bun run test path/to/test.test.ts  # Run single test file
bun --bun run test --ui    # Run tests with Vitest UI
bun --bun run test --watch # Run tests in watch mode
```

### Code Quality
```bash
bun --bun run lint         # Biome linting
bun --bun run format       # Biome formatting
bun --bun run check        # Biome check (lint + format)
```

### shadcn/ui Components
```bash
bunx --bun shadcn@latest add [component-name]  # Add new shadcn components
```

## 🏗️ Tech Stack & Architecture

- **Runtime**: Bun (package manager and runtime)
- **Framework**: TanStack Start (full-stack React with file-based routing)
- **Language**: TypeScript (strict mode enabled)
- **Database**: Better-Auth + bun:sqlite + Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS v4
- **Testing**: Vitest + Testing Library
- **Code Quality**: Biome (linting + formatting)

## 📁 Project Structure

```
src/
├── components/ui/     # shadcn/ui components
├── lib/              # Utility functions (utils.ts)
├── routes/           # File-based routing with TanStack Router
├── styles.css        # Tailwind + design tokens
└── router.tsx        # Router configuration
```

## 🎯 Code Style Guidelines

### Formatting (Biome)
- **Indentation**: Tabs (configured in biome.json)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Semicolons**: Required
- **Organize Imports**: Auto-organize on save
- **File Extensions**: `.ts` for TypeScript, `.tsx` for React components

### Import Patterns
```typescript
// External dependencies first
import { createFileRoute } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'

// Internal imports with @ alias
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

### Component Patterns
```typescript
// shadcn/ui component pattern (follow button.tsx as template)
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "variant-classes",
        // ...other variants
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ComponentProps extends VariantProps<typeof componentVariants> {
  className?: string;
  // ...other props
}

function Component({ className, variant, ...props }: ComponentProps) {
  return (
    <div className={cn(componentVariants({ variant, className }))} {...props}>
      {/* Component content */}
    </div>
  );
}
```

### Route Patterns
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path')({
  component: ComponentName,
  loader: async () => {
    // Server-side data loading
    return data;
  },
})

function ComponentName() {
  const data = Route.useLoaderData()
  // Component logic
}
```

### Server Function Patterns
```typescript
import { createServerFn } from '@tanstack/react-start'

const serverFn = createServerFn({
  method: 'GET', // or 'POST'
}).handler(async () => {
  // Server-side logic
  return result;
})
```

## 🎨 UI/UX Guidelines

### Styling
- Use Tailwind CSS classes
- Follow shadcn/ui component patterns
- Use `cn()` utility for class merging
- Leverage design tokens in `styles.css`
- Support dark mode via `.dark` class

### Component Development
- Use existing components as templates
- Follow accessibility patterns from Radix UI
- Implement proper TypeScript types
- Use `class-variance-authority` for component variants

## 📊 Database & Data Patterns

### Core Schema (from design.md)
- **users**: Better-Auth with role enum ('admin', 'data', 'user')
- **members**: 108 league participants with rosters
- **golfers**: 119 PGA players with categories (1-7)
- **tournaments**: 34 events with type multipliers
- **scoring**: Weekly results with calculated points

### Scoring Logic
```typescript
const POINTS_MAP = {
  Standard: [15, 10, 8, 7, 6, 5, 4, 3, 2, 1],
  Double:   [30, 20, 16, 14, 12, 10, 8, 6, 4, 2],
  Triple:   [45, 30, 24, 21, 18, 15, 12, 9, 6, 3],
};

function calculatePoints(rank: number, type: 'Standard' | 'Double' | 'Triple'): number {
  if (rank > 10) return 0;
  return POINTS_MAP[type][rank - 1];
}
```

## 🧪 Testing Guidelines

### Test Structure
- Use Vitest for unit/integration tests
- Use Testing Library for React components
- Place test files alongside source files or in `__tests__` directories
- Name test files: `Component.test.tsx` or `component.test.ts`

### Test Patterns
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
})
```

## ⚡ Performance Considerations

- Use TanStack DB for reactive client-side state
- Leverage server functions for data operations
- Optimize leaderboard with virtualization if needed
- Use route loaders for initial data fetching
- Implement proper caching strategies

## 🔐 Authentication & Authorization

- Better-Auth with admin plugin
- Role-based access control:
  - **admin**: Commissioner - payments, rosters
  - **data**: Data Man - scoring imports
  - **user**: League members - read-only access

## 📋 Feature Implementation Priority

1. **Auth Setup**: Better-Auth with roles
2. **Database Schema**: Drizzle migrations
3. **Data Seeding**: Import members and golfers
4. **Scoring Engine**: Point calculation logic
5. **Leaderboard**: Main view with TanStack DB
6. **Admin Dashboard**: Payment tracking and roster management
7. **Data Import**: CSV upload for scoring data

## 🛠️ Development Workflow

1. Run `bun --bun run dev` to start development server
2. Make changes following established patterns
3. Run `bun --bun run check` before committing
4. Use `bun --bun run test` to verify functionality
5. Build with `bun --bun run build` to ensure production readiness

## 📚 Key Documentation

- `design.md`: Complete project specification and schema
- `plan.md`: Technical blueprint and roadmap
- `.cursorrules`: shadcn component installation instructions

## 🎯 Business Context

This is a local-first application for a 108-member fantasy golf league, replacing an Excel-based system. The focus is on real-time leaderboards, minimal hosting costs, and easy data management for the two administrators.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
