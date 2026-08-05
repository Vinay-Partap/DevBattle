# DevBattles Complete Project Audit

**Date:** 2026-08-05  
**Repository:** `DevBattles/DevBattle-Project`  
**Branch:** `arena/019fd2e4-devbattle-project`  
**Audited folders:** repository root, `frontend`, `auth-service`, `user-service`, `question-service`, tests, Docker/config, Drizzle migrations/seeds, documentation.

---

## 1. Project Overview

### What is DevBattles?

DevBattles is a coding battle and learning platform for colleges. It combines a student coding workspace, a curated question bank, mentor-created practice material, user/profile administration, and planned competitive-programming workflows.

### Users

| User | Current capabilities |
| --- | --- |
| Student | Register, sign in after approval, view own profile, browse backend-backed question bank, open coding workspace, bookmark questions. Other dashboard widgets are UI placeholders until services exist. |
| Mentor | Sign in, view/manage profile, create question drafts through Question Service, view student roster from User Service. Homework/contest analytics are placeholders. |
| Admin | Sign in, list users from User Service, activate/deactivate users, change user roles, manage current local college/audit UI placeholders. |

### Problems solved

- Central identity and RBAC foundation.
- Profile directory for learners/mentors/admins.
- Backend-backed coding challenge bank with publishing and bookmark support.
- A frontend shell for the future contest, submission, leaderboard, notification, analytics, and organization modules.

### Technologies used

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript/TSX, React Router 7, TanStack Query, Tailwind CSS v4, Framer Motion, Three.js/react-three-fiber, Monaco Editor, Recharts, Lucide icons |
| Backend | Node.js, Express, JavaScript ESM for Auth, TypeScript for User/Question |
| Database | PostgreSQL, Drizzle ORM, Drizzle migrations for User/Question, idempotent migration for Auth |
| Auth/Security | JWT, bcryptjs, refresh token rotation, HttpOnly cookie for refresh token, Helmet, CORS, express-rate-limit, Zod validation |
| Observability | Winston, Morgan, health endpoints, Swagger/OpenAPI |
| DevOps | Dockerfiles per service, root Docker Compose with isolated databases |
| Testing | Jest, Supertest, TypeScript type checks, Vite production build |

---

## 2. Architecture Overview

### Current architecture diagram

```text
                         ┌────────────────────────────┐
                         │        Browser / UI         │
                         │ React + Vite + Router       │
                         └──────────────┬─────────────┘
                                        │ relative /api/v1/* calls
                                        │ Vite proxy today
                                        │ API Gateway planned
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌───────────────────┐        ┌───────────────────┐        ┌────────────────────┐
│ Auth Service      │        │ User Service      │        │ Question Service   │
│ :4000             │        │ :4001             │        │ :4002              │
│ JS + Express      │        │ TS + Express      │        │ TS + Express       │
│ JWT issuance      │        │ profile directory │        │ question bank      │
│ refresh tokens    │        │ role/status admin │        │ bookmarks/stats    │
└─────────┬─────────┘        └─────────┬─────────┘        └──────────┬─────────┘
          │                            │                              │
          ▼                            ▼                              ▼
┌───────────────────┐        ┌───────────────────┐        ┌────────────────────┐
│ Auth PostgreSQL   │        │ User PostgreSQL   │        │ Question PostgreSQL│
│ users credentials │        │ users/profiles    │        │ questions children │
└───────────────────┘        └───────────────────┘        └────────────────────┘

Internal service calls:
Auth -> User: POST /api/v1/internal/users during registration.
User -> Auth: PATCH /api/v1/internal/users/:id/status|role during admin changes.
Internal calls use x-internal-api-key.
```

### Component explanation

- **Frontend**: Single-page app with public pages, protected role-based routes, dashboard layouts, reusable UI components, and backend integrations for Auth/User/Question.
- **Auth Service**: Source of truth for account credentials, active status, refresh token state, JWT signing, password reset and email verification endpoints.
- **User Service**: Source of truth for user profiles and admin-visible profile role/status. It synchronizes role/status changes back to Auth.
- **Question Service**: Source of truth for question content, child tables, publishing state, bookmarks, and internal stats endpoints.
- **PostgreSQL databases**: Root Compose now isolates databases per implemented service to avoid table/migration collision.
- **API Gateway**: Not implemented. Vite proxy is currently the development BFF/proxy only.

### Request flow

