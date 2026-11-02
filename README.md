# IAMS — Intern Applicant Management System

**Apptron Solutions** — Internal Recruitment Platform

A web-based platform for managing internship applications collected through Google Forms. The system eliminates duplicate applicants, centralizes applicant records, tracks recruitment progress, and provides analytics dashboards.

## Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| **Frontend**     | Next.js 16, TypeScript, Tailwind CSS, Shadcn UI  |
| **Backend**      | Next.js API Routes                               |
| **Database**     | MongoDB Atlas, Mongoose ODM                      |
| **Auth**         | NextAuth.js v5 (Auth.js), JWT sessions           |
| **File Storage** | Cloudinary (optional)                            |
| **Charts**       | Recharts                                         |
| **CSV/Excel**    | PapaParse, XLSX                                  |

## Features

- 🔐 JWT-based authentication with credentials provider
- 📊 Dashboard with KPI cards and Recharts analytics
- 👥 Applicant management with search, filter, pagination
- 📋 Position & batch management
- 📤 CSV/Excel upload with 6-step wizard, duplicate detection, phone normalization
- 📞 Calling tracker with call logs
- 📄 Import history with rollback capability
- 📈 Reports & export (CSV/Excel/PDF)
- 👤 User management (admin only)
- ⚙️ Settings page

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd <project-directory>

# 2. Install dependencies
npm install

# 3. Copy environment file and fill in values
cp .env.example .env.local

# 4. Seed the database with an admin user
npm run seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### Default Admin Credentials (from seed)

```
Email:    admin@apptron.com
Password: Admin@123
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects it as a Next.js project

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable                  | Value                              | Required |
| ------------------------- | ---------------------------------- | -------- |
| `MONGODB_URI`             | Your MongoDB Atlas connection URI  | ✅       |
| `AUTH_SECRET`             | Generate with `npx auth secret`    | ✅       |
| `AUTH_URL`                | Your Vercel deployment URL         | ✅       |
| `NEXT_PUBLIC_APP_NAME`    | `IAMS`                             | ✅       |
| `NEXT_PUBLIC_APP_URL`     | Your Vercel deployment URL         | ✅       |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name              | ❌       |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                 | ❌       |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret              | ❌       |

> **Important:** Make sure your MongoDB Atlas cluster allows connections from Vercel's IP range. In Atlas → Network Access → Add `0.0.0.0/0` to allow all IPs (or add Vercel's specific IPs).

### 4. Deploy

Click **Deploy** — Vercel will build and deploy automatically.

### 5. Seed Production Database

After deployment, run the seed script locally against the production MongoDB:

```bash
MONGODB_URI="your-production-mongodb-uri" npm run seed
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── applicants/       # Applicant list & detail pages
│   │   ├── batches/          # Batch management
│   │   ├── calling/          # Calling tracker
│   │   ├── dashboard/        # Analytics dashboard
│   │   ├── import-history/   # Import log with rollback
│   │   ├── positions/        # Position management
│   │   ├── profile/          # User profile
│   │   ├── reports/          # Reports & exports
│   │   ├── settings/         # System settings
│   │   ├── upload/           # CSV/Excel upload wizard
│   │   └── users/            # User management
│   ├── api/                  # API routes
│   ├── login/                # Login page
│   └── forgot-password/      # Password reset
├── components/               # Reusable UI components
├── lib/                      # Utilities (auth, db, normalization)
├── models/                   # Mongoose models
└── proxy.ts                  # Auth middleware (route protection)
```

## License

Private — Apptron Solutions Internal Use
