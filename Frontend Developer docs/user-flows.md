# User Flows — MCQ Extraction Platform v2.0

## Document Purpose

This document maps the key user journeys through the MCQ Extraction Platform, organized by role and workflow. Each flow includes the actor, trigger, steps, system behavior, and success criteria.

---

## 1. Operator Flows

### 1.1 UF-OP01: Upload and Extract MCQs (Primary Flow)

**Actor:** Operator
**Trigger:** Operator has a PDF document to process.
**Preconditions:** Logged in, workspace and project selected.

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Upload   │───→│  Processing  │───→│  Extraction  │───→│   Results    │───→│   Handoff    │
│  Document │    │  (queued)    │    │  (OCR+LLM)   │    │   View       │    │  to Review   │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Navigate to project → Documents tab | Document list loads |
| 2 | Click "Upload" or drag-and-drop PDF | Upload modal opens |
| 3 | Select/drop file(s); confirm upload | File validated (type, size) → uploaded to S3 → Document record created |
| 4 | (Automatic) | Parser service extracts pages → PageImage records created → thumbnails generated |
| 5 | View document in list (status: "Uploaded") | Document card shows page count, file size, upload time |
| 6 | Click "Extract" on document | Extraction job created → OCR queue entries for each page |
| 7 | Monitor job progress | Real-time progress bar via SSE/polling; status transitions: queued → processing → completed |
| 8 | (On completion) View MCQ records | MCQ record table shows extracted questions; click any record for detail |
| 9 | (Optional) Send to review queue | Bulk-select MCQs → "Send to Review" |

**Success criteria:** Document processed; MCQ records visible; no errors for clean PDFs.

**Error paths:**
- Upload fails: Error toast with retry option.
- Extraction fails on a page: Partial results shown; failed pages flagged.
- All pages fail: Job marked as failed; user can retry or change provider.

---

### 1.2 UF-OP02: Bulk Upload and Process

**Actor:** Operator
**Trigger:** Multiple PDFs to process at once.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Click "Bulk Upload" in project | Bulk upload modal opens |
| 2 | Select multiple files (or zip) | Files validated individually |
| 3 | Confirm upload | Each file uploaded; individual Document records created |
| 4 | Choose extraction settings (provider, options) | Applied to all documents |
| 5 | Click "Extract All" | Individual jobs created per document; batch progress shown |
| 6 | Monitor batch progress | Aggregate progress (X of Y documents complete) |
| 7 | View results per document | Click individual document to see its MCQ records |

---

### 1.3 UF-OP03: Re-extract with Different Provider

**Actor:** Operator
**Trigger:** Extraction results are poor; wants to try a different AI provider.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Open document detail | Document detail page loads |
| 2 | Click "Re-extract" | Re-extraction modal opens |
| 3 | Select different OCR/LLM/VLM provider | Provider options listed with test status |
| 4 | Confirm re-extraction | New job created; old MCQ records preserved as previous version |
| 5 | Compare results | New MCQ records shown; option to diff against previous extraction |

---

## 2. Reviewer / QA Flows

### 2.1 UF-RV01: Review Queue Workflow (Primary Flow)

**Actor:** Reviewer / QA
**Trigger:** MCQ records are in the review queue.
**Preconditions:** Logged in with Reviewer role, assigned to project.

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Review   │───→│  Examine     │───→│   Decision   │───→│   Next       │
│  Queue    │    │  MCQ + PDF   │    │  (approve/   │    │   Item       │
│           │    │  side-by-side │    │   reject)    │    │              │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Navigate to Review Queue | Queue loads with items sorted by priority/confidence |
| 2 | Filter queue (by confidence, document, status) | Filtered list updates |
| 3 | Click review item | Side-by-side view: PDF page (left) + MCQ record (right) |
| 4a | **Approve:** Click "Approve" | MCQ status → Approved; audit log entry; next item loads |
| 4b | **Reject:** Click "Reject" → enter reason | MCQ status → Rejected; reason saved; next item loads |
| 4c | **Edit + Approve:** Edit MCQ fields → click "Approve" | MCQ updated; version history created; status → Approved |
| 5 | Continue until queue is empty or session ends | Queue count decrements; progress shown |

**Keyboard shortcuts (Phase 3):**
- `A` — Approve current
- `R` — Reject current (opens reason dialog)
- `N` — Next item
- `P` — Previous item
- `E` — Toggle edit mode