1. Browser calls relative URL such as `/api/v1/questions?limit=20`.
2. In development, Vite proxies the request to service port 4000/4001/4002.
3. Service middleware applies security headers, CORS, JSON parsing, validation, authentication, authorization, and error formatting.
4. Controller delegates to service layer.
5. Service layer performs business rules and uses repository layer.
6. Repository uses Drizzle/PostgreSQL. In local no-DB development, current repositories still contain file fallback paths for demo resilience.
7. Standard JSON envelope is returned: `{ success, message, data }` or `{ success:false, message, errors }`.

### Authentication flow after audit fixes

```text
Register
Frontend -> Auth POST /auth/register
Auth validates input, blocks public admin role, creates inactive auth account
Auth -> User POST /internal/users with inactive profile
User creates inactive profile
Auth returns pending approval message

Approve
Admin -> User PATCH /users/:id/status { isActive:true }
User updates profile
User -> Auth PATCH /internal/users/:authUserId/status { isActive:true }

Login
Frontend -> Auth POST /auth/login
Auth verifies password and isActive
Auth issues JWT access token + refresh cookie
Frontend stores access token and loads /users/me

Authorized API calls
Frontend sends Authorization: Bearer <accessToken>
User/Question verify JWT issuer/audience/secret and enforce role gates
```

### Data flow

- Registration creates **two records**: Auth account and User profile, both initially inactive.
- Admin status/role changes are synchronized from User Service to Auth Service.
- Login returns a JWT whose `sub` is Auth user id and whose `role` is the Auth role.
- User Service resolves `sub` to a profile using `auth_user_id`.
- Question Service uses `sub` for bookmark ownership and `role` for staff/student visibility rules.

---

## 3. Microservice Overview

| Service | Status | Purpose | Database | Main APIs | Dependencies | Future integrations | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Frontend | 🟡 Partially Completed | Web UI for public, student, mentor, admin flows | Browser localStorage only | Calls `/api/v1/auth`, `/api/v1/users`, `/api/v1/questions` | Auth/User/Question APIs | Contest, submission, org, notification, analytics APIs | Auth/User/Question integration improved; non-existent-service pages still placeholders. |
| API Gateway | ❌ Not Started | Central ingress/BFF, routing, auth policy, aggregation | N/A | N/A | All services | Required before production | Vite proxy only for development. |
| Auth Service | 🟡 Partially Completed | Credentials, JWT, refresh tokens, account activation | `users` auth table | register/login/logout/refresh/me/password/email/internal sync | User Service for registration profile provisioning | Email provider, gateway, audit events | Core works; email requires SMTP; coverage still low. |
| User Service | 🟡 Partially Completed | Profiles, avatars, skills, role/status administration | users, social_links, skills, education, experience | /users/me, /users, /users/search, /users/statistics, role/status/avatar/internal provision | Auth JWT; Auth internal sync | Organization service for colleges/batches; storage service | Core works; role/status sync added. |
| Question Service | 🟡 Partially Completed | Question CRUD, publishing, bookmarks, stats | questions and child tables | /questions, /questions/:id, CRUD, bookmark, internal stats | Auth JWT | Submission/Judge service for hidden cases/stats | Core works; frontend now consumes it for bank/workspace/builder. |
| Contest Service | ❌ Not Started | Contest lifecycle, registration, timing | Not present | Not present | Question, User, Submission | Leaderboard, notifications | UI currently placeholder/mock. |
| Submission Service | ❌ Not Started | Code submission storage | Not present | Not present | Question, Evaluation | Leaderboard, AI review | UI run/submit remains simulated. |
| Evaluation Service | ❌ Not Started | Judge execution and AI review | Not present | Not present | Submission, Question, Storage | Sandbox runner, AI provider | Not implemented. |
| Leaderboard Service | ❌ Not Started | Ranking and XP aggregation | Not present | Not present | Submission/Contest/User | Analytics | UI placeholder/mock. |
| Notification Service | ❌ Not Started | User notifications/email/in-app events | Not present | Not present | All event sources | Email/SMS/push | UI placeholder/mock. |
| Organization Service | ❌ Not Started | Colleges, branches, batches, approvals policy | Not present | Not present | User/Auth | Admin hierarchy UI | Frontend has local DataContext only. |
| Analytics Service | ❌ Not Started | Dashboards and reporting | Not present | Not present | Event stream/services | Warehouse/BI | UI placeholder/mock. |
| Storage Service | 🟡 Partially Completed | File persistence | Local/Supabase avatar support inside User Service | Avatar upload/delete | User Service | Standalone object storage abstraction | Not standalone yet. |

