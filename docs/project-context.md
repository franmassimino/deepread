# Project Context - Deepread

## Git Workflow Rules (MANDATORY)

### Protected Branches
- `master` and `main` are **PROTECTED** - never commit directly
- All changes must go through Pull Requests

### Story Implementation Workflow

**Before Starting ANY Story:**
```bash
git checkout master
git pull origin master
git checkout -b feature/story-{epic}.{number}-{short-description}
```

**During Development:**
- Commit frequently with meaningful messages
- Follow conventional commits: `feat:`, `fix:`, `test:`, `refactor:`

**After Completing Story:**
```bash
git add .
git commit -m "feat: {story description}"
git push -u origin feature/story-X.X-description
gh pr create --base master --title "feat: Story X.X - Description" --body "..."
```

**NEVER:**
- Commit directly to master/main
- Merge without PR review
- Push to master directly

### Branch Naming Convention
- Pattern: `feature/story-{epic}.{story}-{short-description}`
- Examples:
  - `feature/story-2.1-basic-file-upload`
  - `feature/story-3.1-job-queue-system`

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Queue:** Redis + BullMQ
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest + React Testing Library

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── lib/
│   ├── services/  # Business logic services
│   ├── db/        # Prisma client and utilities
│   └── queue/     # BullMQ queue configuration
└── components/    # React components
```

## Code Standards

- All new code must have tests
- Follow existing patterns in codebase
- Use Prisma for all database operations
- Services should be in `src/lib/services/`
