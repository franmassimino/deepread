# Deepread - Documentation Index

**Generated:** 2026-01-13
**Last Updated:** 2026-01-13
**Project:** deepread
**Type:** Monolithic Web Application (Next.js)

---

## 📘 Project Overview

- **Name:** Deepread
- **Type:** Web Application
- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Architecture:** Client-Side Rendered Monolith
- **Status:** Early MVP - UI Implementation Phase

### Quick Summary

Deepread is an AI-powered reading and learning platform designed to transform PDF reading into an active learning experience. The project currently has a complete UI implementation with components, routing, and mock data, but lacks backend logic, AI integration, and data persistence.

---

## 📚 Documentation Files

### Core Documentation

- **[Project Overview](./project-overview.md)** - Complete project summary, features, tech stack, and current limitations
- **[Architecture](./architecture.md)** - Detailed architecture documentation, component structure, state management, and data flow
- **[Project Scan Report](./project-scan-report.json)** - Machine-readable scan metadata

### Existing Project Documentation

- **[README.md](../README.md)** - Main project README with vision, getting started, and tech stack
- **[READING-TOOLBAR-DESIGN.md](../READING-TOOLBAR-DESIGN.md)** - UX design specification for reading toolbar (design intent, not fully implemented)

---

## 🎯 Quick Reference

### Project Type & Tech Stack

| Aspect | Details |
|--------|---------|
| **Project Type** | Web Application |
| **Repository Type** | Monolith (single codebase) |
| **Framework** | Next.js 16.0.10 |
| **React Version** | 19.2.1 |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4.x |
| **UI Components** | Shadcn/UI (Radix-based) |
| **State Management** | Zustand 5.0.9 |
| **Icons** | Lucide React |

### Architecture Pattern

**Current:** Client-Side Rendered (CSR) Next.js App Router

```
Browser (Client)
    ↓
Next.js App (TypeScript + React)
    ↓
Zustand Stores (Client State)
    ↓
Mock Data (Hardcoded in lib/)
```

**No Backend Yet**
- No database
- No file storage
- No AI integration
- No authentication

---

## 📂 Directory Structure

```
deepread/
├── app/                          # Next.js App Router (Routes)
│   ├── page.tsx                  # Home / Library view
│   ├── layout.tsx                # Root layout
│   └── book/[bookId]/            # Dynamic routes
│       ├── page.tsx              # Book overview
│       ├── chapter/[chapterId]/  # Chapter reader
│       └── test/[chapterId]/     # Test view
│
├── components/                   # React Components
│   ├── screens/                  # Full-page views
│   ├── reading/                  # Reading-specific components
│   └── ui/                       # Shadcn UI components (40+)
│
├── lib/                          # Utilities & Data
│   ├── mock-book-data.ts         # Hardcoded book/chapters
│   ├── books-store.tsx           # Zustand store (books)
│   ├── upload-store.tsx          # Zustand store (uploads)
│   └── utils.ts                  # Helper functions
│
├── hooks/                        # Custom React Hooks
│   ├── use-text-selection.ts
│   ├── use-sidebar-storage.ts
│   └── use-media-query.ts
│
├── public/                       # Static assets
└── docs/                         # This documentation
```

---

## 🚀 Routes & Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Library view with book grid |
| `/book/:id` | `app/book/[bookId]/page.tsx` | Book overview with chapters list |
| `/book/:id/chapter/:chapterId` | `app/book/[bookId]/chapter/[chapterId]/page.tsx` | Chapter reader with sidebar tools |
| `/book/:id/test/:chapterId` | `app/book/[bookId]/test/[chapterId]/page.tsx` | Chapter test/quiz interface |

---

## 🎨 Key Features

### ✅ Implemented (UI Only)

1. **Library View** - Book grid with progress indicators
2. **Book Upload Dialog** - Simulated PDF upload with progress animation
3. **Book Overview** - Chapter list and metadata display
4. **Reading View** - PDF viewer mockup with:
   - Resizable learning sidebar
   - Chapter navigation
   - Text selection popover
   - Reading mode toolbar
5. **Learning Sidebar** - Tabs for AI Assistant, Notes, and Tests (UI shells)
6. **Responsive Design** - Mobile and desktop layouts

### ❌ Not Implemented (Backend/Logic)

1. **PDF Processing** - No actual PDF parsing or text extraction
2. **AI Integration** - No LLM API, no conversational interface
3. **Data Persistence** - No database, no file storage
4. **Authentication** - No user accounts
5. **Real Functionality** - Notes, highlights, tests are UI mockups

---

## 📊 State Management

### Zustand Stores

1. **Books Store** (`lib/books-store.tsx`)
   - Manages list of books in library
   - `addBook()`, `removeBook()`
   - Empty on init, populated via mock upload

2. **Upload Store** (`lib/upload-store.tsx`)
   - Tracks PDF upload progress (simulated)
   - Multi-step animation (6 steps)
   - Auto-adds to books store on completion