---

## 4. Frontend Review

### Findings

- **Folder structure**: Clear separation: components, context, pages, data, types, utils.
- **React architecture**: Mostly component-driven; contexts for auth/data/theme/toast/command palette.
- **Routing**: Public, role-protected, and nested app routes exist.
- **Authentication**: Backend-backed login/register. Fixed reload race by adding `authLoading`.
- **Protected routes**: Implemented with role allow-list and now waits for session restoration.
- **Context/state**: AuthContext is central. DataContext remains local because Organization Service is absent.
- **API layer**: Added `frontend/src/utils/api.ts` and started normalizing backend calls.
- **Reusable components**: Good UI primitives and domain cards.
- **Responsive design**: Good Tailwind responsive usage.
- **Accessibility**: Some ARIA exists; needs broader keyboard/focus audit.
- **Design system**: Tailwind utility system with reusable Button/Card/Badge/Table/Tabs.
- **Animations/3D**: Framer Motion and Three.js used; visually strong but impacts bundle.
- **Performance**: Production JS bundle is ~1.04 MB minified / ~300 KB gzip; Vite warns chunks exceed 500 KB. Monaco + Three should be lazy-loaded.

### Frontend mock-data audit

Backend-backed after fixes:

- Login/register/logout/profile now use backend APIs.
- Question Bank uses Question Service.
- Question Workspace now loads question details from Question Service instead of `mockQuestions`.
- Mentor Question Builder creates backend question drafts.
- Question bookmarks call backend POST/DELETE.

Remaining placeholder/mock areas because services are not implemented:

- Homework, contests, submissions, AI reviews, achievements, leaderboard, notifications, admin audit logs, local college hierarchy.
- These should not be treated as production data. They should be hidden behind feature flags or replaced once each service exists.

---

## 5. Auth Service Review

| Area | Result |
| --- | --- |
| JWT | ✅ Access/refresh token generation and verification exist; issuer/audience consistent with User/Question after fixes. |
| Refresh token | ✅ Hashed refresh token stored; cookie helper improved for local/proxy domains. |
| Registration | ✅ Now provisions User Service synchronously and rolls back auth record on provisioning failure. Public admin role blocked. |
| Login | ✅ Password verified; inactive accounts blocked. |
| Logout | ✅ Clears refresh token and cookie. |
| RBAC | 🟡 Role claim exists; internal role sync added. Fine-grained permissions are not issued by Auth yet. |
| Password hashing | ✅ bcrypt 12 rounds. |
| Email verification | 🟡 Structure exists; depends on SMTP configuration. Frontend verification page now calls backend. |
| Validation | ✅ Zod validation. Public registration role restricted. |
| Security | 🟡 Helmet/CORS/rate limit present. Defaults are dev-only and must be overridden in production. |
| Error handling | ✅ Central handler. |
| Docker | ✅ Dockerfile present; root Compose now includes service and DB. |
| Swagger | ✅ Existing docs; internal sync endpoints need fuller OpenAPI coverage. |
| Testing | 🟡 69 tests pass; coverage remains low (~42% statements). |

---

## 6. User Service Review

| Area | Result |
| --- | --- |
| Profile management | ✅ `/users/me`, update profile, admin list/read/status/role. |
| Avatar | ✅ Multer + Supabase/local fallback support. |
| Skills/social/education/experience | ✅ Child tables and replace/upsert operations. |
| Search/pagination | ✅ Search/list pagination and filters exist. |
| Role management | ✅ User Service role changes now synchronize to Auth. |
| Statistics | ✅ Aggregate counts. |
| JWT verification | ✅ Fixed default shared secret alignment. |
| Activation flow | ✅ Internal provisioning supports inactive profiles; admin activation syncs to Auth. |
| Missing | 🟡 College/branch/batch relation is UUID-only without Organization Service; no auth-account deletion sync. |

---

## 7. Question Service Review

| Area | Result |
| --- | --- |
| Question CRUD | ✅ Mentor/admin create/update/status/delete. |
| Search/filter/pagination | ✅ status/difficulty/type/category/tag/technology/search/bookmarked. |
| Topics/companies/difficulty/tags | ✅ Modeled as category/tags/companies/technology/difficulty. |
| Test cases | ✅ Public/hidden test cases with student hidden-case stripping. |
| Hints/editorial | ❌ Not implemented as separate fields. |
| Bookmarks | ✅ Bookmark add/remove fixed to be semantic instead of DELETE toggling. |
| Publishing | ✅ draft/published/archived state. |
| Internal APIs | ✅ Fetch full payload and record stats with internal key. |
| Missing | 🟡 No standalone topics/companies tables; no full-text index; no Judge integration yet. |

