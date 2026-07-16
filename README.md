# Nova HRMS (AL-Attendant-tracking)

Nova HRMS is a comprehensive, production-ready Human Resources Management System (HRMS) MVP. It provides end-to-end administration workflows including authentication with role-based permission control, employee profile management, shift/schedule setup, geolocation-validated attendance tracking (check-in/out), automated payroll processing, and secure document storage.

---

## 🌟 Key Features

### 🔐 1. Authentication & Security
- **Multi-strategy Auth:** Session and JWT-based authentication.
- **Google OAuth Integration:** Secure single sign-on (SSO).
- **Two-Factor Authentication (OTP):** Verification codes sent via Mailer (Gmail SMTP support).
- **Fine-Grained Permissions:** Role-based access control (RBAC) with workspace role guards.
- **Global & Route Rate Limiting:** Progressive login delays powered by Redis caching to prevent brute-force attacks.

### 👥 2. Employee & Organization Structure
- **Employee Management:** Rich profile tracking, contact info, contracts, and employment status.
- **Organizational Units:** Department and position hierachies with specialized configurations.
- **Work Locations & Shifts:** Multi-office geographic locations and work shift scheduling (normal shifts, night shifts, flexible setups).

### ⏰ 3. Attendance Tracking (Check-in/Out)
- **Flexible Check-in/out:** Employee portal supporting web-based check-in/out.
- **Location Validation:** Geofenced validation matching the employee's assigned work location.
- **Shift Rule Engine:** Grace periods, late checking detection, and early check-out calculation.

### 💵 4. Payroll & Payslips
- **Automated Calculations:** Salary calculations based on shift logs, hourly rates, overtime, unpaid leave, and dynamic deductions/allowances.
- **Payslips & Approvals:** Reviewing and releasing monthly payslips with multi-stage approval status.

### 📁 5. Documents & Media Storage
- **File Upload Service:** Cloudinary and Imgur storage integrations for employee profile pictures and contract documents.

---

## 📁 Project Structure

```
AL-Attendant-tracking/
├── backend/                  # NestJS API Engine
│   ├── src/
│   │   ├── common/           # Custom guards, filters, interceptors, and date/time utilities
│   │   ├── config/           # Database, mail, and application config definitions
│   │   └── modules/          # Domain-specific modules (auth, attendance, payroll, etc.)
│   ├── test/                 # End-to-end (E2E) integration spec files
│   └── package.json
│
├── frontend/                 # Vite + React Admin Prototype
│   ├── src/
│   │   ├── components/       # Shared UI components and layout wrappers
│   │   ├── lib/              # API clients, axios config, and helper utils
│   │   ├── views/            # Screen views (Dashboard, Attendance, Employees, Payroll, etc.)
│   │   └── main.tsx          # Application entrypoint
│   └── package.json
│
└── docs/                     # Module flow documentation & PRD gap reports
```

---

## 🛠️ Tech Stack

- **Backend:** NestJS, TypeScript, MongoDB (via Mongoose), Redis (caching & adapter), Socket.IO, Passport.js.
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, React Query, Zustand, Axios, Jodit Rich Text Editor.
- **Cloud Integrations:** Cloudinary, Imgur, Gmail SMTP, Google OAuth.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)
- **Redis** (Optional, for caching and rate limiting)

---

### Step 1: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables:
   Copy the template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in the required values:
   - `DB_CONNECTION_STRING` (MongoDB URI)
   - `JWT_SECRET` & `REFRESH_TOKEN_SECRET`
   - Mail settings (`MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD` if testing OTP verification)
   - Cloudinary credentials (for image uploads)
   - Google Client ID/Secret (for Google Login)

4. Run the NestJS application in watch mode:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5512` by default.*

---

### Step 2: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables:
   Copy the template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure:
   - `VITE_API_BASE_URL` (points to the backend, e.g., `http://localhost:5512`)
   - `VITE_ENABLE_DEMO_LOGIN` (`true` to enable fallback quick role-switching in prototype)

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The admin dashboard will be available at `http://localhost:3000`.*

---

## 🧪 Testing & Validation

Run commands from the respective application root.

### Backend Tests
- **Unit Tests:** `npm test` (Runs Jest tests located beside source files)
- **E2E Integration Coverage:** `npm run test:e2e` (Runs database-connected endpoint tests from `backend/test`)

### Frontend Validation
- **TypeScript & Lint Validation:** `npm run lint`
