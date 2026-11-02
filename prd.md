# Product Requirements Document (PRD)
# Intern Applicant Management System (IAMS)
### Apptron Solutions — Internal Recruitment Platform

---

## 1. Project Overview

The **Intern Applicant Management System (IAMS)** is a web-based platform developed for Apptron Solutions to manage internship applications collected through Google Forms. The system eliminates duplicate applicants, centralizes applicant records, tracks recruitment progress, and provides analytics dashboards.

The system supports bulk CSV/Excel uploads from Google Forms and automatically detects duplicate applicants based on phone numbers and email addresses.

---

## 2. Objectives

### Business Goals
- Centralize all internship applications
- Remove duplicate applicants automatically
- Track candidate application history
- Reduce manual Excel work
- Improve intern recruitment process
- Generate recruitment reports

### User Goals
- Upload Google Form responses easily
- Search candidates quickly
- Filter candidates by language, position, education, etc.
- Track interview progress
- Export applicant reports

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, TanStack Table |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | NextAuth.js, JWT |
| **File Storage** | Cloudinary / AWS S3 (Optional) |
| **Charts** | Recharts |
| **CSV Processing** | PapaParse, XLSX |

---

## 4. User Roles

### Admin (Only Role)

| Capability | Access |
|---|---|
| Manage users | ✅ |
| Manage positions | ✅ |
| Manage batches | ✅ |
| Upload applicant files | ✅ |
| View & export reports | ✅ |
| View & manage applicants | ✅ |
| Update application statuses | ✅ |
| Add interview notes & call logs | ✅ |
| Manage system settings | ✅ |

> **Note:** Only a single `admin` role exists. All authenticated users have full access to all features.

---

## 5. Main Modules

---

### Module 1: Authentication

**Features**
- Login
- Forgot Password
- Change Password

**Pages**
- `/login`
- `/forgot-password`
- `/profile`

**Behavior**
- JWT-based sessions via NextAuth.js
- Protected routes — unauthenticated users are redirected to `/login`

---

### Module 2: Position Management

**Features**
- Create, edit, and deactivate internship positions

**Example Positions**
- Frontend Intern
- Backend Intern
- Full Stack Intern
- UI/UX Intern
- Graphic Design Intern
- Digital Marketing Intern
- HR Intern

**Position Fields**

| Field | Type | Required |
|---|---|---|
| Position Name | String | ✅ |
| Department | String | ✅ |
| Description | Text | ❌ |
| Status | Enum: active/inactive | ✅ |

---

### Module 3: Batch Management

**Features**
- Create and manage recruitment batches per position

**Example Batches**
- Frontend Internship June 2026
- Digital Marketing Batch July 2026

**Batch Fields**

| Field | Type | Required |
|---|---|---|
| Batch Title | String | ✅ |
| Position | Reference → positions | ✅ |
| Start Date | Date | ✅ |
| End Date | Date | ✅ |
| Description | Text | ❌ |

---

### Module 4: CSV/Excel Upload

**Supported Formats**
- `.csv`
- `.xls`
- `.xlsx`

**Upload Flow (6 Steps)**

| Step | Action |
|---|---|
| 1 | Select Position |
| 2 | Select Batch |
| 3 | Upload File |
| 4 | Preview Data |
| 5 | Validate Records |
| 6 | Import Records |

---

#### Duplicate Detection Logic

**Primary Key:** Phone Number  
**Secondary Key:** Email Address

**Example:**

| Field | Existing Record | Uploaded Record |
|---|---|---|
| Phone | `0771234567` | `+94771234567` |

System normalizes both → `94771234567` → **Duplicate Detected**

**Result:** No new applicant profile is created. Only a new **application entry** is added to the existing applicant.

---

#### Phone Number Normalization

All of the following formats are normalized to `94XXXXXXXXX`:

| Input Format | Normalized |
|---|---|
| `0771234567` | `94771234567` |
| `+94771234567` | `94771234567` |
| `94771234567` | `94771234567` |
| `771234567` | `94771234567` |

---

### Module 5: Applicant Management

**Applicant Profile Fields**

| Field | Type |
|---|---|
| Full Name | String |
| Email | String |
| Phone Number | String (normalized) |
| Group | String |
| LinkedIn URL | URL |
| Portfolio URL | URL |
| Education Level | Enum |
| Preferred Language | Enum |
| CV URL | URL |
| Applicant Status | Enum |

**Application Statuses**

| Status | Description |
|---|---|
| New | Freshly imported |
| Called | Contact attempted |
| No Answer | No response received |
| Interested | Expressed interest |
| Interview Scheduled | Interview confirmed |
| Interviewed | Interview completed |
| Selected | Candidate selected |
| Rejected | Not proceeding |
| On Hold | Decision deferred |

---

### Module 6: Application History

Each applicant can have **multiple applications** across different positions and batches. No duplicate profiles are created.

**Example — Applicant: John Silva**

| Application | Batch |
|---|---|
| Frontend Intern | Jan 2026 |
| UI/UX Intern | Feb 2026 |
| Marketing Intern | Apr 2026 |
| Backend Intern | Jun 2026 |

---

### Module 7: Candidate Search

**Search Fields**
- Name
- Phone Number
- Email
- Position
- Language

**Behavior:** Real-time search with debounce

---

### Module 8: Filters

