# Frontend Design — MCQ Extraction Platform v2.0

## Document Purpose

This document specifies frontend scope, architecture, page inventory, user flows, component strategy, state management, accessibility, performance, and testing implications for the MCQ Extraction Platform.

---

## 1. Frontend Scope

The frontend is a Next.js App Router application serving as the primary user interface for all 6 user roles. It provides:

- Authenticated multi-workspace dashboard experience
- PDF upload and document management
- Job monitoring with real-time progress updates
- Review queue with side-by-side source comparison
- Export center with LMS format selection
- Provider configuration and health monitoring
- Analytics and cost intelligence dashboards
- Admin and audit functionality
- Semantic search and prompt management (later phases)

**Tech stack (from source):**
- Next.js (App Router) with React Server Components
- React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (API state management with optimistic updates)
- TanStack Table (data tables for review and audit)
- Zustand (local UI state)
- React Hook Form + Zod (form handling and validation)
- Recharts (charts and analytics)
- cmdk (command palette)

---

## 2. User Types and Usage Context

| User Type | Primary Usage | Session Length | Device | Key UX Priority |
|-----------|--------------|----------------|--------|-----------------|
| Operator | Upload files, launch jobs, check status, export | Medium (30–60 min) | Desktop | Bulk operations, clear status indicators |
| Reviewer / QA | Review flagged records, side-by-side comparison | Long (1–4 hours) | Desktop (large screen) | Keyboard shortcuts, fast navigation, minimal clicks |
| Workspace Admin | Configure providers, manage users, set policies | Short (10–30 min) | Desktop | Clear settings UX, immediate feedback |
| Super Admin | System-wide settings, health monitoring | Short (10–20 min) | Desktop | System overview, alert visibility |
| Analyst | View dashboards, explore trends, compare providers | Medium (20–60 min) | Desktop | Interactive charts, filtering, drill-down |
| API User | No direct frontend usage | N/A | N/A | N/A (API docs) |

---

## 3. Page and Screen Inventory

### 3.1 Phase 0–1 Screens (MVP)

| # | Screen | Route (suggested) | User Roles |
|---|--------|-------------------|------------|
| 1 | Sign In | `/auth/signin` | All |
| 2 | Workspace Switcher | `/workspaces` | All |
| 3 | Dashboard | `/dashboard` | All |
| 4 | Projects List | `/projects` | Operator, Admin |
| 5 | Project Detail | `/projects/[id]` | Operator, Admin |
| 6 | Upload Center | `/projects/[id]/upload` | Operator |
| 7 | Documents List | `/documents` | Operator |
| 8 | Document Detail | `/documents/[id]` | Operator, Reviewer |
| 9 | Job Detail | `/jobs/[id]` | Operator |
| 10 | Review Queue | `/review` | Reviewer |
| 11 | Review Detail | `/review/[id]` | Reviewer |
| 12 | Provider Settings | `/settings/providers` | Admin |
| 13 | Export Center | `/exports` | Operator |
| 14 | Analytics Dashboard | `/analytics` | Analyst, Admin |
| 15 | User Management | `/settings/users` | Admin |
| 16 | Audit Logs | `/admin/audit` | Admin, Super Admin |

### 3.2 Phase 2–3 Screens

| # | Screen | Route (suggested) | Phase |
|---|--------|-------------------|-------|
| 17 | Provider Health/Benchmarks | `/settings/providers/[id]/health` | 2 |
| 18 | Cost Intelligence | `/analytics/cost` | 2 |
| 19 | Hallucination Analytics | `/analytics/hallucinations` | 2 |
| 20 | Notifications Center | `/notifications` | 3 |
| 21 | Semantic Search | `/search` | 3 |
| 22 | Diagnostics/Status | `/admin/diagnostics` | 2 |

### 3.3 Phase 4 Screens

| # | Screen | Route (suggested) | Phase |
|---|--------|-------------------|-------|
| 23 | Prompt Management | `/admin/prompts` | 4 |
| 24 | SSO Configuration | `/admin/sso` | 4 |
| 25 | Policy Engine | `/admin/policies` | 4 |
| 26 | Workflow Editor | `/admin/workflows` | 4 |

