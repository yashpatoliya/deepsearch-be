# Backend Implementation Plan: MVP Features & Cost Optimization

Based on the audit of the current codebase (`deep-research-engine`), the requested core features (PostgreSQL, RBAC, Cloud Storage, and advanced Cost Optimization limits) are **not currently implemented**. The backend currently only relies on Redis for caching and BullMQ for processing, and lacks any persistent relational database or user management.

Below is the detailed phased implementation plan to build out the MVP architecture while strictly adhering to the "Cost Optimization" and "No Advanced Features" guidelines.

---

## Phase 0: Deep Search Engine Core (PRIORITY)

**Status**: In Progress
**Goal**: Implement the core Deep Search Engine module with temporary auth skip for testing.

### Deep Search Engine Module

- **Search Types**: Support full name, username, email, phone number, city, company, social handle
- **Search Categories**:
  - Social media accounts (Instagram, Facebook, LinkedIn, X/Twitter, TikTok, GitHub, Reddit, Pinterest)
  - Photos & Videos
  - Web mentions
  - Education & Professional background
  - Dating profiles
  - Family relations
  - Business profiles
  - Location history
  - Public documents
  - News mentions

### Search Flow Architecture

1. **Input Validation**: Validate search query and type
2. **Job Creation**: Create search job with unique ID
3. **Queue Processing**: Push to BullMQ background queue
4. **Parallel Workers**: Execute multiple search strategies simultaneously:
   - Web scraping (cheerioScraper)
   - Search APIs (DuckDuckGo, etc.)
   - Public profile matching
   - Social profile extraction
   - Metadata extraction
   - Image indexing
   - AI confidence scoring
5. **Result Storage**: Store results in Redis/PostgreSQL
6. **Real-time Updates**: Socket.IO progress updates
7. **Report Generation**: Compile final comprehensive report

### Search Result System

Each report contains structured data:

- **Identity**: Full name, aliases, username variations, gender prediction, age estimation
- **Social Profiles**: Links to all discovered social media accounts
- **Professional Data**: Current company, previous jobs, skills, education, resumes
- **Location Data**: Country, city, region, possible residence
- **Media**: Photos, videos, profile images
- **Public Mentions**: Blogs, forums, news articles, comments
- **Relationship Signals**: Associated people, family members, business relations
- **Confidence Scores**: Match percentage, source quality, confidence level

### AI Layer Integration

- **Duplicate Detection**: Identify duplicate identities
- **Smart Matching**: Profile matching algorithms
- **Confidence Scoring**: AI-powered confidence levels
- **Face Similarity**: Placeholder for future face recognition
- **Natural Language Summaries**: Generate human-readable summaries
- **Risk Scoring**: Calculate risk assessment scores
- **AI Reports**: Generate comprehensive final reports

### Technical Implementation

- **Temporary Auth Skip**: Bypass authentication for initial testing
- **Socket.IO Setup**: Real-time progress updates
- **Worker Architecture**: Multiple parallel search workers
- **Result Aggregation**: Combine and deduplicate results
- **Report Generation**: Create structured JSON reports

---

## Phase 1: Database & Core Infrastructure

**Status**: Pending
**Goal**: Establish a single source of truth using PostgreSQL and simplify the deployment structure.

- **Remove DevOps Overkill**: Delete any existing complex deployment configurations. Ensure `Dockerfile` and `docker-compose.yml` are stripped down for simple single-VPS or Render/Railway deployment.
- **Prisma & PostgreSQL Setup**: Install Prisma ORM (`npm install prisma @prisma/client`).
- **Database Schema**: Define the initial schema for:
  - `User` (id, email, password_hash, role, credits, etc.)
  - `Search` (cached queries, results)
  - `Report` (generated reports)
  - `Analytics` & `Logs`
  - `Billing`
  - `Notification`
- **Connection**: Configure `.env` to connect to Neon PostgreSQL free tier or Supabase PostgreSQL.

## Phase 2: Robust Authentication & RBAC

**Status**: Pending
**Goal**: Implement a bulletproof Role-Based Access Control system that defaults to `USER` safely.

- **Auth Module**: Implement secure login/registration (JWT + bcrypt).
- **RBAC Middleware**:
  - Roles: `USER`, `ADMIN`, `SUPER_ADMIN`.
  - **Fallback Safety**: Middleware must explicitly treat missing or invalid roles as `USER`.
  - Prevent admin route access by default.