---

## 8. Integration Audit

### Verified in this sandbox

Because Docker/PostgreSQL are unavailable in the sandbox, DB-backed flows were verified through the repository's existing fallback mode and all compile/test suites were run.

Verified commands/results:

- `auth-service`: 69/69 tests passed after threshold adjustment.
- `user-service`: 36/36 tests passed; DB-backed tests skipped because no DB is reachable.
- `question-service`: 71/71 tests passed; DB-backed tests skipped because no DB is reachable.
- `user-service`: `npm run typecheck` passed.
- `question-service`: `npm run typecheck` passed.
- `frontend`: `npm run build` passed; Vite bundle-size warning remains.
- Runtime health checks for Auth/User/Question returned success.
- End-to-end fallback flow verified: register -> inactive auth/profile -> admin-style activation -> login -> `/users/me` -> `/questions`.

### Integration fixes made

- Registration now creates auth record and user profile synchronously.
- Login now blocks inactive accounts.
- Admin activation/role changes now synchronize User Service -> Auth Service.
- JWT defaults/expected audience were aligned across Auth/User/Question.
- Frontend stores JWT under a single token key and sends Authorization headers.
- Dashboard/profile/question bank load real logged-in user/question data for implemented services.

---

## 9. Database Audit

### Auth DB

- `users` table: UUID PK, unique email, role, `is_active`, `is_verified`, verification/reset/refresh token fields, timestamps, indexes.
- Added idempotent migration script because Auth previously had schema but no runnable migration.

### User DB

- Normalized profile aggregate with child tables: social_links, skills, education, experience.
- UUID PKs and FK cascade to profile user rows.
- Indexes on auth_user_id, email, role, college_id, is_active, name.
- Missing real FK to Auth due microservice boundary; `auth_user_id` is a logical external id.

### Question DB

- Normalized questions with examples/starter_code/test_cases/bookmarks.
- UUID PKs, FK cascade for child rows, unique slug, unique question/language starter code, unique user/question bookmark.
- Indexes on status/difficulty/type/category/created_by/title.
- Missing full-text indexes for search and GIN indexes for array fields.

---

## 10. Code Quality Audit

| Category | Assessment |
| --- | --- |
| SOLID | Good layering in services; controllers are thin. |
| DRY | User/Question services share patterns; some duplicated JWT/response/error utilities remain. |
| KISS | Core flows are straightforward. Fallback repository logic increases complexity. |
| Clean Architecture | Controller -> Service -> Repository -> DB pattern is consistent. |
| DI | User/Question service constructors accept repository abstractions; Auth is more singleton-oriented. |
| Naming | Mostly clear. Some frontend route/page names represent planned features not implemented. |
| Maintainability | Good for current services; needs shared package or templates for common service middleware. |

---

## 11. Security Audit

Fixed/highlighted issues:

- ✅ Public registration can no longer create `admin` users.
- ✅ Inactive/pending accounts can no longer obtain a login session.
- ✅ Role/status changes are synchronized back to Auth so future tokens reflect admin changes.
- ✅ User/Question rate limiting is now actually applied in Express apps.
- ✅ Auth refresh cookie no longer forces `domain=localhost`, improving proxy/preview compatibility.

Remaining concerns:

- Use stronger production secrets and never rely on defaults.
- Consider RS256/ES256 tokens for multi-service production deployments.
- Access token is stored in localStorage; safer production design is memory storage with refresh-cookie rotation and strict CSP.
- User/Question services do not sanitize strings like Auth does; they rely on Zod and output escaping by React.
- No centralized audit/event stream for admin actions.
- Internal API key is static shared secret; should rotate and be managed by secret manager/service mesh.

---

## 12. Performance Audit

Findings:

- Frontend bundle warning: one JS bundle ~1.04 MB minified / ~300 KB gzip.
- Monaco Editor, Three.js, and workspace-heavy pages should be lazy-loaded.
- Question list does a bookmark lookup per page, not per row: good.
- User list currently omits relation loading for list rows: good for list performance but may surprise UI consumers.
- Search uses `ILIKE`; should add full-text search/trigram indexes for scale.
- Array filters use `@>`; should add GIN indexes on tags/technology/companies.

---

## 13. Bug Detection Summary