---

### 2.2 UF-RV02: Batch Review

**Actor:** Reviewer / QA
**Trigger:** High-confidence MCQs that can be batch-approved.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Open review queue, filter by "Confidence ≥ 90" | High-confidence items shown |
| 2 | Select all (or specific items) | Checkbox selection |
| 3 | Click "Batch Approve" | Confirmation dialog with count |
| 4 | Confirm batch approval | All selected MCQs → Approved; audit log entries created |

---

### 2.3 UF-RV03: Dispute and Re-extract

**Actor:** Reviewer / QA
**Trigger:** Reviewer finds extracted MCQ is fundamentally wrong.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | In review, click "Flag for Re-extraction" | MCQ flagged; notification sent to Operator |
| 2 | Enter notes explaining the issue | Notes saved on review item |
| 3 | Operator re-extracts with different params | New MCQ version created |
| 4 | Reviewer reviews new version | Diff viewer shows old vs new |

---

## 3. Workspace Admin Flows

### 3.1 UF-AD01: Initial Setup

**Actor:** Workspace Admin
**Trigger:** New workspace needs configuration.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Create workspace | Workspace created with default settings |
| 2 | Configure workspace settings | Settings saved (retention, limits, defaults) |
| 3 | Navigate to Provider Management | Provider list (empty) |
| 4 | Add OCR provider (e.g., Google Cloud Vision) | Enter API key, model params; key encrypted and saved |
| 5 | Test connection | Test request sent; success/failure shown |
| 6 | Add LLM provider (e.g., OpenAI GPT-4) | Enter API key, model params; key encrypted and saved |
| 7 | Test connection | Test request sent; success/failure shown |
| 8 | Create first project | Project created under workspace |
| 9 | Invite team members | Invitations sent; roles assigned |

---

### 3.2 UF-AD02: User Management

**Actor:** Workspace Admin
**Trigger:** Need to add/modify/remove team members.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Navigate to Settings → Users | User list loads |
| 2a | **Invite:** Click "Invite" → enter email + role | Invitation email sent; pending invitation shown |
| 2b | **Change role:** Click user → change role dropdown | Role updated; permissions take effect immediately |
| 2c | **Deactivate:** Click user → "Deactivate" | User can no longer log in; sessions invalidated |
| 3 | View audit log for user changes | Audit entries shown for user management actions |

---

### 3.3 UF-AD03: Provider Configuration

**Actor:** Workspace Admin
**Trigger:** Need to add, modify, or troubleshoot AI providers.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Navigate to Settings → Providers | Provider list with status indicators |
| 2 | Select provider to configure | Detail panel: API key (masked), model, parameters |
| 3 | Update configuration | Save → validate → test connection |
| 4 | View provider usage stats | Cost, requests, error rate for this provider |
| 5 | Set as default for a capability (e.g., default OCR) | Default provider updated |
| 6 | Disable provider (without deleting) | Provider marked inactive; no new jobs use it |

---

## 4. Analyst Flows

### 4.1 UF-AN01: Analytics Dashboard

**Actor:** Analyst
**Trigger:** Need to understand extraction performance and costs.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Navigate to Analytics | Dashboard loads with overview charts |
| 2 | Select date range | Charts update for selected period |
| 3 | View extraction volume over time | Line chart: documents processed per day/week |
| 4 | View quality metrics | Charts: average confidence, approval rate, rejection reasons |
| 5 | View provider comparison | Bar chart: accuracy, cost, speed per provider |
| 6 | View cost breakdown | Stacked chart: cost per provider per workspace |
| 7 | Export analytics data | Download CSV/PDF report |

---

## 5. Super Admin Flows

### 5.1 UF-SA01: System Administration

**Actor:** Super Admin
**Trigger:** System-level management tasks.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Navigate to Admin Panel | System-level settings and workspace list |
| 2 | View all workspaces | List with owner, member count, document count |
| 3 | View system health | Service status, queue depths, error rates |
| 4 | Manage global settings | Provider defaults, file size limits, feature flags |
| 5 | View audit log (system-wide) | Filterable audit log across all workspaces |

---

## 6. API / Integration User Flows

### 6.1 UF-API01: Programmatic Extraction