---

## 4. Information Architecture

```
Root Layout (authenticated)
├── Workspace Switcher
├── Sidebar Navigation
│   ├── Dashboard
│   ├── Projects
│   │   └── Project Detail
│   │       ├── Documents
│   │       ├── Upload
│   │       └── Jobs
│   ├── Documents
│   │   └── Document Detail (page previews)
│   ├── Review Queue
│   │   └── Review Detail (side-by-side)
│   ├── Exports
│   ├── Search (Phase 3)
│   ├── Analytics
│   │   ├── Overview
│   │   ├── Providers
│   │   ├── Quality
│   │   ├── Cost (Phase 2)
│   │   └── Hallucinations (Phase 2)
│   ├── Notifications (Phase 3)
│   └── Settings
│       ├── Providers
│       ├── Users & Roles
│       ├── Workspace Settings
│       └── Admin (Super Admin only)
│           ├── Audit Logs
│           ├── Diagnostics
│           ├── Prompts (Phase 4)
│           └── Workflows (Phase 4)
└── Command Palette (cmdk) overlay
```

---

## 5. Component Architecture

### 5.1 Layout Components
- `RootLayout` — auth check, workspace context provider, sidebar, topbar
- `Sidebar` — navigation, workspace switcher, user menu
- `Topbar` — breadcrumbs, notifications bell, command palette trigger
- `PageContainer` — standard page wrapper with title, actions, content area

### 5.2 Core Feature Components

**Upload Center:**
- `FileDropzone` — drag-and-drop area with folder support
- `UploadProgressList` — list of in-progress uploads with progress bars
- `UploadMetadataForm` — tags, notes, category per file

**Document Views:**
- `DocumentTable` — TanStack Table with filtering, sorting, pagination
- `PagePreview` — lazy-loaded page image viewer
- `PageGrid` — thumbnail grid of all pages in a document

**Job Views:**
- `JobProgressCard` — real-time job status with pipeline stage indicator
- `JobPipelineVisualization` — visual state machine progression
- `JobErrorDetails` — error log with stack traces

**Review Queue:**
- `ReviewTable` — TanStack Table with confidence columns, flag indicators
- `ReviewDetailPane` — split-pane layout
- `SourceImageViewer` — page image with zoom/pan
- `ExtractedJsonViewer` — syntax-highlighted JSON with inline edit
- `SourceExcerptHighlighter` — highlighted matching between source and extraction
- `ReviewActionBar` — approve/reject/edit/reprocess buttons with keyboard shortcut hints
- `SimilarRecordsPanel` — shows related records for consistency checking

**Export Center:**
- `ExportFormatSelector` — JSON, CSV, QTI, SCORM, xAPI, cmi5
- `ExportScopeSelector` — project, document, tag-based filtering
- `ExportPreview` — validation summary before export
- `ExportHistoryTable` — past exports with download links

**Analytics:**
- `StatsCard` — KPI card with trend indicator
- `TimeSeriesChart` — Recharts line/area chart
- `ProviderComparisonChart` — bar chart comparing providers
- `CostBreakdownChart` — cost treemap or stacked bar
- `HallucinationRateChart` — trend chart with provider breakdown

**Provider Settings:**
- `ProviderConfigForm` — API key input, model selection, parameters
- `ProviderHealthBadge` — green/yellow/red status indicator
- `ProviderTestButton` — test connection inline
- `FallbackChainEditor` — drag-and-drop provider ordering

### 5.3 Shared Components (packages/ui)
- Button, Input, Select, Dialog, Sheet, Popover (shadcn/ui)
- DataTable (TanStack Table wrapper)
- EmptyState, ErrorState, LoadingState
- Breadcrumbs, Badge, Toast
- KeyboardShortcutHint
- ConfirmDialog
- Pagination

---

## 6. State Management

