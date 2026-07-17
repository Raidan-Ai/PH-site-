# PressHouse Platform - Installation Guide

## Prerequisites
- Node.js 20+
- npm or bun

## Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   The platform provides an interactive setup wizard to configure your environment and generate secure secrets:
   ```bash
   npm run setup
   ```
   This will:
   - Generate secure `JWT_SECRET`, `ENCRYPTION_KEY`, etc.
   - Prompt for Root Admin credentials and system emails.
   - Create a `.env` file based on your inputs.

   Alternatively, you can manually copy `.env.example` to `.env` and fill it yourself.

3. **Database Initialization**
   The system uses SQLite by default (`database.sqlite`). The schema is automatically managed by `src/db.ts` on startup.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Admin Access
Default admin credentials should be created via the registration flow or manual database insertion.
The admin path is configurable via `VITE_ADMIN_PATH` (default: `/admin`).

## Storage
Uploaded files are stored in the `/uploads` directory. Ensure this directory has write permissions.
