# GitHub Actions Workflows

## Frontend CI Pipeline (`ci.yml`)

Automated testing and build verification for the webapp.

### Triggers
- Push to `master`, `main`, or `develop` branches
- Pull requests targeting `master`, `main`, or `develop` branches

### Jobs

#### 1. Test Job
Runs on Node.js 18.x and 20.x in parallel.

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js with caching
3. Install dependencies
4. Run ESLint
5. Run Vitest tests with coverage
6. Upload coverage to Codecov

#### 2. Build Job
Verifies production build on Node.js 20.x.

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js with caching
3. Install dependencies
4. Build Next.js application
5. Verify build output

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_WS_URL`: WebSocket URL (default: ws://localhost:8000/ws)

### Status
✅ Pipeline configured and functional
⚠️ Type-check temporarily disabled (see CI_STATUS.md)