**Actor:** API / Integration User
**Trigger:** External system needs to submit PDFs and retrieve MCQs.

```
External System                    MCQ Platform API
      │                                  │
      │──── POST /documents/upload ─────→│  Upload PDF
      │←─── 201 { documentId } ──────────│
      │                                  │
      │──── POST /jobs ─────────────────→│  Trigger extraction
      │←─── 202 { jobId } ───────────────│
      │                                  │
      │──── GET /jobs/:id (polling) ────→│  Check status
      │←─── 200 { status: "completed" }──│
      │                                  │
      │──── GET /mcq-records?docId=X ───→│  Retrieve MCQs
      │←─── 200 { records: [...] } ──────│
      │                                  │
      │──── POST /exports ──────────────→│  Create QTI export
      │←─── 202 { exportId } ────────────│
      │                                  │
      │──── GET /exports/:id/download ──→│  Download file
      │←─── 200 (QTI XML file) ──────────│
```

---

## 7. Cross-Role Flows

### 7.1 UF-CR01: End-to-End Document Lifecycle

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│Upload  │──→│Parse   │──→│Extract │──→│Validate│──→│Review  │──→│Export  │
│(Op)    │   │(System)│   │(System)│   │(System)│   │(Rev)   │   │(Op)    │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘
```

| Stage | Actor | Status Transition | System |
|-------|-------|-------------------|--------|
| Upload | Operator | → uploaded | S3 + Document record |
| Parse | System | → parsed | Pages + thumbnails extracted |
| Extract | System | → processing → extracted | OCR + LLM/VLM → MCQ records |
| Validate | System | → validated | 8-stage validation; confidence scores assigned |
| Review | Reviewer | → approved / rejected | Human QA with side-by-side view |
| Export | Operator | → exported | QTI/SCORM/xAPI file generated |

---

### 7.2 UF-CR02: Error Recovery Flow

| Error Scenario | Detection | Recovery Path |
|---------------|-----------|---------------|
| Upload fails mid-transfer | Client-side error | Retry upload; resumable upload (future) |
| Parser fails on document | Job task error | Retry task; try different parser |
| OCR fails on page | Job task error status | Retry page; try different OCR provider |
| LLM returns malformed output | Validation stage failure | Retry with different prompt/model |
| All providers fail | Job failed status | Alert admin; manual intervention |
| Review timeout (item assigned > 24hr) | Scheduled check | Unassign; return to queue |

---

## 8. State Diagram: MCQ Record Lifecycle

```
                    ┌───────────┐
                    │  Extracted │
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
                    │ Validating │
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────▼─────┐    │    ┌──────▼─────┐
        │  Auto-     │    │    │  Needs      │
        │  Approved  │    │    │  Review     │
        │ (conf≥90)  │    │    └──────┬─────┘
        └─────┬─────┘    │           │
              │     ┌─────▼─────┐    │
              │     │  Flagged  │    │
              │     │ (conf<50) │    │
              │     └─────┬─────┘    │
              │           │    ┌─────▼─────┐
              │           │    │ In Review  │
              │           │    └──┬────┬───┘
              │           │       │    │
              │     ┌─────▼──┐   │    │
              │     │Rejected│←──┘    │
              │     └────────┘        │
              │                 ┌─────▼────┐
              └────────────────→│ Approved  │
                                └─────┬────┘
                                      │
                                ┌─────▼─────┐
                                │ Exported   │
                                └───────────┘
```

---

## 9. Flow-to-Screen Mapping

| Flow | Screens Used |
|------|-------------|
| UF-OP01 (Upload & Extract) | Dashboard, Project View, Document List, Upload Modal, Document Detail, Job Monitor, MCQ Table |
| UF-OP02 (Bulk Upload) | Project View, Bulk Upload Modal, Batch Progress |
| UF-RV01 (Review Queue) | Review Queue, Side-by-Side Review, MCQ Editor |
| UF-RV02 (Batch Review) | Review Queue (batch mode) |
| UF-AD01 (Initial Setup) | Workspace Settings, Provider Management, User Management |
| UF-AD02 (User Management) | User List, Invite Dialog, User Detail |
| UF-AD03 (Provider Config) | Provider List, Provider Detail, Test Connection |
| UF-AN01 (Analytics) | Analytics Dashboard, Cost Dashboard |
| UF-API01 (API Integration) | N/A (API only) |
