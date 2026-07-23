# Email OTP Authentication (Demo)

A minimal, beginner-friendly full-stack demo of **passwordless login using a one-time password (OTP) sent by email**.

No passwords. No JWT. Just: enter your email → get a 6-digit code → enter the code → you're logged in.

---

## Tech Stack

- **Frontend:** Plain HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Email:** Nodemailer (Gmail SMTP or Mailtrap)

---

## Folder Structure

```
project/
│
├── frontend/
│   ├── login.html
│   ├── welcome.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── server.js
│   ├── prismaClient.js
│   ├── mailer.js
│   ├── routes/
│   │    └── auth.js
│   ├── controllers/
│   │    └── authController.js
│   ├── prisma/
│   │    ├── schema.prisma
│   │    ├── seed.js
│   │    └── migrations/
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## How It Works

1. There is **no registration page** on purpose — this demo focuses only on the OTP login flow. A user record must already exist in the database before they can log in.
2. On the **Login Page**, the user enters their email and clicks **Send OTP**.
3. The backend checks if that email exists in the `User` table.
   - If not found → `"Email not registered."`
   - If found → generates a random 6-digit OTP, saves it (with a 5-minute expiry) in the `Otp` table, and emails it to the user.
4. The user enters the OTP and clicks **Verify OTP**.
5. The backend checks:
   - Does the OTP match the latest one issued for that email?
   - Has it expired? → `"OTP expired. Please request a new one."`
   - Has it already been used? → rejected (one-time use only)
   - Otherwise → marks it as verified and returns success.
6. On success, the browser redirects to the **Welcome Page**. **Logout** clears the session and sends the user back to the Login Page.

---

## Setup Instructions

### 1. Prerequisites

- Node.js (v18+ recommended)
- A PostgreSQL database (local, or a free hosted one like [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- A Gmail account with an **App Password** (recommended), or a free [Mailtrap](https://mailtrap.io) account for testing

> **Gmail App Password:** Regular Gmail passwords won't work with Nodemailer if 2FA is enabled (which Google requires for App Passwords). Go to your Google Account → Security → 2-Step Verification → App Passwords, and generate one to use as `EMAIL_PASS`.

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
DATABASE_URL=postgresql://username:password@localhost:5432/otp_auth_db
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_app_password
PORT=4000
```

### 4. Run the database migration

This creates the `User` and `Otp` tables in your PostgreSQL database:

```bash
npx prisma migrate dev
```

### 5. Add a test user

Since there's no registration page, add a user manually so you have something to log in with:

```bash
node prisma/seed.js your-email@example.com
```

(Alternatively, use `npx prisma studio` to open a GUI and add a row to the `User` table directly.)

### 6. Start the backend server

```bash
npm start
```

The API will run at `http://localhost:4000`.

### 7. Open the frontend

The frontend is plain static HTML/CSS/JS — no build step needed. Just open `frontend/login.html` directly in your browser, or serve the folder with any static server, e.g.:

```bash
cd frontend
npx serve .
```

Make sure the email you log in with matches the one you added in step 5.

---

## API Endpoints

### `POST /send-otp`

Request body:
```json
{ "email": "user@example.com" }
```

Responses:
- `200` — `{ "success": true, "message": "OTP sent to your email." }`
- `404` — `{ "success": false, "message": "Email not registered." }`

### `POST /verify-otp`

Request body:
```json
{ "email": "user@example.com", "otp": "123456" }
```

Responses:
- `200` — `{ "success": true, "message": "Login successful." }`
- `400` — `{ "success": false, "message": "Invalid OTP." }`
- `400` — `{ "success": false, "message": "OTP expired. Please request a new one." }`

---

## Prisma Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  createdAt DateTime @default(now())

  otps      Otp[]
}

model Otp {
  id        Int      @id @default(autoincrement())
  otp       String
  expiresAt DateTime
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  userId    Int
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Security Notes

- OTPs are randomly generated 6-digit codes.
- OTPs expire 5 minutes after creation.
- Each OTP can only be verified once (`verified` flag prevents reuse).
- Old/expired OTP rows are not automatically deleted in this demo — in a production app you'd want a cleanup job (e.g., a cron task) to purge expired OTPs periodically.
- All inputs are validated (email format, required fields) and errors are handled with clear messages.
- This is a **teaching demo**, not a production-hardened auth system: it has no rate-limiting on OTP requests and no session/JWT tokens (the frontend just uses `sessionStorage` as a simple "logged in" flag for demo purposes). Add rate limiting and real sessions before using this pattern in production.

---

## Quick Command Reference

```bash
cd backend
npm install
npx prisma migrate dev
node prisma/seed.js your-email@example.com
npm start
```
