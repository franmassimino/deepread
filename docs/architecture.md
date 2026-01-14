# Deepread - Architecture Documentation

**Generated:** 2026-01-13
**Project Type:** Web Application (Next.js)
**Architecture Pattern:** Client-Side Rendered Monolith

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Data Architecture](#data-architecture)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Routing & Navigation](#routing--navigation)
8. [Development Workflow](#development-workflow)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │         Next.js App Router Application         │ │
│  │                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐│ │
│  │  │  Pages   │  │Components│  │ State (Zustand)││ │
│  │  │ (Routes) │  │   (UI)   │  │ (Client-side) ││ │
│  │  └──────────┘  └──────────┘  └──────────────┘│ │
│  │                                                 │ │
│  │  ┌────────────────────────────────────────────┤ │
│  │  │         Mock Data (Hardcoded)              │ │
│  │  └────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘

                   No Backend Yet
         ┌────────────────────────────────┐
         │  Future: Database, File Storage│
         │  Future: AI API Integration    │
         │  Future: Authentication        │
         └────────────────────────────────┘
```

### Current State vs. Future Architecture

| Component | Current | Future (Planned) |
|-----------|---------|------------------|
| **Frontend** | ✅ Next.js App Router | Same |
| **Backend API** | ❌ None | Next.js API Routes |
| **Database** | ❌ Mock data only | PostgreSQL / MongoDB |
| **File Storage** | ❌ None | S3 / Cloudinary |
| **AI Integration** | ❌ None | OpenAI / Anthropic API |
| **Authentication** | ❌ None | NextAuth.js |
| **State Management** | ✅ Zustand (basic) | Zustand + Server State |

---

## Technology Stack

### Frontend Framework
- **Next.js 16.0.10** - Full-stack React framework
  - App Router (file-system routing)
  - React Server Components ready (not used yet)
  - Built-in optimizations

- **React 19.2.1** - UI library
  - Function components + Hooks
  - No class components

### Language & Type Safety
- **TypeScript 5.x** - Strict mode enabled
  - Path aliases: `@/*` → project root
  - Full type coverage
  - Target: ES2017

### Styling & UI
- **Tailwind CSS 4.x** - Utility-first CSS
  - PostCSS integration
  - Neutral color palette (base)
  - Custom design system

- **Shadcn/UI** - Component library
  - Radix UI primitives
  - Copy-paste components
  - Full customization
  - Accessible by default

- **Lucide React 0.561.0** - Icon library
  - Tree-shakeable
  - Consistent design
  - 1000+ icons

### State Management
- **Zustand 5.0.9** - Client state
  - Minimal boilerplate
  - TypeScript support
  - No Context API needed

### Build Tools
- **ESLint 9** - Code linting
  - Next.js config
  - TypeScript rules

- **Tailwind PostCSS** - Style processing
  - Autoprefixer
  - CSS optimization

---

## Application Architecture

### Architecture Pattern

**Type:** Client-Side Rendered (CSR) Monolith

**Characteristics:**
- Single Next.js application
- All rendering happens client-side
- No server-side data fetching yet
- File-system based routing
- Component-based UI structure

### Directory Structure

```
deepread/
├── app/                          # App Router (Pages)
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (→ Library)
│   ├── globals.css               # Global Tailwind styles
│   │
│   └── book/[bookId]/            # Dynamic book routes
│       ├── page.tsx              # Book overview
│       ├── chapter/[chapterId]/  # Chapter reader
│       │   └── page.tsx
│       └── test/[chapterId]/     # Chapter tests
│           └── page.tsx
│
├── components/                   # React Components
│   ├── screens/                  # Full-page components
│   │   ├── library.tsx           # 📚 Library grid view
│   │   ├── book-overview.tsx    # 📖 Book detail view
│   │   ├── reading-view.tsx     # 📄 Reader interface
│   │   └── test-view.tsx        # ✅ Quiz interface
│   │
│   ├── reading/                  # Reading-specific components
│   │   ├── learning-sidebar.tsx # Collapsible right sidebar
│   │   ├── reading-content.tsx  # Main content area
│   │   ├── ai-assistant-tab.tsx # AI chat UI
│   │   ├── notes-tab.tsx        # Notes management
│   │   ├── chapters-popover.tsx # Chapter navigation
│   │   ├── bottom-navigation.tsx # Mobile nav
│   │   └── notes/               # Note components
│   │       ├── note-card.tsx
│   │       ├── note-form.tsx
│   │       └── ai-action-buttons.tsx
│   │
│   ├── ui/                       # Shadcn UI components (40+ files)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── popover.tsx
│   │   ├── tabs.tsx
│   │   ├── reading-header.tsx   # Custom reading toolbar
│   │   ├── app-header.tsx       # App header bar
│   │   └── ...
│   │
│   ├── upload-pdf-dialog.tsx    # PDF upload modal
│   └── book-upload-item.tsx     # Upload progress card
│
├── lib/                          # Utilities & Data
│   ├── utils.ts                  # cn() helper for Tailwind
│   ├── mock-book-data.ts         # Hardcoded book content
│   ├── books-store.tsx           # Zustand store (books)
│   └── upload-store.tsx          # Zustand store (uploads)
│
├── hooks/                        # Custom React Hooks
│   ├── use-text-selection.ts    # Handle text selection in reader
│   ├── use-sidebar-storage.ts   # Persist sidebar state
│   └── use-media-query.ts       # Responsive breakpoints
│
├── public/                       # Static Assets
│   └── [images, fonts, etc.]
│
└── Configuration Files
    ├── tsconfig.json             # TypeScript config
    ├── next.config.ts            # Next.js config
    ├── components.json           # Shadcn config
    ├── eslint.config.mjs         # ESLint config
    ├── postcss.config.mjs        # PostCSS config
    └── package.json              # Dependencies
```

---

## Data Architecture

### Current Data Model (Mock)

```typescript
// Books Store
interface Book {
  id: string                    // Unique identifier
  title: string                 // Book title
  author?: string               // Author name
  progress: number              // 0-100 percentage
  status: 'reading' | 'consolidating' | 'completed'
  lastActivity: string          // Last read location
  coverColor: string            // Tailwind class for cover
}

// Mock Book Data (from lib/mock-book-data.ts)
interface Chapter {
  id: string                    // e.g., "chapter-1"
  number: number                // Chapter number (1-12)
  title: string                 // Chapter heading
  content: string               // HTML content string
  wordCount: number             // Word count
  estimatedReadingTime: number  // Minutes
}

interface BookDetail {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  totalChapters: number
  chapters: Chapter[]
}

// Upload Store
interface UploadingBook {
  id: string
  fileName: string
  progress: number              // 0-100
  currentStep: number           // Step index (0-5)
  file: File                    // Original File object
}
```

### Data Flow (Current)

```
1. Application Start
   ↓
2. Load Mock Data (mockBook from lib/mock-book-data.ts)
   ↓
3. Initialize Zustand Stores
   - booksStore (empty array initially)
   - uploadStore (empty array)
   ↓
4. User Uploads PDF (simulated)
   ↓
5. Mock Processing Animation (upload-store.tsx)
   - 6 steps: Upload → Parse → Extract → Metadata → Chapters → Finalize
   - Each step with progress animation
   ↓
6. Add Book to booksStore
   ↓
7. Display in Library
```

**Note:** All data is **in-memory only**. No persistence across page reloads.

### Future Data Architecture

```
┌──────────────┐
│   Frontend   │
│   (Zustand)  │
└──────┬───────┘
       │
       │ API Calls
       ↓
┌──────────────┐
│  Next.js API │  ← Future: /api routes
│    Routes    │
└──────┬───────┘
       │
       ├─────→ Database (Books, Users, Progress, Notes)
       ├─────→ File Storage (PDF files)
       └─────→ AI Service (OpenAI/Anthropic)
```

---

## Component Architecture

### Component Hierarchy

```
App
├── RootLayout
│   ├── AppHeader (on non-reading pages)
│   └── Page Content
│
├── Library (Home Page)
│   ├── AppHeader
│   ├── UploadPdfDialog
│   └── BookGrid
│       ├── BookUploadItem (uploading)
│       └── BookCard[] (uploaded books)
│
├── BookOverview (/book/[bookId])
│   ├── AppHeader
│   ├── BookMetadata
│   └── ChapterList[]
│
└── ReadingView (/book/[bookId]/chapter/[chapterId])
    ├── ReadingHeader (toolbar)
    ├── MainContent (flex container)
    │   ├── ReadingContent (left panel)
    │   │   ├── ChapterNavigationBar
    │   │   ├── TextContent
    │   │   └── TextSelectionPopover (on text select)
    │   │
    │   └── LearningSidebar (right panel, resizable)
    │       ├── Tabs (AI / Notes / Tests)
    │       ├── AiAssistantTab
    │       ├── NotesTab
    │       │   ├── NoteForm
    │       │   ├── NoteCard[]
    │       │   └── ColorSelector
    │       └── TemplateTab
    │
    └── BottomNavigation (mobile only)
```

### Component Patterns

#### 1. Screen Components
- Full-page views
- Handle route params
- Orchestrate child components
- Located in `components/screens/`

**Example:**
```tsx
// components/screens/reading-view.tsx
export function ReadingView({
  bookId,
  chapterId
}: {
  bookId: string
  chapterId: string
}) {
  // Main reading interface logic
}
```

#### 2. Feature Components
- Domain-specific functionality
- Reusable across screens
- Located in `components/reading/`, etc.

**Example:**
```tsx
// components/reading/learning-sidebar.tsx
export function LearningSidebar() {
  // Tabbed sidebar for AI, Notes, Tests
}
```

#### 3. UI Components
- Primitive building blocks
- Shadcn/UI based
- Located in `components/ui/`

**Example:**
```tsx
// components/ui/button.tsx
export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant, size, ...props }, ref) => {
  // Radix-based button
})
```

### Component Communication

1. **Props Down**
   - Parent → Child data flow
   - Type-safe with TypeScript

2. **Events Up**
   - Child → Parent callbacks
   - `onClick`, `onChange`, etc.

3. **Global State (Zustand)**
   - Cross-component state
   - Books list
   - Upload progress

4. **Local State (useState)**
   - Component-specific state
   - Form inputs
   - UI toggles

---

## State Management

### Zustand Stores

#### 1. Books Store (`lib/books-store.tsx`)

```typescript
interface BooksStore {
  books: Book[]
  addBook: (book: Book) => void
  removeBook: (id: string) => void
}
```

**Purpose:** Manage the list of books in the user's library

**Current State:**
- Empty array on init
- Books added via mock upload flow
- No persistence (resets on reload)

**Usage:**
```tsx
const books = useBooksStore(state => state.books)
const addBook = useBooksStore(state => state.addBook)
```

#### 2. Upload Store (`lib/upload-store.tsx`)

```typescript
interface UploadStore {
  uploadingBooks: UploadingBook[]
  addUpload: (file: File) => void
  updateUpload: (id: string, progress: number, step: number) => void
  removeUpload: (id: string) => void
  startUpload: (file: File) => void  // Simulated async process
}
```

**Purpose:** Track PDF upload progress with multi-step animation

**Upload Steps:**
1. Uploading file... (1000ms)
2. Parsing PDF... (1500ms)
3. Extracting text... (1200ms)
4. Generating metadata... (1000ms)
5. Creating chapters... (800ms)
6. Finalizing... (500ms)

**Flow:**
```
startUpload(file)
  → Add to uploadingBooks[]
  → Simulate 6-step progress
  → Remove from uploadingBooks[]
  → Add to booksStore
  → Show toast notification
```

---

## Routing & Navigation

### Next.js App Router

**Routes:**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Library view (home) |
| `/book/[bookId]` | `app/book/[bookId]/page.tsx` | Book overview with chapters |
| `/book/[bookId]/chapter/[chapterId]` | `app/book/[bookId]/chapter/[chapterId]/page.tsx` | Reading view |
| `/book/[bookId]/test/[chapterId]` | `app/book/[bookId]/test/[chapterId]/page.tsx` | Test view |

### Navigation Patterns

1. **Library → Book Overview**
   ```tsx
   <Link href={`/book/${book.id}`}>
   ```

2. **Book Overview → Chapter Reader**
   ```tsx
   <Link href={`/book/${bookId}/chapter/${chapterId}`}>
   ```

3. **Chapter → Chapter (sequential)**
   - Previous/Next buttons
   - Chapter popover dropdown

4. **Reader → Test**
   ```tsx
   router.push(`/book/${bookId}/test/${chapterId}`)
   ```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run dev server (localhost:3000)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Key Configuration Files

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### `components.json` (Shadcn)
```json
{
  "style": "radix-vega",
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## Future Architecture Considerations

### When Adding Backend

1. **API Routes**
   - Create `/app/api/` folder
   - Add route handlers for:
     - `/api/books` - CRUD operations
     - `/api/upload` - PDF processing
     - `/api/ai/chat` - AI conversations
     - `/api/notes` - Notes management

2. **Database Integration**
   - ORM: Prisma or Drizzle
   - Schema: Users, Books, Chapters, Notes, Highlights, Progress

3. **File Storage**
   - Upload to S3/Cloudinary
   - Generate thumbnails
   - Store PDF URLs

4. **AI Integration**
   - Server-side API calls
   - Context management
   - Streaming responses

### Performance Optimizations (Future)

- Image optimization (next/image)
- Code splitting (dynamic imports)
- Server Components for static content
- Edge runtime for API routes
- PDF streaming for large files

---

## Summary

**Current State:**
- ✅ Well-structured component architecture
- ✅ TypeScript throughout
- ✅ Modern React patterns (hooks)
- ✅ Responsive UI (Tailwind + Shadcn)
- ✅ Client-side state management (Zustand)
- ❌ No backend or data persistence
- ❌ No real PDF processing
- ❌ No AI integration

**Next Steps for Production:**
1. Add backend API routes
2. Integrate database (Prisma + PostgreSQL)
3. Implement PDF parsing (pdf.js or similar)
4. Connect AI API (OpenAI/Anthropic)
5. Add authentication (NextAuth.js)
6. Implement actual note/highlight persistence
7. Build test generation logic

**Architecture Rating:**
- Frontend: Production-ready structure
- Backend: Not yet implemented
- Overall: Solid foundation for MVP, needs backend to be functional