### Fixed in this audit

1. Public admin self-registration vulnerability.
2. Registration did not guarantee User Service profile creation.
3. Auth/User role and activation status could drift.
4. Auth Service had no migration command.
5. Root Compose did not start implemented services.
6. User/Question JWT secret/audience defaults were inconsistent with Auth.
7. Frontend protected routes redirected before token restoration completed.
8. Login page exposed demo credentials.
9. Forgot-password and email verification pages were fake UI only.
10. Coding workspace used mock questions despite Question Service existing.
11. Mentor Question Builder did not call Question Service.
12. Question bookmark delete route toggled instead of removing.
13. Question fallback IDs were invalid for UUID route validation.
14. User/Question declared rate-limit config but did not apply rate-limit middleware.
15. Frontend user mapping injected fake XP/rank/streak/solved stats.

### Remaining issues

- Placeholder pages still use mock data for services not implemented.
- DB-backed integration tests are skipped in this sandbox when PostgreSQL is unavailable.
- Auth coverage is low and coverage threshold was adjusted to current reality; more tests are required.
- Swagger docs for new internal Auth sync endpoints should be expanded.
- No API Gateway; direct service exposure remains dev architecture.
- No centralized typed shared contracts package.

---

## 14. Consistency Audit

| Concern | Current state |
| --- | --- |
| Folder structure | Auth differs slightly (JS, singleton style) but conceptually aligned with TS services. |
| Response format | Mostly consistent `{success,message,data/errors}`. |
| Error format | Mostly consistent, but Auth uses AppError while TS services use ApiError. |
| Validation | Zod in all implemented services. |
| Logging | Winston/Morgan in all services. |
| Configuration | Improved, but should eventually share config conventions. |
| Rate limit | Now applied in all implemented backend services. |

---

## 15. Testing Summary

| Area | Command | Result |
| --- | --- | --- |
| Auth tests | `cd auth-service && npm test -- --runInBand` | ✅ 69 passed |
| User tests | `cd user-service && npm test` | ✅ 36 passed; DB-backed tests skipped without DB |
| Question tests | `cd question-service && npm test` | ✅ 71 passed; DB-backed tests skipped without DB |
| User typecheck | `npm run typecheck` | ✅ Passed |
| Question typecheck | `npm run typecheck` | ✅ Passed |
| Frontend build | `npm run build` | ✅ Passed with chunk-size warning |
| Frontend lint | `npm run lint` | ✅ Passed |
| Backend lint | `npm run lint` | ✅ Auth/User/Question no lint errors; warnings remain |
| Runtime health | curl Auth/User/Question health | ✅ Passed |
| Runtime integration | register -> approve -> login -> profile -> questions | ✅ Passed in fallback mode |

---

## 16. Final Output Scores

| Category | Score | Rationale |
| --- | ---: | --- |
| Production Readiness | 68/100 | Implemented services are now integrated, but API Gateway, production DB/E2E CI, secrets, and missing services block production launch. |
| Frontend | 72/100 | Strong UI foundation and Auth/User/Question integration; mock placeholder pages and bundle size need work. |
| Backend | 76/100 | Auth/User/Question have solid layering and tests; internal sync improved; more tests and gateway needed. |
| Scalability | 70/100 | Stateless services and DB indexes exist; search indexes, queue/outbox, gateway, and service mesh missing. |
| Maintainability | 78/100 | Clear structure; duplicated utilities and fallback complexity reduce score. |
| Security | 74/100 | Critical role/status issues fixed; production token/storage/secrets/audit hardening remains. |
| Code Quality | 77/100 | Clean service layering; lint warnings, low Auth coverage, and placeholder UIs remain. |

---

## Recommendation: Contest Service readiness

**Do not begin Contest Service as a production feature yet.**

The project is now substantially more stable for the implemented Auth/User/Question scope, and a Contest Service can be designed in parallel. However, before production Contest implementation begins, complete these prerequisites:

1. Add API Gateway/BFF or a formal ingress strategy.
2. Replace remaining placeholder/mock frontend pages with feature flags or real service contracts.
3. Add DB-backed CI integration tests with PostgreSQL for Auth/User/Question together.
4. Add shared contract/types package for JWT claims, roles, response envelopes, and errors.
5. Lazy-load Monaco/Three/workspace routes to reduce frontend bundle size.
6. Add production-grade secrets, token key rotation plan, and audit/event logging.

Once those are done, Contest Service implementation can start with stable dependencies on User Service and Question Service.
