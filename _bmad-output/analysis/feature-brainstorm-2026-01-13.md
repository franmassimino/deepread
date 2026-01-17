# Deepread - Feature Brainstorm Session

**Date:** 2026-01-13
**Participant:** Francisco
**Facilitator:** Mary (Business Analyst Agent)
**Duration:** 15 minutes (express session)
**Goal:** Clarify and prioritize features for MVP

---

## Project Context

**Problem:**
- Physical books are expensive but effective for learning
- Digital PDFs are accessible but passive → poor engagement and retention
- Users struggle to stay focused and retain information when reading PDFs

**Solution:**
Web platform that transforms PDF reading into an active learning experience with AI assistance

**Target Users:**
- Primary: Francisco (personal use)
- Secondary: Compañeros studying technical/university topics
- Scope: Personal project, non-commercial

**Platform:**
- Desktop-first web application
- Next.js + TypeScript (existing codebase has UI foundation)

---

## Core User Flow

### Reading Flow (Flexible)
1. User uploads PDF book
2. System auto-detects chapters
3. User can jump between chapters freely
4. System tracks progress per chapter:
   - ✅ Entered (visited chapter)
   - ✅ Read (finished reading)
   - ✅ Quiz completed

### 100% Completion Criteria
To complete a book at 100%:
- Read all chapters (visited + read)
- Complete quiz for each chapter
- Complete final book quiz

---

## Feature Set (Prioritized)

### 🎯 MVP Features (Must-Have)

#### 1. PDF Management
- **Upload PDF** - Support PDF files, extract text
- **Auto-detect chapters** - Parse structure and create chapter list
- **PDF viewer** - Display PDF with navigation controls
- **Chapter navigation** - Jump between chapters, previous/next
- **Future:** EPUB support (post-MVP)

#### 2. Reading Experience
- **Text selection** - Select text for highlights and notes
- **Highlights** - Mark important passages with colors
- **Notes per chapter** - Add personal notes linked to specific chapters
- **Reading progress tracking** - Track entry, completion per chapter

#### 3. AI Features (3 Specialized Agents)

##### AI #1: Conversational Assistant
- **Context:** Current chapter + full book context
- **Purpose:** Answer questions about content
- **Interface:** Chat sidebar in reading view
- **Future enhancement:** Tool use (web search, etc.)

##### AI #2: Summary Generator
- **Trigger:** On-demand (user clicks "Generate Summary")
- **Output:** Chapter summary or full book summary
- **Can regenerate:** User can request new summary if needed

##### AI #3: Quiz Generator
- **Question types:**
  - Multiple choice (4 options, 1 correct)
  - Open-ended questions (AI evaluates answer)
- **Difficulty levels:** User selects (Easy / Medium / Hard)
- **Scope:** Per chapter OR full book
- **Grading:** Auto-grade MC, AI evaluates open-ended

#### 4. Progress Tracking System
- **Chapter-level tracking:**
  - Visited (user opened chapter)
  - Read (user finished reading - scroll to bottom?)
  - Quiz completed (user took and passed quiz)
- **Book-level tracking:**
  - Overall percentage complete
  - Number of chapters completed
  - Final quiz status

#### 5. Quiz System
- **Generate quiz:** AI creates questions based on chapter/book content
- **Take quiz:** User answers questions
- **Review results:** Show correct/incorrect answers
- **Retake option:** User can retake quiz to improve score
- **Minimum passing score?** (TBD - could be 70% or configurable)

---

## Features NOT in MVP (Future)

❌ **Web search in AI** - Conversational AI stays book-focused only
❌ **Export notes** - No download/export functionality yet
❌ **EPUB support** - PDF only for now
❌ **Mobile optimization** - Desktop-first, basic responsive only
❌ **Multi-user accounts** - Single user or simple auth only
❌ **Collaboration** - No sharing notes/highlights with others
❌ **Spaced repetition** - No SRS system yet
❌ **Flashcards** - Not in MVP
❌ **Book recommendations** - No AI suggestions
❌ **Reading stats/analytics** - Basic progress only

---

## Key Design Decisions

### 1. Multiple AI Agents vs. Single AI
**Decision:** Use 3 specialized AI agents
**Reasoning:**
- Clearer separation of concerns
- Different prompting strategies per use case
- Can optimize each agent independently
- Better cost control (use cheaper models for summaries/quizzes if needed)

