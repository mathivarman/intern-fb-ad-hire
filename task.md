# Task List — Intern Applicant Management System (IAMS)

## Phase 1: Project Setup
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install and configure Shadcn UI
- [ ] Setup ESLint, Prettier, and tsconfig paths
- [ ] Connect to MongoDB Atlas via Mongoose
- [ ] Configure environment variables (`.env.local`)
- [ ] Setup NextAuth.js with JWT strategy
- [ ] Setup Cloudinary for file storage
- [ ] Create base folder structure (`/app`, `/components`, `/lib`, `/models`, `/api`)

---

## Phase 2: Database & Models
- [ ] Create `User` Mongoose model
- [ ] Create `Position` Mongoose model
- [ ] Create `Batch` Mongoose model
- [ ] Create `Applicant` Mongoose model
- [ ] Create `Application` Mongoose model
- [ ] Create `CallLog` Mongoose model
- [ ] Add indexes on `phone` and `email` fields in `Applicant`
- [ ] Write phone number normalization utility (`lib/normalizePhone.ts`)
- [ ] Write duplicate detection logic (`lib/detectDuplicate.ts`)

---

## Phase 3: Authentication Module
- [ ] Build `/login` page (UI)
- [ ] Implement NextAuth credentials provider
- [ ] Protect all routes — redirect to `/login` if unauthenticated
- [ ] Build `/forgot-password` page and API
- [ ] Build `/profile` page (view & change password)

---

## Phase 4: Position Management Module
- [ ] Build `/positions` page with list table (TanStack Table)
- [ ] Create Position form (add/edit) with Shadcn Dialog
- [ ] `GET /api/positions` — list all positions
- [ ] `POST /api/positions` — create position
- [ ] `PUT /api/positions/[id]` — update position
- [ ] `PATCH /api/positions/[id]/status` — toggle active/inactive

---

## Phase 5: Batch Management Module
- [ ] Build `/batches` page with list table
- [ ] Create Batch form (add/edit) with position dropdown
- [ ] `GET /api/batches` — list all batches
- [ ] `POST /api/batches` — create batch
- [ ] `PUT /api/batches/[id]` — update batch

---

## Phase 6: CSV/Excel Upload Module
- [ ] Build `/upload` page — 6-step wizard UI
  - [ ] Step 1: Select Position
  - [ ] Step 2: Select Batch
  - [ ] Step 3: File upload input (drag & drop)
  - [ ] Step 4: Data preview table
  - [ ] Step 5: Validation results (errors, duplicates)
  - [ ] Step 6: Import confirmation & summary
- [ ] Integrate PapaParse for CSV parsing
- [ ] Integrate XLSX library for Excel parsing
- [ ] `POST /api/upload/preview` — parse and validate file
- [ ] `POST /api/upload/import` — save records to DB
  - [ ] Normalize phone numbers before insert
  - [ ] Run duplicate detection (phone → email fallback)
  - [ ] Create new applicant if no match, else reuse existing
  - [ ] Always create a new `application` entry
- [ ] Build `/import-history` page — list past uploads with stats

---

## Phase 7: Applicant Management Module
- [ ] Build `/applicants` page with TanStack Table
  - [ ] Columns: Name, Phone, Email, Language, Education, Position, Status, Date
  - [ ] Sortable columns
  - [ ] Pagination
- [ ] Build search bar (real-time, debounced)
- [ ] Build filter sidebar/panel
  - [ ] Language filter
  - [ ] Education filter
  - [ ] Status filter
  - [ ] Position filter
  - [ ] Date range filter
- [ ] `GET /api/applicants` — list with search & filter query params
- [ ] Build `/applicants/[id]` — Applicant Detail Page
  - [ ] Profile info card
  - [ ] Application history table
  - [ ] Call log history
  - [ ] CV viewer & download button
  - [ ] Status update dropdown

---

## Phase 8: Application Management
- [ ] `GET /api/applications` — list applications (with filters)
- [ ] `PATCH /api/applications/[id]/status` — update status
- [ ] Status change updates reflected in applicant detail page

---

## Phase 9: Calling Tracker Module
- [ ] Add "Log Call" button on Applicant Detail page
- [ ] Build Call Log form (Shadcn Dialog)
  - [ ] Fields: Outcome, Notes, Called Date, Follow-up Date
