# Deepread - Project Overview

**Generated:** 2026-01-13
**Type:** Monolithic Web Application
**Status:** Early MVP - UI Implementation Phase

---

## Executive Summary

Deepread is an AI-powered reading and learning platform designed to transform digital PDF reading into an active, intentional learning experience. The project focuses on helping users read and comprehend complex books by providing contextual AI assistance, progress tracking, note-taking, and comprehension tests.

**Current State:** UI mockups and component library implemented. No backend logic or AI integration yet.

---

## Project Vision

### Core Problem
- Physical books are expensive but digital PDFs lack engagement tools
- Readers struggle with focus, retention, and active learning when reading PDFs
- Traditional PDF readers are passive - no tools for understanding or retention

### Solution
An interactive reading platform that combines:
- PDF viewing with chapter detection and progress tracking
- Contextual AI assistant with full book knowledge
- Chapter-based notes and highlights
- Comprehension tests (per chapter or full book)
- Active learning methodology embedded in the reading experience

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 16.0.10 | Full-stack React framework with App Router |
| **Runtime** | React | 19.2.1 | UI library |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **UI Components** | Shadcn/UI | Latest | Radix-based component library |
| **State Management** | Zustand | 5.0.9 | Lightweight state management |
| **Icons** | Lucide React | 0.561.0 | Icon library |
| **Animations** | tw-animate-css | 1.4.0 | Tailwind animation utilities |

**Build Tools:**
- ESLint 9 (linting)
- PostCSS with Tailwind (styling)
- TypeScript compiler (type checking)

---

## Architecture Pattern

**Type:** Client-Side Rendered (CSR) Next.js App Router Application

### Current Architecture
- **Monolithic structure**: Single cohesive Next.js application
- **No backend**: All logic currently runs client-side with mock data
- **Component-based UI**: Organized by screens and reusable components
- **File-system routing**: Next.js App Router for navigation

### Directory Structure

```
deepread/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home/Library view
│   ├── layout.tsx                # Root layout
│   ├── book/[bookId]/            # Book overview route
│   │   ├── page.tsx              # Book detail page
│   │   ├── chapter/[chapterId]/  # Reading view route
│   │   │   └── page.tsx          # Chapter reader
│   │   └── test/[chapterId]/     # Test view route
│   │       └── page.tsx          # Chapter test
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── screens/                  # Full-screen views
│   │   ├── library.tsx           # Book library grid
│   │   ├── book-overview.tsx    # Book detail/chapters view
│   │   ├── reading-view.tsx     # Main reader interface
│   │   └── test-view.tsx        # Quiz/test interface
│   ├── reading/                  # Reading-specific components
│   │   ├── learning-sidebar.tsx # AI/Notes/Tests sidebar
│   │   ├── reading-content.tsx  # PDF viewer area
│   │   ├── ai-assistant-tab.tsx # AI chat interface
│   │   ├── notes-tab.tsx        # Notes management
│   │   └── chapters-popover.tsx # Chapter navigation
│   └── ui/                       # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── [40+ components]
│
├── lib/                          # Utilities and data
│   ├── utils.ts                  # Helper functions
│   └── mock-book-data.ts         # Mock book/chapter data
│
├── hooks/                        # Custom React hooks
│   ├── use-text-selection.ts    # Text selection handling
│   ├── use-sidebar-storage.ts   # Sidebar state persistence
│   └── use-media-query.ts       # Responsive breakpoints
│
└── public/                       # Static assets
```

---

## Key Features (Current Implementation Status)

### ✅ Implemented (UI Only)
1. **Library View** (`/`)
   - Grid display of books with progress
   - Book upload dialog (UI only)
   - Status badges (Reading/Consolidating/Completed)

2. **Book Overview** (`/book/[bookId]`)
   - Book metadata display
   - Chapter list with progress indicators
   - Navigation to reader

3. **Reading View** (`/book/[bookId]/chapter/[chapterId]`)
   - PDF content area (mockup)
   - Resizable learning sidebar
   - Chapter navigation bar
   - Text selection popover with actions
   - Reading toolbar (mode selector, layer toggles)

