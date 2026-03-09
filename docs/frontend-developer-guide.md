# Frontend Developer Onboarding & Instructions

## For: MCQ Extraction Platform v2.0
## Audience: Frontend UI/UX Designer + Developer

---

## 1. Read These First

Read in this exact order before writing any code:

1. **executive-summary.md** — Understand what we're building and why
2. **frontend.md** — Your primary spec (screens, components, state, folder structure)
3. **user-flows.md** — The user journeys you're implementing
4. **apis.md** — The API contract you'll consume
5. **delivery-roadmap.md** — What to build per phase (don't build Phase 2 things in Phase 1)

---

## 2. Tech Stack (Non-Negotiable)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 14+ (App Router)** | Use React Server Components where possible |
| Language | **TypeScript (strict mode)** | No `any` types. Ever. |
| UI Components | **shadcn/ui** | Copy-paste components, not a dependency. Customize from there. |
| Styling | **Tailwind CSS** | No custom CSS files unless absolutely necessary |
| Data Fetching | **TanStack Query (React Query v5)** | All API calls go through TanStack Query. No raw `fetch` in components. |
| Tables | **TanStack Table** | For MCQ record tables, document lists, review queues |
| Forms | **React Hook Form + Zod** | Every form uses RHF. Every form has a Zod validation schema. |
| State (client) | **Zustand** | Only for truly client-side state (upload progress, UI preferences, filter state). NOT for server data. |
| Charts | **Recharts** | Analytics dashboards only |
| Command Palette | **cmdk** | Phase 3 |
| Icons | **Lucide React** | Consistent with shadcn/ui |

---

## 3. Architecture Rules

### 3.1 Server vs Client Components

```
DEFAULT: Server Components (RSC)
USE "use client" ONLY when the component needs:
  - useState, useEffect, or other hooks
  - Browser APIs (localStorage, window)
  - Event handlers (onClick, onChange)
  - TanStack Query hooks
  - Zustand stores
```

**Pattern:**
```
page.tsx (Server Component — fetches initial data)
  └── ClientWrapper.tsx ("use client" — handles interactivity)
       └── DataTable.tsx ("use client" — TanStack Table)
```

### 3.2 Data Fetching Rules

| Data Type | Where to Fetch | How |
|-----------|---------------|-----|
| Initial page data | Server Component or TanStack Query | `fetch()` in RSC or `useQuery()` |
| User-triggered data | TanStack Query | `useQuery()` with `enabled: false` + refetch |
| Mutations (create/update/delete) | TanStack Query | `useMutation()` with `onSuccess` cache invalidation |
| Real-time updates (job status) | SSE or polling | TanStack Query with `refetchInterval` or custom SSE hook |
| File uploads | Custom hook | `useMutation()` with `XMLHttpRequest` for progress tracking |

**Never do this:**
```typescript
// ❌ BAD — raw fetch in a component
useEffect(() => {
  fetch('/api/documents').then(res => res.json()).then(setData);
}, []);

// ✅ GOOD — TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['documents', projectId],
  queryFn: () => api.documents.list(projectId),
});
```

### 3.3 API Client Layer

Create a typed API client in `src/lib/api/` — one file per domain:

```
src/lib/api/
├── client.ts          # Base fetch wrapper (auth headers, base URL, error handling)
├── documents.ts       # api.documents.list(), api.documents.upload(), etc.
├── jobs.ts            # api.jobs.create(), api.jobs.cancel(), etc.
├── mcq-records.ts     # api.mcqRecords.list(), api.mcqRecords.update(), etc.
├── providers.ts       # api.providers.list(), api.providers.test(), etc.
├── review.ts          # api.review.getQueue(), api.review.approve(), etc.
├── exports.ts         # api.exports.create(), api.exports.download(), etc.
├── analytics.ts       # api.analytics.dashboard(), api.analytics.costs(), etc.
├── auth.ts            # api.auth.login(), api.auth.register(), etc.
├── workspaces.ts      # api.workspaces.create(), etc.
└── index.ts           # Re-export all as `api` object
```

Every function must have **typed request and response** using shared types from `packages/shared-types`.

### 3.4 State Management Boundaries

```
┌─────────────────────────────────────────────────┐
│                    DO NOT MIX                    │
├─────────────────────┬───────────────────────────┤
│  TanStack Query     │  Zustand                  │
│  (Server State)     │  (Client State)           │
├─────────────────────┼───────────────────────────┤
│  Documents list     │  Upload progress           │
│  MCQ records        │  Sidebar open/closed       │
│  Job status         │  Active filters/sort       │
│  Provider configs   │  Selected table rows       │
│  User profile       │  Theme preference          │
│  Review queue       │  Command palette open      │
│  Analytics data     │  Toast notifications queue  │
└─────────────────────┴───────────────────────────┘
```

---

## 4. Folder Structure

Follow this structure exactly:

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Main app layout group
│   │   │   ├── layout.tsx            # Sidebar + header layout
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── workspaces/
│   │   │   │   └── [workspaceId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── projects/
│   │   │   │           └── [projectId]/
│   │   │   │               ├── page.tsx
│   │   │   │               ├── documents/
│   │   │   │               ├── jobs/
│   │   │   │               ├── mcq-records/
│   │   │   │               └── exports/
│   │   │   ├── review/              # Review queue
│   │   │   ├── analytics/           # Analytics dashboards
│   │   │   └── settings/            # Workspace + provider settings
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (DO NOT MODIFY BASE)
│   │   ├── layout/                  # Sidebar, Header, Breadcrumbs
│   │   ├── documents/               # Document-specific components
│   │   ├── mcq/                     # MCQ record components
│   │   ├── review/                  # Review UI components
│   │   ├── upload/                  # Upload components
│   │   ├── jobs/                    # Job monitoring components
│   │   ├── providers/               # Provider management components
│   │   ├── analytics/               # Chart/dashboard components
│   │   ├── export/                  # Export components
│   │   └── shared/                  # Generic reusable components
│   ├── hooks/                       # Custom React hooks
│   ├── lib/
│   │   ├── api/                     # API client layer
│   │   ├── utils.ts                 # Utility functions (cn(), formatDate(), etc.)
│   │   └── constants.ts             # App-wide constants
│   ├── stores/                      # Zustand stores
│   ├── types/                       # Frontend-only types (re-export shared-types)
│   └── validations/                 # Zod schemas for forms
├── public/
├── e2e/                             # Playwright E2E tests
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Component Guidelines

### 5.1 Component Anatomy

Every non-trivial component should follow this pattern:

```typescript
// components/documents/document-card.tsx
"use client";

import { type Document } from "@mcq/shared-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface DocumentCardProps {
  document: Document;
  onSelect?: (id: string) => void;
}

export function DocumentCard({ document, onSelect }: DocumentCardProps) {
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={() => onSelect?.(document.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(document.id);
      }}
      aria-label={`Document: ${document.name}`}
    >
      <CardHeader>
        <h3 className="font-semibold truncate">{document.name}</h3>
        <Badge variant={statusVariant(document.status)}>
          {document.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {document.pageCount} pages · {formatDistanceToNow(document.createdAt)} ago
        </p>
      </CardContent>
    </Card>
  );
}
```

### 5.2 Naming Conventions

| Item | Convention | Example |
|------|----------|---------|
| Component files | kebab-case | `document-card.tsx` |
| Component names | PascalCase | `DocumentCard` |
| Hook files | kebab-case starting with `use-` | `use-documents.ts` |
| Hook names | camelCase starting with `use` | `useDocuments` |
| Store files | kebab-case ending with `-store` | `upload-store.ts` |
| API client files | kebab-case (domain name) | `documents.ts` |
| Type files | kebab-case | `document.types.ts` |
| Utility functions | camelCase | `formatFileSize()` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| CSS classes | Tailwind only | `className="flex items-center gap-2"` |

### 5.3 Component Size Rule

If a component file exceeds **150 lines**, break it into smaller components. Extract:
- Complex logic → custom hook
- Repeated UI sections → sub-component
- Form sections → separate form-field components

---

## 6. Design System Instructions (For the Designer)

### 6.1 Use shadcn/ui as the Foundation

- Start from shadcn/ui's default theme (Zinc color palette).
- Customize only: primary color, brand accent, and specific component variants.
- **Do NOT design components that conflict with shadcn/ui patterns.** If shadcn has a Dialog, use it — don't design a custom modal.

### 6.2 Design Tokens to Define

The designer should define these tokens (which map to Tailwind CSS variables):

```
Colors:
  --primary          # Brand primary (buttons, links, active states)
  --primary-foreground
  --destructive      # Error/danger
  --warning          # Warnings, medium confidence
  --success          # Approved, high confidence
  --muted            # Disabled, secondary text

Spacing: Use Tailwind's scale (4px = 1 unit)
Typography: Use shadcn/ui defaults (Inter or system fonts)
Border radius: Match shadcn/ui (--radius variable)
```

### 6.3 Screens to Design (Priority Order)

**Phase 0/1 (design first):**
1. Login / Register pages
2. Dashboard (home) — stats overview
3. Sidebar navigation + workspace switcher
4. Document list (table view + card view)
5. Upload modal (single + drag-and-drop)
6. Document detail page (page thumbnails + metadata)
7. Job progress monitor
8. MCQ record table (with inline editing)
9. Provider management (list + add/edit form)
10. User management (list + invite dialog)
11. Basic review queue list

**Phase 2 (design after P1 is built):**
12. Side-by-side review (PDF left, MCQ right) — **most complex screen**
13. Diff viewer (MCQ version comparison)
14. Confidence score indicators
15. Notification panel

**Phase 3 (design after P2 is built):**
16. Export configuration dialog
17. Analytics dashboard (multiple chart types)
18. Cost breakdown charts
19. Command palette (cmdk)

### 6.4 Must-Design States

For EVERY screen, the designer must provide designs for:

| State | What to Show |
|-------|-------------|
| **Empty** | No data yet — helpful message + CTA ("Upload your first document") |
| **Loading** | Skeleton loaders (not spinners) for content areas |
| **Populated** | Normal state with realistic data |
| **Error** | Error message with actionable guidance + retry |
| **No permission** | "You don't have access" + who to contact |

---

## 7. Accessibility (Non-Negotiable)

Target: **WCAG 2.1 Level AA**

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | Every interactive element reachable via Tab; Enter/Space to activate |
| Focus indicators | Visible focus ring on all interactive elements (shadcn/ui handles this by default) |
| Screen reader | All images have alt text; all icons have aria-label; all forms have labels |
| Color contrast | 4.5:1 minimum for text; 3:1 for large text and UI components |
| Motion | Respect `prefers-reduced-motion`; no essential animations |
| Error announcements | Form errors announced to screen readers via `aria-live` regions |
| Skip navigation | "Skip to main content" link at top of page |
| Heading hierarchy | One `h1` per page; logical heading order (h1 → h2 → h3) |

**Test with:** axe-core browser extension during development. It will catch 80% of accessibility issues.

---

## 8. Performance Requirements

| Metric | Target | How to Achieve |
|--------|--------|---------------|
| LCP (Largest Contentful Paint) | < 2.5s | Server Components, optimized images, font preloading |
| FID (First Input Delay) | < 100ms | Minimize client JS; code split aggressively |
| CLS (Cumulative Layout Shift) | < 0.1 | Set explicit dimensions on images; skeleton loaders |
| Bundle size (initial) | < 200KB gzipped | Dynamic imports for heavy components (charts, editors) |
| Table render (1000 rows) | < 1s | TanStack Table with virtualization (`@tanstack/react-virtual`) |

**Mandatory performance patterns:**
- `next/image` for all images (page thumbnails, avatars)
- `next/font` for font loading
- Dynamic imports for heavy components: `const Chart = dynamic(() => import('./Chart'), { ssr: false })`
- Pagination for all lists (never load 1000+ items at once)
- Debounce search inputs (300ms)
- Virtualize long lists and tables

---

## 9. Security (Frontend Responsibilities)

| Concern | Action |
|---------|--------|
| XSS prevention | Never use `dangerouslySetInnerHTML`. If MCQ content contains HTML, sanitize with DOMPurify. |
| CSRF | Cookies are SameSite=Strict; backend handles CSRF tokens for non-cookie auth |
| Auth tokens | Never store tokens in localStorage. Use httpOnly cookies (set by backend). |
| Role-based UI | Hide UI elements based on user role — BUT never rely on frontend hiding as a security measure. Backend enforces all permissions. |
| File uploads | Validate file type and size on the client BEFORE uploading. Backend validates again. |
| URLs/redirects | Never redirect to user-supplied URLs without validation |
| Error messages | Never expose stack traces, internal IDs, or SQL errors to users |

---

## 10. Error Handling Patterns

### 10.1 Global Error Boundary

```typescript
// app/error.tsx (Next.js error boundary)
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">We encountered an unexpected error.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### 10.2 API Error Handling

```typescript
// Standardized error display
interface ApiError {
  status: number;
  code: string;
  message: string;       // User-friendly message from backend
  details?: unknown;
}

// In TanStack Query:
const { error } = useQuery({ ... });
if (error) return <ErrorAlert error={error} onRetry={refetch} />;
```

### 10.3 Toast Notifications

Use shadcn/ui's `sonner` (toast library) for:
- Success: "Document uploaded successfully"
- Error: "Failed to upload — file exceeds 50MB limit"
- Warning: "Provider connection test failed"
- Info: "Extraction job started — you'll be notified when it completes"

---

## 11. Testing Expectations

| Test Type | Required | When |
|-----------|----------|------|
| Component unit tests | Required for components with logic (conditional rendering, state) | Before PR |
| Hook unit tests | Required for all custom hooks | Before PR |
| E2E tests | Required for each user flow (see user-flows.md) | Before phase sign-off |
| Visual review | Required — run the app and visually verify every state | Before PR |
| Accessibility check | Required — run axe-core on every page | Before PR |
| Mobile viewport check | Required — verify at 1024px, 1280px, 1440px, 1920px | Before PR |

---

## 12. Git Workflow

| Rule | Details |
|------|---------|
| Branch naming | `feature/FE-<id>-<short-description>` (e.g., `feature/FE-001-document-upload`) |
| Commit messages | Conventional commits: `feat(upload): add drag-and-drop zone` |
| PR requirements | lint pass + typecheck pass + tests pass + 1 approval |
| PR size | < 400 lines changed (split larger work into stacked PRs) |

---

## 13. Phase 1 Immediate Priorities

Start building in this order:

1. **Project scaffolding** — Next.js app with Tailwind + shadcn/ui installed, folder structure created
2. **Layout** — Sidebar, header, breadcrumbs, workspace switcher
3. **Auth pages** — Login, register, forgot password
4. **Dashboard** — Stats overview with empty states
5. **Document list** — Table view with pagination
6. **Upload flow** — Drag-and-drop + file validation + progress
7. **Document detail** — Page thumbnails + metadata panel
8. **Job monitor** — Job list with real-time status updates
9. **MCQ record table** — TanStack Table with filtering, sorting, pagination
10. **Provider management** — CRUD with test connection
11. **User management** — List, invite, role assignment
12. **Basic review queue** — List view with approve/reject actions

**Don't build until Phase 2:** Side-by-side review, diff viewer, confidence visualizations, advanced analytics, command palette.

---

## 14. Communication

- Ask backend developer for API contract clarification before guessing
- If a screen's design is ambiguous, check **user-flows.md** for the intended interaction
- If you find a gap in the spec (something not covered), document it and raise it — don't invent behavior silently
- All API endpoints, request/response shapes, and error codes are in **apis.md** — read it carefully