- **Permission Guards**: Create explicit decorators/middleware for:
  - `search:create`
  - `report:view`
  - `billing:manage`
  - `admin:users`
- **Auto-Seeding**: Create a startup script to seed the Super Admin and default role definitions.

## Phase 3: Cheap Media Storage Abstraction

**Status**: Pending
**Goal**: Implement an S3-compatible storage layer prioritizing Cloudflare R2 for zero egress fees.

- **Storage Interface**: Build an abstract `StorageService` so the provider can be swapped later without breaking code.
- **Cloudflare R2 Integration**: Use `@aws-sdk/client-s3` to connect to Cloudflare R2 (S3 compatible).
- **Local Fallback**: Implement local storage driver for early MVP testing if R2 credentials are not immediately available.
- **Upload Endpoints**: Create secure endpoints for uploading/retrieving files and generated reports.

## Phase 4: Cost Optimization & Protection Mechanisms

**Status**: Pending
**Goal**: Build protective measures to prevent runaway costs, API abuse, and excessive resource usage.

- **Queue & Caching Updates**:
  - Migrate to Upstash Redis for serverless cache/queues (or keep local Redis for VPS).
  - Configure `BullMQ` for queueing expensive jobs.
- **API Cost Protection**:
  - Implement user credit system (deduct credits per search/report).
  - Daily usage limits & rate limiting per IP/User.
  - Search cooldowns to prevent spamming.
- **Search Optimization**:
  - Cache repeated searches heavily in PostgreSQL.
  - Deduplicate identical concurrent requests.
- **Email Setup**: Integrate `Resend` (free tier) for transactional emails.

## Phase 5: Cleanup & MVP Readiness

**Status**: Pending
**Goal**: Strip out anything that isn't strictly MVP.

- **Prune Features**: Ensure no code exists for Chrome extensions, AI chat, graph visualization, OSINT, etc.
- **Final Review**: Validate that the entire stack can run locally with just `docker-compose up` (Postgres + Redis) and starts flawlessly.

## Phase 6: Frontend APIs Implementation

**Status**: Pending
**Goal**: Implement all required frontend-facing API endpoints for the user dashboard and homepage.

- **Homepage Statistics API**: GET /api/v1/stats/homepage
  - Return total searches, active users, recent activity metrics
- **Latest Searches API**: GET /api/v1/searches/latest
  - Return user's recent search history (authenticated)
- **Search Suggestions API**: GET /api/v1/search/suggestions
  - Provide autocomplete suggestions based on query prefix
- **Trending Searches API**: GET /api/v1/searches/trending
  - Return popular/trending search queries
- **Search Report Progress API**: GET /api/v1/reports/:id/progress
  - Real-time progress updates for ongoing report generation
- **Saved Reports API**: GET /api/v1/reports/saved
  - List user's saved/generated reports
- **Dashboard Analytics API**: GET /api/v1/analytics/dashboard
  - Comprehensive analytics data for user dashboard
- **Subscription Status API**: GET /api/v1/subscription/status
  - Current subscription plan and status
- **Credit Usage API**: GET /api/v1/credits/usage
  - Current credit balance and usage history

- **Route Organization**: Create new route files as needed (e.g., stats.ts, reports.ts, analytics.ts)
- **Authentication**: Ensure all user-specific endpoints require authentication
- **Caching**: Implement appropriate caching for public endpoints (stats, trending)
- **Rate Limiting**: Apply rate limits based on endpoint sensitivity

---

_Note: All phases will strictly avoid MongoDB, AWS S3 (initially), and complex Kubernetes/DevOps setups._

**Status**: Pending
**Goal**: Establish a single source of truth using PostgreSQL and simplify the deployment structure.

- **Remove DevOps Overkill**: Delete any existing complex deployment configurations. Ensure `Dockerfile` and `docker-compose.yml` are stripped down for simple single-VPS or Render/Railway deployment.
- **Prisma & PostgreSQL Setup**: Install Prisma ORM (`npm install prisma @prisma/client`).
- **Database Schema**: Define the initial schema for:
  - `User` (id, email, password_hash, role, credits, etc.)
  - `Search` (cached queries, results)
  - `Report` (generated reports)
  - `Analytics` & `Logs`
  - `Billing`
  - `Notification`