| Filter | Options |
|---|---|
| Language | Tamil, Sinhala, English |
| Education | Diploma, HND, Undergraduate, Graduate |
| Status | New, Selected, Rejected (and all statuses) |
| Position | All active positions |
| Date Range | Custom start/end date |

---

### Module 9: Recruitment Dashboard

**Summary Cards**

| KPI | Description |
|---|---|
| Total Applicants | All application entries |
| Total Unique Applicants | Distinct applicant profiles |
| New Applicants | Status = New |
| Selected Applicants | Status = Selected |
| Rejected Applicants | Status = Rejected |
| Pending Applicants | All non-terminal statuses |

**Charts (via Recharts)**
- Applicants by Position
- Applicants by Language
- Applicants by Education Level
- Monthly Applications (trend line)
- Status Distribution (pie/donut chart)

---

### Module 10: Calling Tracker

**Call Log Fields**

| Field | Type |
|---|---|
| Called Date | Date |
| Called By | String (admin name) |
| Call Outcome | Enum |
| Notes | Text |
| Follow-up Date | Date |

**Call Outcomes**

- No Answer
- Busy
- Interested
- Not Interested
- Interview Scheduled
- Selected
- Rejected

---

### Module 11: CV Management

**Features**
- View CV (in-browser preview)
- Download CV
- Replace CV
- Track CV version history

---

### Module 12: Reports & Exports

**Export Formats**
- CSV
- Excel (.xlsx)
- PDF

**Report Types**

| Report | Scope |
|---|---|
| Daily Report | Today's applicants |
| Weekly Report | This week's applicants |
| Monthly Report | This month's applicants |
| Position Report | Per-position breakdown |
| Language Report | By preferred language |
| Selection Report | Selected candidates list |

---

## 6. Dashboard KPIs

| KPI | Metric |
|---|---|
| Total Applicants | Count of all applications |
| Unique Applicants | Count of distinct profiles |
| Tamil Applicants | Language filter count |
| Sinhala Applicants | Language filter count |
| English Applicants | Language filter count |
| Today's Applicants | Applied today |
| This Month's Applicants | Applied this month |
| Selected Candidates | Status = Selected |
| Conversion Rate | Selected / Total Applicants |
| Interview Rate | Interviewed / Total Applicants |

---

## 7. MongoDB Collections

```json
// users
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "passwordHash": "string",
  "role": "admin",
  "createdAt": "Date"
}

// positions
{
  "_id": "ObjectId",
  "name": "Frontend Intern",
  "department": "string",
  "description": "string",
  "status": "active | inactive",
  "createdAt": "Date"
}

// batches
{
  "_id": "ObjectId",
  "title": "Frontend Internship June 2026",
  "positionId": "ObjectId",
  "startDate": "Date",
  "endDate": "Date",
  "description": "string",
  "createdAt": "Date"
}

// applicants
{
  "_id": "ObjectId",
  "fullName": "string",
  "email": "string",
  "phone": "string (normalized: 94XXXXXXXXX)",
  "group": "string",
  "linkedin": "string",
  "portfolio": "string",
  "educationLevel": "Diploma | HND | Undergraduate | Graduate",
  "preferredLanguage": "Tamil | Sinhala | English",
  "cvUrl": "string",
  "createdAt": "Date"
}

// applications
{
  "_id": "ObjectId",
  "applicantId": "ObjectId",
  "positionId": "ObjectId",
  "batchId": "ObjectId",
  "status": "New | Called | No Answer | Interested | Interview Scheduled | Interviewed | Selected | Rejected | On Hold",
  "appliedDate": "Date",
  "createdAt": "Date"
}

// call_logs
{
  "_id": "ObjectId",
  "applicationId": "ObjectId",
  "calledBy": "string",
  "outcome": "No Answer | Busy | Interested | Not Interested | Interview Scheduled | Selected | Rejected",
  "notes": "string",
  "calledDate": "Date",
  "followUpDate": "Date"
}
```

---

## 8. Core Pages (Screens)

| # | Page | Route |
|---|---|---|
| 1 | Login | `/login` |
| 2 | Dashboard | `/dashboard` |
| 3 | Applicants | `/applicants` |
| 4 | Applicant Details | `/applicants/[id]` |
| 5 | Positions | `/positions` |
| 6 | Batches | `/batches` |
| 7 | Upload CSV | `/upload` |
| 8 | Import History | `/import-history` |
| 9 | Reports | `/reports` |
| 10 | Users | `/users` |
| 11 | Settings | `/settings` |
| 12 | Profile / Change Password | `/profile` |

---

## 9. Future Enhancements

### Phase 2
- WhatsApp Integration
- Bulk SMS
- Email Notifications
- AI Candidate Ranking
- Auto Shortlisting
- Interview Scheduling & Calendar Integration
- Candidate Portal
- QR Code Applicant Verification

### Phase 3
- Resume Parsing AI
- Skill Matching Engine
- Interview Evaluation Module
- Employee Conversion Tracking
- Recruitment Forecast Dashboard

---

## 10. Estimated Development Timeline

| Phase | Duration |
|---|---|
| UI/UX Design | 3 Days |
| Database Design | 2 Days |
| Backend APIs | 7 Days |
| Frontend Development | 8 Days |
| Testing | 3 Days |
| Deployment | 2 Days |
| **Total** | **20–25 Days** |