**Note:** All state is in-memory only. No persistence across page reloads.

---

## 🛠️ Development

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Configuration

- **TypeScript:** Strict mode, path aliases (`@/*`)
- **Tailwind:** Neutral palette, Radix Vega style
- **Shadcn:** Copy-paste components, Radix UI primitives
- **ESLint:** Next.js + TypeScript rules

---

## 🔮 Future Architecture (Planned)

### Backend Integration

```
Frontend (Current)
    ↓
Next.js API Routes (Future)
    ↓
┌──────────┬──────────────┬─────────────┐
│ Database │ File Storage │ AI Service  │
│ (Prisma) │   (S3/CDN)   │ (OpenAI API)│
└──────────┴──────────────┴─────────────┘
```

### Planned Features

1. **PDF Processing:**
   - Upload and parse PDFs
   - Extract text and metadata
   - Auto-detect chapters

2. **AI Integration:**
   - Conversational AI with book context
   - Question answering per chapter
   - Web search augmentation

3. **Data Persistence:**
   - User accounts and authentication
   - Save notes and highlights
   - Track reading progress
   - Sync across devices

4. **Test Generation:**
   - AI-generated comprehension questions
   - Chapter-based quizzes
   - Full-book assessments

---

## ⚠️ Current Limitations

1. **No Real Data** - All content is hardcoded mock data
2. **No Persistence** - Changes lost on page refresh
3. **Desktop-Focused** - Not fully optimized for mobile
4. **Single-User** - No multi-user support
5. **No Search** - Cannot search within books
6. **No PDF Support** - Cannot actually upload or process PDFs

---

## 📄 Data Models (Mock)

### Book

```typescript
interface Book {
  id: string
  title: string
  author?: string
  progress: number               // 0-100
  status: 'reading' | 'consolidating' | 'completed'
  lastActivity: string
  coverColor: string
}
```

### Chapter (from mock-book-data.ts)

```typescript
interface Chapter {
  id: string
  number: number
  title: string
  content: string                // HTML string
  wordCount: number
  estimatedReadingTime: number   // minutes
}
```

**Current Mock Data:** "Designing Data-Intensive Applications" with 12 chapters

---

## 🎯 For AI Agents & Developers

### When Planning New Features (PRD)

1. **Start Here:**
   - Review [Project Overview](./project-overview.md) for current state
   - Check [Architecture](./architecture.md) for technical details
   - Note the distinction between **implemented UI** vs. **intended functionality**

2. **Key Contexts:**
   - README and READING-TOOLBAR-DESIGN are **design intentions**, not current implementation
   - The codebase is **UI-first** - components exist but lack backend logic
   - State management is basic - only books list and upload progress

3. **What to Build On:**
   - ✅ Solid component architecture
   - ✅ Type-safe TypeScript throughout
   - ✅ Responsive UI framework
   - ❌ No backend - needs full API layer
   - ❌ No real data - needs database schema
   - ❌ No AI - needs LLM integration strategy

### Architecture Reference

- **Frontend:** Production-ready structure, well-organized
- **Backend:** Not implemented - clean slate for API design
- **Database:** Not implemented - schema needs design
- **AI:** Not implemented - integration strategy needed

---

## 📞 Next Steps for Development

1. **Phase 1: Backend Foundation**
   - Set up database (Prisma + PostgreSQL)
   - Create API routes structure
   - Implement authentication

2. **Phase 2: PDF Processing**
   - Integrate PDF.js or similar
   - Build text extraction pipeline
   - Implement chapter detection algorithm

3. **Phase 3: AI Integration**
   - Connect to OpenAI/Anthropic API
   - Build context management system
   - Implement conversational interface

4. **Phase 4: Core Features**
   - Notes persistence
   - Highlight management
   - Progress tracking
   - Test generation logic

---

## 📝 Documentation Maintenance

**When to Update:**
- After adding backend/database
- When AI integration is implemented
- As features move from mock → real
- When architecture changes

**How to Update:**
- Regenerate with `document-project` workflow
- Or manually update relevant sections
- Keep project-scan-report.json in sync

---

## 🔍 Quick Find

**Looking for...**

- Component structure? → [Architecture - Component Architecture](./architecture.md#component-architecture)
- State management? → [Architecture - State Management](./architecture.md#state-management)
- Routes? → [Architecture - Routing & Navigation](./architecture.md#routing--navigation)
- Tech stack details? → [Project Overview - Technology Stack](./project-overview.md#technology-stack)
- Current limitations? → [Project Overview - Current Limitations](./project-overview.md#current-limitations)
- Development setup? → [Architecture - Development Workflow](./architecture.md#development-workflow)

---

**📌 Remember:** This documentation reflects the **current implementation state** (UI mockups), not the full vision described in README.md. Use this as a reference for what exists today, and the README for the intended final product.
