# 🧠 TAMYEZ — AI‑Powered Career Recommendation & Roadmap Backend

TAMYEZ is a **Node.js + TypeScript** backend powering an intelligent career recommendation platform.  
It allows users to:

✨ Take an **AI‑generated Career Assessment Quiz**  
✨ Get matched to a recommended **Career Path**  
✨ Follow a structured **Roadmap** of steps & quizzes  
✨ Track **strict-linear progress**  
✨ Receive personalized learning experiences

This project includes fully modularized architecture, robust authentication, strict-linear roadmap progression, soft-delete lifecycle, and AWS/Firebase utilities — all implemented using modern best practices.

***

## 📑 Table of Contents

*   \#-features
*   \#-tech-stack
*   \#-folder-structure
*   \#-class-diagram--database-view
*   \#-environment-variables
*   \#-installation
*   \#-development
*   \#-production
*   \#-docker-support
*   \#-api-modules
*   \#-middlewares
*   \#-soft-delete--lifecycle-system
*   \#-progress-engine-strict-linear
*   \#-cron-jobs
*   \#-security
*   \#-license

***

# 🧩 Features

### 🌟 AI-driven Career Recommendation

*   Generates personalized careers based on assessment quiz answers.
*   Uses AI scoring logic & Firebase integrations.

### 📚 Roadmap Engine (Strict Linear)

*   Steps have **dense order 1..N**.
*   Supports inserts, deletes, freezes, restores.
*   Uses **frontierStep** + **orderEpoch** to keep user progress consistent.

### 📝 Multi‑Quiz Step Completion

*   Each Step can contain multiple required quizzes.
*   A step is completed when **all quizzes score ≥ 50**.
*   Retakes update (or remove) saved quiz attempts.

### 🧮 User Progress Tracking

*   Linear gating: users can only start `frontier + 1` step.
*   In‑progress state tracking.
*   Backfill support for newly added steps.

### 🛡 Authentication & Authorization

*   JWT-based auth.
*   Google OAuth support.
*   Full validation via Zod.
*   Rate limiting, Helmet, CORS.

### 🗂 Modular Architecture

*   Each domain encapsulated under `src/modules/`.
*   Uses repository → service → controller pattern.

### 🗄 MongoDB Storage (Mongoose ODM)

*   Models, interfaces, repositories.

### ☁️ AWS S3 Integrations

*   Signed URLs for uploads.
*   Large file streaming.
*   Multer pipelines.

### 🔥 Firebase Admin Support

*   Push notifications.
*   Messaging.
*   Token verification.

### 📬 Email Support

*   Nodemailer transactional emails.
*   Password reset links.
*   Account restore links.

### 🔄 Soft Delete Architecture

*   Careers, steps, quizzes, users follow lifecycle:
    *   active → frozen → archived → deleted
*   Automatic gating and block rules.

### ⏰ Cron Jobs

*   Cleanup jobs.
*   TTL cleanup for quiz attempts.
*   Soft-delete scheduled deletions.

***

# 🧱 Tech Stack

### **Backend**

*   Node.js (TypeScript)
*   Express 5
*   MongoDB (Mongoose 8)

### **Auth**

*   JWT
*   Google OAuth (google-auth-library)
*   Firebase Admin

### **Utilities**

*   Rate limiting
*   Helmet
*   Multer
*   Morgan

### **Cloud**

*   AWS S3 (`@aws-sdk/client-s3`)
*   Firebase Admin SDK

### **Validation**

*   Zod

### **Other**

*   Nodemailer
*   CryptoJS
*   NanoID
*   Cron

***

# 📁 Folder Structure

