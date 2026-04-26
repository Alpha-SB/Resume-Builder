# Resume Builder (CSC3100 Final Project)

## Overview
Resume Builder is a local-first single page web application for creating, organizing, tailoring, previewing, and printing resumes.

The app is designed for class requirements:
- plain HTML/CSS/JavaScript frontend
- Node.js + Express REST backend
- SQLite storage
- local libraries only (no CDN)

## Core Features
- Profile, Education, Experience, Skills, Certifications, and Awards CRUD
- Experience bullet CRUD with Gemini AI bullet review suggestions
- Resume Builder flow to create named resume versions
- Resume item selection using checkboxes and saved `resume_items`
- Resume Preview generated from database-backed selected content
- AI cover letter generation from selected resume + target job details
- Print / Save as PDF support using browser print + print CSS
- Settings screen for local Gemini API key save/clear
- About / Attributions section in app UI

## Tech Stack
- Frontend: HTML, CSS, JavaScript (SPA hash routing)
- Backend: Node.js, Express
- Database: SQLite
- AI: Google Gemini API
- UI libraries (local files): Bootstrap, Bootswatch Litera, Bootstrap Icons, Quill

## No CDN Policy
This project does not use CDN links.
All frontend library files are stored locally in `public/vendor`.

## Installation
```bash
npm install
```

## Environment Setup
1. Copy `.env.example` to `.env`
2. Configure values:

```env
PORT=3000
DB_PATH=./db/resume_builder.db
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Notes:
- `GEMINI_MODEL` defaults to `gemini-2.5-flash` if not set.
- If Google changes model availability, update `GEMINI_MODEL` in `.env` and restart.
- `GEMINI_API_KEY` in `.env` is optional for development fallback.
- Preferred production/class flow is user-supplied key in Settings.
- Never commit real API keys.

## Database Setup
Initialize schema:
```bash
npm run init-db
```

This creates/updates tables from `db/schema.sql` in the configured SQLite DB path.

## Run the App
```bash
npm start
```

App URL: `http://localhost:3000`

Health endpoint: `http://localhost:3000/api/health`

## AI Bullet Review Usage
1. Open Experience section.
2. Add or select an experience bullet.
3. Optionally paste a target job description at top of Experience page.
4. Click **AI Review** beside a bullet.
5. Review returned suggestions in modal.
6. Choose one of:
   - Accept Improved
   - Accept ATS
   - Copy Improved
   - Copy ATS
   - Cancel

Important AI behavior:
- AI suggestions are review-first.
- No silent overwrite.
- AI must not invent resume facts.

## AI Cover Letter Usage
1. Open **Resume Builder**.
2. In the **AI Cover Letter Generator** section, select a saved resume.
3. Enter target job title and paste job description.
4. Optionally include company name.
5. Click **Generate Cover Letter**.
6. Review and edit the generated letter in the editable text area.
7. Use **Copy** when ready.

Important AI behavior:
- Draft is not auto-saved.
- User must review before submitting anywhere.
- AI must not invent facts.

## Resume Builder Usage
1. Open **Resume Builder** section.
2. Create new resume or choose existing resume.
3. Enter resume name + target job information.
4. Select education, experiences, bullets, skills/categories, certifications, and awards.
5. Click **Save Resume and Selections**.
6. Click **Open Preview** to view rendered resume.

## Resume Preview and PDF Export
1. Open **Resume Preview**.
2. Choose a saved resume.
3. Click **Print / Save as PDF**.
4. In browser print dialog, choose **Save as PDF** if desired.

Print output is controlled by `public/css/print.css` and is designed to show only resume content.

## Accessibility Notes
- Forms include visible labels.
- Semantic headings are used across sections.
- Reusable modals and confirmations use Bootstrap dialog behavior.
- Lighthouse target for accessibility: **93+**.

See `LIGHTHOUSE.md` for checklist and run instructions.

## Documentation Files
- `AGENTS.md` - class/project rules and constraints
- `AI_USAGE.md` - AI usage policy and implementation notes
- `LIGHTHOUSE.md` - accessibility checklist and Lighthouse guidance
- `docs/third-party-attributions.md` - dependency attribution details

## Final Submission Checklist (Placeholder)
- [ ] Project files complete
- [ ] AI documentation complete
- [ ] Lighthouse evidence screenshot added
- [ ] Example PDF exported from app
- [ ] Install/run notes verified
- [ ] GitHub repository link added
- [ ] Class-required extra deliverables added

## GitHub Link Placeholder
- `TBD: add repository URL here`
