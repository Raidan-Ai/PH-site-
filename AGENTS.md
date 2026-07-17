# PressHouse CMS - Agent Rules & Context

This file contains persistent rules and context for AI coding agents working on the PressHouse project.

## Core Identity
- **Project Name**: PressHouse (بيت الصحافة - اليمن)
- **Sector**: Media, Civil Society, Human Rights.
- **Tone**: Professional, journalistic, high-contrast modern design.

## Technical Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Lucide Icons, Swiper.
- **Backend**: Node.js (tsx), Express.
- **Database**: SQLite (local) with `better-sqlite3`. MySQL/MariaDB compatible for production.
- **Localization**: `i18next` with Arabic (RTL) as primary and English (LTR) as secondary.
- **SEO**: `react-helmet-async`. Meta tags are managed via settings.

## Developer Rules
1. **RTL Support**: Always ensure RTL compatibility using `dir="rtl"` or checking `i18n.language === 'ar'`. Use `rtl:` and `ltr:` classes where necessary.
2. **Design Language**: 
   - Use "Inter" font for general UI and "Space Grotesk" or similar for headings (Google Fonts).
   - Prefer rounded corners (`rounded-2xl`, `rounded-[48px]`).
   - Use high-contrast slate-900 for dark text and white backgrounds.
3. **Database Migrations**: Add migrations to `src/db.ts` using `try-catch` blocks for `ALTER TABLE` statements to ensure idempotency.
4. **Environment Variables**:
   - `GEMINI_API_KEY`: Server-side only.
   - `VITE_ADMIN_PATH`: Custom path for admin dashboard.
   - `VITE_ROOT_PATH`: Custom path for system superuser dashboard.
5. **AI Ethics**: The AI Chat Assistant (`/api/ai/chat`) must be visitor-oriented. It must NEVER perform admin actions or mention its internal model name.

## Directory Structure
- `/src/components`: Reusable UI components.
- `/src/pages`: Page components organized by user role (admin, staff, journalist, root).
- `/src/services`: API services and AI service wrappers.
- `/src/context`: React Context providers (Auth, etc.).
- `/uploads`: Directory for media uploads (should be synced/persisted).

## Security
- Passwords must be hashed with `bcryptjs`.
- JWT used for session management.
- File uploads are restricted by mimetype.