```bash
src/
│
├── db/
│   ├── interfaces/
│   ├── models/
│   ├── repositories/
│   └── db.connection.ts
│
├── middlewares/
│   ├── auths.middleware.ts
│   ├── progress.middleware.ts
│   └── validation.middleware.ts
│
├── modules/
│   ├── auth/
│   ├── career/
│   ├── quiz/
│   ├── roadmap/
│   ├── user/
│   ├── firebase/
│   └── modules.routes.ts
│
├── utils/
│   ├── constants/
│   ├── cron_jobs/
│   ├── email/
│   ├── events/
│   ├── exceptions/
│   ├── firebase/
│   ├── handlers/
│   ├── multer/
│   ├── question/
│   ├── quiz/
│   ├── security/
│   ├── services/
│   ├── soft_delete/
│   ├── stream/
│   ├── types/
│   ├── update/
│   └── validators/
│
├── app.controller.ts
└── index.ts
```

***
## 🧩 Class Diagram
![Class Diagram](./assets/TAMYEZ%20Class%20Diagram.jpg)

***

# 🔧 Environment Variables

Create `config/.env.development` and `.env.production`:

```env
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
AWS_ACCESS_KEY=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
GOOGLE_CLIENT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
EMAIL_HOST=
EMAIL_USER=
EMAIL_PASS=
```

***

# 🚀 Installation

```bash
git clone https://github.com/yourusername/tamyez_app.git
cd tamyez_app
npm install
```

***

# 🛠 Development

Start TS watcher + node:

```bash
npm run start:dev
```

Environment will be loaded from:

    config/.env.development

***

# 📦 Production

Build + run:

```bash
npm run build
npm run start:prod
```

Uses:

    config/.env.production

***

# 🐳 Docker Support

### Development

```bash
docker-compose -f docker-compose-dev.yaml up --build
```

### Production (PM2 Cluster Mode)

```bash
docker-compose -f docker-compose-prod.yaml up --build
```

### Base Dockerfile Included

*   Multi-stage for optimized production image
*   PM2-runtime support

***

# 🧱 API Modules

### 🔐 Auth Module

*   Signup / Login / Refresh Tokens
*   Google OAuth
*   Email verification
*   Reset password
*   Freeze/restore account (user + admin)
*   Hard delete with active-attempt gating

### 🧬 Career Module

*   Create / freeze / restore / delete careers
*   Enforce lifecycle rules
*   Career assessment quiz (singleton)
*   Career selection

### 🗺 Roadmap Module

*   Create/update/delete/insert steps
*   Strict-linear ordering
*   Step freezing/restoring
*   Step resources (courses, videos, books)

### ❓ Quiz Module

*   Multi-quiz per step
*   AI‑generated questions
*   Scoring logic
*   Saved quiz attempts
*   Quiz lifecycle (active/frozen/deleted)

### 📈 Progress Module

*   Strict-linear engine
*   Insert-step backfills
*   Frontier advancing
*   Gating logic
*   Step availability classification

***

# 🧠 Progress Engine (Strict‑Linear)

TAMYEZ implements strict-linear progression:

*   A user can only start the step:
        frontierOrder + 1
*   If a new step is inserted before frontier:
    *   It becomes `locked_prereq`
    *   User must complete all backfill steps before continuing
*   `frontierStep` moves ONLY on full completion of a step
*   `orderEpoch` ensures progress remains valid after edits

***

# ⏰ Cron Jobs

Located in:

    src/utils/cron_jobs/

Jobs include:

*   TTL cleanup for quiz attempts
*   Scheduled hard-deletes (24–48h after freeze)
*   Email reminder jobs
*   Periodic progress sync tasks

***

# 🔒 Security

*   JWT auth (access + refresh tokens)
*   Rate limiting (express-rate-limit)
*   Helmet hardened headers
*   Input validation (Zod)
*   Password hashing (bcryptjs)
*   File upload sanitization
*   AWS S3 secure presigned URLs
*   Firebase token verification

***

# 📜 License

This project is licensed under the **ISC License**.

***

# 🎉 Final Notes

TAMYEZ is a graduation project built with production-quality architecture.  
If you're reviewing this repository, feel free to open issues or discuss improvements!

***
