# Email OTP Authentication (Demo)

A minimal, beginner-friendly full-stack demo of login using **email + password + a one-time OTP code**, with a bot-check gate and CAPTCHA.

---

## Tech Stack

- **Frontend:** Plain HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Email:** Nodemailer (Gmail SMTP or Mailtrap)
- **Password hashing:** bcryptjs

---

## Folder Structure

```
project/
│
├── frontend/
│   ├── login.html
│   ├── signup.html
│   ├── welcome.html
│   ├── style.css
│   ├── script.js
│   └── signup.js
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

### Sign Up (`signup.html`)
1. User enters **email, username, date of birth, password, and re-entered password**.
2. Backend validates everything (valid email, passwords match, password ≥ 6 characters, email not already registered).
3. Password is hashed with bcrypt and the user is stored.
4. On success: **"Successfully signed up."** is shown, and the user can click through to Login.

### Login (`login.html`)
1. **Bot check** — only an "I'm not a robot" checkbox is shown at first. Checking it reveals the login form.
2. **Email + Password + CAPTCHA** — user enters their email, password, and the randomly generated CAPTCHA code, then clicks **Send OTP**.
   - Backend checks the email exists and the password is correct before issuing an OTP.
   - If the email isn't registered → `"Email not registered."`
   - If the password is wrong → `"Incorrect password."`
   - If both are correct → a 6-digit OTP is generated, stored with a 5-minute expiry, and emailed.
3. **OTP verification** — user enters the code and clicks **Verify OTP**.
   - Wrong code → `"Invalid OTP."`
   - Expired → `"OTP expired. Please request a new one."`
   - Already used → rejected (one-time use only)
   - Correct → **"Successfully logged in."** and redirect to the Welcome page.
4. **Welcome page** — displays the success message and a **Logout** button, which clears the session and returns to Login.

---

## Setup Instructions

### 1. Prerequisites

- Node.js (v18+ recommended)
- A PostgreSQL database (local, or a free hosted one like [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- A Gmail account with an **App Password** (recommended), or a free [Mailtrap](https://mailtrap.io) account for testing

> **Gmail App Password:** Regular Gmail passwords won't work with Nodemailer if 2FA is enabled (which Google requires for App Passwords). Go to your Google Account → Security → 2-Step Verification → App Passwords, and generate one to use as `EMAIL_PASS`.

> **Using Supabase?** Its default "direct connection" string often fails over some networks (IPv6-only). Use the **connection pooler** instead: copy the pooled URI (port 6543) into `DATABASE_URL`, and the session pooler URI (port 5432) into `DIRECT_URL`. If you're not using Supabase's pooler, you can delete the `directUrl` line in `schema.prisma` and the `DIRECT_URL` variable.

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
DIRECT_URL=postgresql://username:password@localhost:5432/otp_auth_db
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_app_password
PORT=4000
```

### 4. Set up the database

```bash
npx prisma migrate reset --force
```

This creates the `User` (with `email`, `username`, `dob`, `password`, `createdAt`) and `Otp` tables. `migrate reset` is used here (rather than `migrate dev`) so the schema always starts clean — fine for a demo project.

### 5. Create an account

You have two options:

**Option A — Use the Sign Up page (recommended):** start the servers (steps 6–7 below), open `signup.html`, and fill out the form.

**Option B — Seed one from the command line:**
```bash
node prisma/seed.js your-email@example.com yourusername 1998-04-12 yourpassword123
```

### 6. Start the backend server

```bash
npm start
```

The API will run at `http://localhost:4000`.

### 7. Open the frontend

No build step needed — plain static HTML/CSS/JS. Serve the folder:

```bash
cd frontend
npx serve .
```

Then open `signup.html` to create an account, or `login.html` if you already have one.

---

## API Endpoints

### `POST /signup`

Request body:
```json
{
  "email": "user@example.com",
  "username": "jane",
  "dob": "1998-04-12",
  "password": "mypassword123",
  "confirmPassword": "mypassword123"
}
```

Responses:
- `200` — `{ "success": true, "message": "Successfully signed up." }`
- `400` — validation errors (invalid email, password too short, passwords don't match, etc.)
- `409` — `{ "success": false, "message": "Email is already registered. Please log in instead." }`

### `POST /send-otp`

Request body:
```json
{ "email": "user@example.com", "password": "mypassword123" }
```

Responses:
- `200` — `{ "success": true, "message": "OTP sent to your email." }`
- `404` — `{ "success": false, "message": "Email not registered." }`
- `401` — `{ "success": false, "message": "Incorrect password." }`

### `POST /verify-otp`

Request body:
```json
{ "email": "user@example.com", "otp": "123456" }
```

Responses:
- `200` — `{ "success": true, "message": "Successfully logged in." }`
- `400` — `{ "success": false, "message": "Invalid OTP." }`
- `400` — `{ "success": false, "message": "OTP expired. Please request a new one." }`

---

## Prisma Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String
  dob       DateTime
  password  String
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

- Passwords are hashed with bcrypt before storage — never stored in plain text.
- The password is verified **before** an OTP is generated or sent, so an attacker can't spam OTP emails without knowing the password.
- OTPs are randomly generated 6-digit codes, expire after 5 minutes, and can only be verified once.
- The CAPTCHA is client-side only — good for blocking casual bots and as a teaching example, but not cryptographically secure since the code lives in browser JS. For real security you'd generate and verify it server-side.
- All inputs are validated (email format, required fields, password length, password match) and errors are handled with clear messages.
- This is a **teaching demo**, not a production-hardened auth system: no rate-limiting on login/OTP requests, no JWT/session tokens (the frontend uses `sessionStorage` as a simple "logged in" flag). Add rate limiting and real sessions before using this pattern in production.

---

## Quick Command Reference

```bash
cd backend
npm install
npx prisma migrate reset --force
node prisma/seed.js your-email@example.com yourusername 1998-04-12 yourpassword123
npm start
```