- **Connection**: Configure `.env` to connect to Neon PostgreSQL free tier or Supabase PostgreSQL.

## Phase 2: Robust Authentication & RBAC

**Status**: Pending
**Goal**: Implement a bulletproof Role-Based Access Control system that defaults to `USER` safely.

- **Auth Module**: Implement secure login/registration (JWT + bcrypt).
- **RBAC Middleware**:
  - Roles: `USER`, `ADMIN`, `SUPER_ADMIN`.
  - **Fallback Safety**: Middleware must explicitly treat missing or invalid roles as `USER`.
  - Prevent admin route access by default.
- **Permission Guards**: Create explicit decorators/middleware for:
  - `search:create`
  - `report:view`
  - `billing:manage`
  - `admin:users`
- **Auto-Seeding**: Create a startup script to seed the Super Admin and default role definitions.

## Phase 3: Cheap Media Storage Abstraction

**Status**: Pending
**Goal**: Implement an S3-compatible storage layer prioritizing Cloudflare R2 for zero egress fees.

- **Storage Interface**: Build an abstract `StorageService` so the provider can be swapped later without breaking code.
- **Cloudflare R2 Integration**: Use `@aws-sdk/client-s3` to connect to Cloudflare R2 (S3 compatible).
- **Local Fallback**: Implement local storage driver for early MVP testing if R2 credentials are not immediately available.
- **Upload Endpoints**: Create secure endpoints for uploading/retrieving files and generated reports.

## Phase 4: Cost Optimization & Protection Mechanisms

**Status**: Pending
**Goal**: Build protective measures to prevent runaway costs, API abuse, and excessive resource usage.

- **Queue & Caching Updates**:
  - Migrate to Upstash Redis for serverless cache/queues (or keep local Redis for VPS).
  - Configure `BullMQ` for queueing expensive jobs.
- **API Cost Protection**:
  - Implement user credit system (deduct credits per search/report).
  - Daily usage limits & rate limiting per IP/User.
  - Search cooldowns to prevent spamming.
- **Search Optimization**:
  - Cache repeated searches heavily in PostgreSQL.
  - Deduplicate identical concurrent requests.
- **Email Setup**: Integrate `Resend` (free tier) for transactional emails.

## Phase 5: Cleanup & MVP Readiness

**Status**: Pending
**Goal**: Strip out anything that isn't strictly MVP.

- **Prune Features**: Ensure no code exists for Chrome extensions, AI chat, graph visualization, OSINT, etc.
- **Final Review**: Validate that the entire stack can run locally with just `docker-compose up` (Postgres + Redis) and starts flawlessly.

## Phase 6: Frontend APIs Implementation

**Status**: Pending
**Goal**: Implement all required frontend-facing API endpoints for the user dashboard and homepage.

- **Homepage Statistics API**: GET /api/v1/stats/homepage
  - Return total searches, active users, recent activity metrics
- **Latest Searches API**: GET /api/v1/searches/latest
  - Return user's recent search history (authenticated)
- **Search Suggestions API**: GET /api/v1/search/suggestions
  - Provide autocomplete suggestions based on query prefix
- **Trending Searches API**: GET /api/v1/searches/trending
  - Return popular/trending search queries
- **Search Report Progress API**: GET /api/v1/reports/:id/progress
  - Real-time progress updates for ongoing report generation
- **Saved Reports API**: GET /api/v1/reports/saved
  - List user's saved/generated reports
- **Dashboard Analytics API**: GET /api/v1/analytics/dashboard
  - Comprehensive analytics data for user dashboard
- **Subscription Status API**: GET /api/v1/subscription/status
  - Current subscription plan and status
- **Credit Usage API**: GET /api/v1/credits/usage
  - Current credit balance and usage history

- **Route Organization**: Create new route files as needed (e.g., stats.ts, reports.ts, analytics.ts)
- **Authentication**: Ensure all user-specific endpoints require authentication
- **Caching**: Implement appropriate caching for public endpoints (stats, trending)
- **Rate Limiting**: Apply rate limits based on endpoint sensitivity

---

_Note: All phases will strictly avoid MongoDB, AWS S3 (initially), and complex Kubernetes/DevOps setups._