### 6.1 Server State (TanStack Query)
All API data fetching and mutation uses TanStack Query:
- `useQuery` for list and detail fetches with caching
- `useMutation` for create/update/delete with optimistic updates
- Cache invalidation patterns per entity type
- Polling for real-time job status updates (configurable interval)
- Prefetching for anticipated navigation (e.g., prefetch document detail on hover)

### 6.2 Local UI State (Zustand)
For state that does not come from the API:
- Sidebar open/collapsed state
- Review pane split position
- Selected filters and sort preferences
- Command palette open state
- User-configured keyboard shortcuts
- Dark mode preference

### 6.3 Form State (React Hook Form + Zod)
All forms use React Hook Form with Zod schemas for validation:
- Provider configuration forms
- Upload metadata forms
- Review edit forms
- Export configuration forms
- User invite forms

---

## 7. Routing and Navigation

- Next.js App Router with file-based routing
- Authenticated routes wrapped in auth layout (redirect to sign-in if unauthenticated)
- Workspace-scoped routes (workspace ID in context, not URL for cleanliness)
- Loading states via `loading.tsx` files
- Error boundaries via `error.tsx` files
- Parallel routes for review detail pane (split layout)
- Breadcrumbs generated from route hierarchy

---

## 8. Form Handling

| Form | Complexity | Validation | Phase |
|------|-----------|------------|-------|
| Sign In | Simple | Email/password format | 0 |
| Provider Config | Medium | API key format, required fields, model selection | 0 |
| Upload Metadata | Simple | Tags (optional), notes (optional) | 1 |
| Review Edit | Complex | Full MCQ schema validation via Zod | 1 |
| Export Config | Medium | Format selection, scope selection | 1 |
| User Invite | Simple | Email format, role selection | 1 |
| Project Create | Medium | Name, extraction profile, quality thresholds | 1 |
| Workspace Settings | Medium | Name, retention, limits | 1 |

---

## 9. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| WCAG 2.1 AA contrast | Tailwind config with accessible color palette; shadcn/ui defaults are AA-compliant |
| Keyboard navigation | All interactive elements focusable; tab order logical; skip links |
| Screen reader support | Semantic HTML (headings, landmarks, button labels); ARIA labels where needed |
| Focus management | Focus traps in dialogs; focus restoration on dialog close |
| Review queue accessibility | Keyboard shortcuts announced; shortcuts dialog accessible |
| Dark mode | Full dark mode support via Tailwind `dark:` classes |
| Reduced motion | Respect `prefers-reduced-motion` media query |

---

## 10. Performance Considerations

| Concern | Strategy |
|---------|----------|
| Large document tables | Virtual scrolling (TanStack Virtual) or pagination; never render 10K+ rows |
| Page image previews | Lazy loading with Intersection Observer; progressive JPEG or WebP |
| Analytics dashboards | Pre-aggregated data from backend; avoid client-side heavy computation |
| Bundle size | Code splitting per route (Next.js default); dynamic imports for heavy components |
| Review pane | Virtualize JSON viewer for large records; debounce source image zoom/pan |
| Initial load | React Server Components for static layout; stream critical content first |
| Real-time updates | Polling (not WebSocket) for job status; configurable poll interval (default 3s) |
| File uploads | Direct-to-S3 via presigned URLs; progress via XHR/fetch progress events |

**Source Basis:** Section 24.3 mentions lazy page preview loading, pagination, and streaming downloads.
**Inference:** WebSocket was not mentioned — polling is the implied approach.
**Confidence:** Medium. WebSocket could be added later for real-time job updates.

---

## 11. Error, Loading, and Empty States

Every data-displaying component must handle:

| State | Implementation |
|-------|----------------|
| Loading | Skeleton loaders matching final layout shape (not spinners) |
| Empty | Illustrated empty state with call-to-action (e.g., "No documents yet — upload your first PDF") |
| Error | Error boundary with retry button and error details; toast for mutation failures |
| Partial failure | Show available data with inline warning for failed sections |
| Offline | Browser offline banner (if applicable) |

---