### 2. Summary Generation Timing
**Decision:** On-demand only (not auto-generated)
**Reasoning:**
- User control over when they want summaries
- Saves AI costs (don't generate unused summaries)
- User might want to try understanding first before seeing summary

### 3. Quiz Difficulty
**Decision:** User selects difficulty before generation
**Reasoning:**
- Accommodates different learning goals
- Beginners can start easy, experts can challenge themselves
- Same content, different question complexity

### 4. Progress Tracking Granularity
**Decision:** Track 3 states per chapter (visited, read, quiz)
**Reasoning:**
- Simple and clear
- Easy to visualize progress
- Motivates completion (gamification element)

---

## User Stories (Quick Format)

### PDF Upload & Reading
- As a user, I want to upload a PDF book so I can read it in the app
- As a user, I want chapters auto-detected so I don't have to manually split content
- As a user, I want to navigate between chapters so I can read non-linearly

### Active Learning
- As a user, I want to highlight important text so I can review key concepts later
- As a user, I want to add notes to chapters so I can capture my thoughts
- As a user, I want to ask an AI questions about the chapter so I can clarify doubts

### Comprehension & Retention
- As a user, I want to generate a summary of a chapter so I can review key points
- As a user, I want to take quizzes on each chapter so I can test my understanding
- As a user, I want to choose quiz difficulty so I can match my learning level

### Progress & Motivation
- As a user, I want to see my overall book progress so I know how much I've completed
- As a user, I want to track which chapters I've read and quizzed so I can plan my study
- As a user, I want to complete a final quiz so I can validate my full book comprehension

---

## Technical Considerations

### Existing Foundation
- ✅ UI components already built (Shadcn/UI)
- ✅ Routing structure exists (App Router)
- ✅ State management ready (Zustand)
- ❌ No backend yet
- ❌ No database schema
- ❌ No AI integration

### Backend Requirements (New)
- **Database:** Store users, books, chapters, notes, highlights, progress, quiz results
- **File storage:** Store uploaded PDFs (S3, Cloudinary, etc.)
- **PDF processing:** Extract text, detect chapters (pdf.js or similar)
- **AI integration:** OpenAI/Anthropic API for 3 agents
- **Authentication:** NextAuth.js (simple, can start with magic link or Google)

### AI Agent Prompting Strategy
1. **Conversational AI:** System prompt with book context + chapter context
2. **Summary AI:** One-shot generation with content + desired length
3. **Quiz AI:** Generate JSON array of questions with difficulty parameter

---

## Open Questions (For PRD/Architecture)

1. **Chapter detection algorithm:** How to reliably detect chapters from PDFs?
   - Heuristics based on font size, "Chapter X" keywords?
   - Let user manually adjust if auto-detection fails?

2. **Reading completion trigger:** How do we know user "finished reading"?
   - Scroll to bottom of chapter?
   - Time-based (spent X minutes)?
   - Manual "Mark as read" button?

3. **Quiz passing criteria:**
   - What's the minimum score to mark chapter as "quiz completed"?
   - Can user retake unlimited times or limit attempts?

4. **Highlight/Note data structure:**
   - Store position in PDF (page + coordinates)?
   - Store position in extracted text (character offset)?
   - Both?

5. **AI cost management:**
   - How to handle API costs for personal project?
   - Rate limiting for quiz generation?
   - Cache summaries to avoid regeneration?

---

## Success Metrics (Post-Launch)

**For Francisco:**
- Complete at least 1 full book with 100% progress
- Take notes on 50%+ of chapters
- Use AI assistant for at least 10 questions

**If shared with compañeros:**
- 3-5 active users in first month
- Average book completion rate >30%
- Positive feedback on AI quality

---

## Next Steps

1. ✅ Feature brainstorm complete
2. ⏭️ Create PRD (Product Requirements Document)
3. ⏭️ Design UX (already have some mockups)
4. ⏭️ Design Architecture
5. ⏭️ Create Epics & Stories
6. ⏭️ Sprint Planning

---

**Session Notes:**
This was an express 15-minute session focused on clarifying features and priorities. The feature set is intentionally scoped for MVP to ship quickly and iterate based on real usage. Future enhancements (web search, export, EPUB, collaboration) can be added after validating core value proposition.