- [ ] `POST /api/call-logs` — save call log
- [ ] `GET /api/call-logs?applicationId=` — fetch logs for an application
- [ ] Display call logs timeline on applicant detail page

---

## Phase 10: CV Management Module
- [ ] Integrate Cloudinary upload for CV files
- [ ] `POST /api/cv/upload` — upload and link CV to applicant
- [ ] In-browser PDF preview (iframe or react-pdf)
- [ ] Download CV button
- [ ] Replace CV — upload new and archive old URL
- [ ] Show CV version history list

---

## Phase 11: Dashboard & Analytics Module
- [ ] Build `/dashboard` page
- [ ] Summary KPI cards (8–10 metrics)
  - [ ] Total Applicants
  - [ ] Unique Applicants
  - [ ] Tamil / Sinhala / English counts
  - [ ] Today's / This Month's Applicants
  - [ ] Selected Candidates
  - [ ] Conversion Rate %
  - [ ] Interview Rate %
- [ ] Charts (Recharts)
  - [ ] Bar chart: Applicants by Position
  - [ ] Pie chart: Applicants by Language
  - [ ] Bar chart: Applicants by Education Level
  - [ ] Line chart: Monthly Applications trend
  - [ ] Donut chart: Status Distribution
- [ ] `GET /api/dashboard/stats` — aggregated statistics API

---

## Phase 12: Reports & Export Module
- [ ] Build `/reports` page with filter controls
- [ ] Export to CSV (client-side with PapaParse)
- [ ] Export to Excel (client-side with XLSX)
- [ ] Export to PDF (html2pdf or server-side)
- [ ] Report types:
  - [ ] Daily Report
  - [ ] Weekly Report
  - [ ] Monthly Report
  - [ ] Position Report
  - [ ] Language Report
  - [ ] Selection Report

---

## Phase 13: User Management Module
- [ ] Build `/users` page — list admin users
- [ ] Add/Edit user form (Shadcn Dialog)
- [ ] `GET /api/users` — list users
- [ ] `POST /api/users` — create user
- [ ] `PUT /api/users/[id]` — update user
- [ ] `DELETE /api/users/[id]` — delete user

---

## Phase 14: Settings Module
- [ ] Build `/settings` page
- [ ] System name / logo settings
- [ ] Default language options
- [ ] (Future) SMTP email config

---

## Phase 15: UI Polish & Responsiveness
- [ ] Implement global layout (sidebar nav + topbar)
- [ ] Sidebar with navigation links to all modules
- [ ] Mobile responsive layout
- [ ] Loading skeletons for data tables
- [ ] Toast notifications (Shadcn Sonner) for all actions
- [ ] Empty states for all list pages
- [ ] Error boundary and 404 page

---

## Phase 16: Testing
- [ ] Unit tests for phone normalization utility
- [ ] Unit tests for duplicate detection logic
- [ ] API route integration tests
- [ ] End-to-end test: Upload CSV → verify applicants created/merged
- [ ] End-to-end test: Login → Dashboard → Applicant Detail

---

## Phase 17: Deployment
- [ ] Setup Vercel deployment
- [ ] Configure MongoDB Atlas production connection
- [ ] Set all production environment variables
- [ ] Final smoke test on production URL
- [ ] Write `README.md` with setup instructions

---

## Summary

| Phase | Status |
|---|---|
| Project Setup | ⬜ Not Started |
| Database & Models | ⬜ Not Started |
| Authentication | ⬜ Not Started |
| Position Management | ⬜ Not Started |
| Batch Management | ⬜ Not Started |
| CSV/Excel Upload | ⬜ Not Started |
| Applicant Management | ⬜ Not Started |
| Application Management | ⬜ Not Started |
| Calling Tracker | ⬜ Not Started |
| CV Management | ⬜ Not Started |
| Dashboard & Analytics | ⬜ Not Started |
| Reports & Export | ⬜ Not Started |
| User Management | ⬜ Not Started |
| Settings | ⬜ Not Started |
| UI Polish | ⬜ Not Started |
| Testing | ⬜ Not Started |
| Deployment | ⬜ Not Started |
