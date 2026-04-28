# Investors Clinic Frontend

## Image Assets Required

Place images in these exact locations:

### Logo
- `public/images/logo/investors-clinic-logo-white.svg` - White logo for login page

### Backgrounds
- `public/images/backgrounds/login-background.jpg` - Aerial city view for login page

### Icons
- `public/images/icons/google-icon.svg` - Google login button
- `public/images/icons/apple-icon.svg` - Apple login button

## Environment

Config is env-only (no hardcoded URLs). Copy `frontend/.env.example` to `frontend/.env.local` and set:

- **`NEXT_PUBLIC_API_URL`** – backend API base (e.g. `http://localhost:3000/api/v1`).

AI (Gemini) is configured in the **backend** `.env`; the frontend talks to the backend API.

## Port 3001 and dev scripts

- Frontend runs on **port 3001** (`npm run dev`).
- If you see **`EADDRINUSE: address already in use :::3001`**:
  1. Stop any running dev server.
  2. Run **`npm run dev:fresh`** (kills port 3001, then starts dev), or **`npm run dev:clean`** (clears `.next`, kills port, then dev).
- Use **`dev:clean`** if you also hit `/_next/static/` 404s or broken styling (stale cache).