## 12. Frontend Analytics and Observability

- **Client-side error tracking** — unhandled exceptions and React error boundaries reported (Sentry or equivalent)
- **Performance monitoring** — Web Vitals (LCP, FID, CLS) tracked via Next.js built-in or analytics provider
- **User interaction tracking** — key actions (upload, review approve/reject, export) tracked for product analytics
- **API call metrics** — TanStack Query's devtools for development; failure rates logged

---

## 13. Frontend Security

| Concern | Implementation |
|---------|----------------|
| XSS prevention | React's default escaping; CSP headers via Helmet.js; no dangerouslySetInnerHTML |
| CSRF | CSRF token in session cookie; validated by API middleware |
| Auth token handling | HTTP-only cookies (preferred); no tokens in localStorage |
| Presigned URL exposure | Presigned URLs are time-limited (15–60 minutes); never stored client-side long-term |
| Secret exposure | No API keys or secrets in client-side code; all provider calls are server-side |
| Input sanitization | Client-side Zod validation; server-side re-validation (defense in depth) |

---

## 14. Testing Implications

| Test Type | Scope | Tool |
|-----------|-------|------|
| Component unit tests | Isolated component rendering, props, events | Vitest + Testing Library |
| Hook tests | Custom hooks (TanStack Query wrappers, Zustand stores) | Vitest |
| Integration tests | Form submission, API mocking, navigation | Vitest + MSW |
| E2E tests | Full user flows (upload → review → export) | Playwright |
| Visual regression | Component appearance across themes/breakpoints | Playwright snapshots or Chromatic |
| Accessibility testing | Axe-based automated checks | @axe-core/react in dev; Playwright axe plugin in CI |

---

## 15. Recommended Folder Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── signin/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (authenticated)/
│   │   ├── layout.tsx              # Auth check, sidebar, workspace context
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── upload/page.tsx
│   │   │       └── documents/page.tsx
│   │   ├── documents/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── jobs/
│   │   │   └── [id]/page.tsx
│   │   ├── review/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── exports/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   ├── page.tsx
│   │   │   ├── cost/page.tsx
│   │   │   └── providers/page.tsx
│   │   ├── search/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/
│   │       ├── providers/
│   │       ├── users/
│   │       └── workspace/
│   ├── api/                        # Next.js API routes (BFF / auth)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/                     # Sidebar, Topbar, PageContainer
│   ├── upload/                     # FileDropzone, UploadProgressList
│   ├── documents/                  # DocumentTable, PagePreview
│   ├── jobs/                       # JobProgressCard, PipelineVisualization
│   ├── review/                     # ReviewTable, ReviewDetailPane
│   ├── export/                     # ExportFormatSelector, ExportPreview
│   ├── analytics/                  # StatsCard, charts
│   ├── providers/                  # ProviderConfigForm, HealthBadge
│   └── shared/                     # EmptyState, ErrorState, etc.
├── hooks/                          # Custom hooks
├── lib/                            # Utilities, API client, constants
├── stores/                         # Zustand stores
└── types/                          # Frontend-specific types
```

---

## 16. Dependencies on Backend, APIs, Design, and Product

| Dependency | Description | Impact if Delayed |
|------------|-------------|-------------------|
| API contract finalization | Frontend development requires stable API endpoints and response shapes | Blocks frontend feature development; requires MSW mocking as fallback |
| Auth implementation | Frontend auth flow depends on NextAuth/Auth.js integration | Blocks all authenticated pages |
| Presigned URL API | Upload flow depends on presigned URL generation | Blocks upload feature |
| Review API with pagination/filtering | Review queue depends on efficient server-side filtering | Blocks review feature |
| WebSocket or polling decision | Real-time job updates approach must be decided | Affects job monitoring UX |
| Design system tokens | Color, spacing, typography decisions affect all components | Can proceed with shadcn/ui defaults |
| Page image rendering API | Review side-by-side view needs rendered page images | Blocks review detail pane |
| Export format schemas | Export preview needs to know output shape per format | Blocks export preview feature |