4. **Learning Sidebar** (within reading view)
   - AI Assistant tab (UI shell)
   - Notes tab (UI shell)
   - Tests tab (placeholder)
   - Collapsible/resizable panel

5. **UI Components**
   - Full Shadcn/UI component library integrated
   - Custom reading-specific components
   - Responsive design patterns

### ❌ Not Implemented (Backend/Logic Missing)
1. **PDF Processing**
   - No PDF upload functionality
   - No PDF parsing/text extraction
   - No chapter detection algorithm

2. **AI Integration**
   - No AI model integration
   - No conversational interface logic
   - No context management for book content

3. **Data Persistence**
   - No database
   - No file storage
   - No user authentication
   - All data is mock/in-memory

4. **Core Features**
   - No actual note-taking persistence
   - No highlight management
   - No test generation
   - No progress tracking logic
   - No search functionality

---

## Data Model (Mock Implementation)

```typescript
interface Book {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  totalChapters: number
  chapters: Chapter[]
}

interface Chapter {
  id: string
  number: number
  title: string
  content: string              // HTML content (mock)
  wordCount: number
  estimatedReadingTime: number // minutes
}
```

**Current data source:** `lib/mock-book-data.ts` contains hardcoded "Designing Data-Intensive Applications" book with 12 chapters.

---

## User Flow (Designed)

1. **Home → Library**
   - User sees all books with progress
   - Can upload new PDF (UI only)

2. **Select Book → Book Overview**
   - View book metadata
   - See chapter list
   - Track overall progress

3. **Select Chapter → Reading View**
   - Read chapter content
   - Interact with sidebar tools:
     - Ask AI questions about content
     - Take notes on specific passages
     - Practice with comprehension tests
   - Navigate between chapters

4. **Testing Flow**
   - Generate tests per chapter or full book
   - Take quiz to validate understanding
   - Review results and return to reading

---

## Technical Decisions

### Why Next.js App Router?
- Modern React patterns (Server Components when needed)
- File-system based routing
- Built-in optimizations
- Good DX for rapid prototyping

### Why Shadcn/UI?
- Copy-paste components (no package dependency)
- Radix UI primitives (accessible)
- Full customization control
- Tailwind integration

### Why Zustand?
- Lightweight state management
- Minimal boilerplate
- TypeScript support
- Good for simple client-side state

---

## Next Steps (As Intended)

Based on README and design docs, the intended roadmap includes:

1. **Backend Infrastructure**
   - Database setup (user data, books, notes, highlights)
   - File storage for PDFs
   - User authentication

2. **PDF Processing**
   - PDF upload and parsing
   - Text extraction
   - Chapter detection algorithm
   - Page range mapping

3. **AI Integration**
   - LLM integration (OpenAI/Anthropic)
   - Context management (book + chapter context)
   - Conversation persistence
   - Web search integration

4. **Core Features**
   - Note-taking with persistence
   - Highlight management
   - Test generation from content
   - Progress tracking system

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm/pnpm/yarn/bun

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Configuration
- TypeScript: Strict mode enabled
- Path alias: `@/*` maps to project root
- Tailwind: Neutral color palette, Radix Vega style
- Icons: Lucide React library

---

## Current Limitations

1. **No Real Data**: All book content is hardcoded mock data
2. **No Persistence**: No database, changes lost on refresh
3. **No AI**: AI assistant is non-functional UI shell
4. **No PDF Support**: Cannot actually upload or view PDFs
5. **Desktop-Focused**: Not optimized for mobile
6. **Single-User**: No multi-user support or authentication
7. **No Search**: Cannot search within books
8. **No Sync**: No cross-device synchronization

---

## Project Metadata

- **Repository**: Local development
- **License**: MIT
- **Status**: Experimental MVP / Learning Project
- **Target Users**: Individual learners, single-user desktop focus
- **Scalability**: Not designed for scale (intentional)

---

**For Developers:**
This documentation reflects the **current state** of implementation, not the vision. The README and READING-TOOLBAR-DESIGN docs contain design intentions that are not yet built.
