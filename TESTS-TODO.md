# Tests Configuration TODO

## Current Status
✅ Tests are organized and working locally
⚠️ Tests are **DISABLED** in production builds (Vercel)

## Why Tests Are Disabled
- Current setup uses SQLite (`prisma/dev.db`)
- SQLite database doesn't exist in Vercel deployment environment
- Integration tests fail because tables don't exist during build

## When to Re-enable Tests

### Once you configure Postgres in production:

1. **Update `package.json`:**
   ```json
   {
     "scripts": {
       "build": "npm run test:ci && next build",  // Change from "next build"
     }
   }
   ```

   Remove the `build:with-tests` script (it becomes the default).

2. **Update Prisma schema to use Postgres:**
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Set DATABASE_URL in Vercel:**
   - Add environment variable with Postgres connection string
   - Example: `postgresql://user:pass@host:5432/dbname`

4. **Run migrations in production:**
   - Vercel should run migrations automatically via `postinstall` or build hooks
   - Or manually: `npx prisma migrate deploy`

5. **Verify tests pass in deployment:**
   - Check Vercel build logs
   - All integration tests should pass with real Postgres DB

## Current Workaround

Locally, you can still run builds with tests:
```bash
npm run build:with-tests
```

For Vercel deployment (production):
```bash
npm run build  # Skips tests, builds only
```

## Files Modified
- `package.json` - Added `build:with-tests`, removed tests from default `build`
- This file - Documentation for future reference

---

**Remember:** Once Postgres is configured, tests will protect production deployments from broken code! 🛡️
