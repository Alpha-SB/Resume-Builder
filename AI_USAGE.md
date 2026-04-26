# AI Usage Documentation

## 1) Development AI Usage
AI assistance was used to:
- scaffold project structure and modules
- implement REST route patterns
- build frontend SPA CRUD flows
- generate and refine AI integration route/service code
- draft print layout and documentation content

All generated code was reviewed and adapted for class project constraints.

## 2) AGENTS.md Workflow
`AGENTS.md` is treated as the primary rules file for:
- architecture constraints
- stack limitations
- accessibility expectations
- AI safety constraints
- documentation requirements

During implementation, work followed those rules directly (no frontend frameworks, no CDN, reviewable AI output, no fabricated facts).

## 3) Application AI Feature
Current AI feature:
- **Gemini bullet review** via `POST /api/ai/review-bullet`

Input:
- `bulletText`
- optional `targetJobDescription`
- optional `apiKey`

Output shape:
- `original`
- `improved`
- `atsVersion`
- `issues[]`
- `suggestions[]`
- `questionsForUser[]`

## 4) Prompt Strategy Summary
Prompt logic is built in `services/prompt.service.js`.

Strategy:
- require JSON-only structured output
- enforce non-fabrication rules
- preserve meaning
- improve clarity/action verbs/ATS phrasing
- ask user for truthful quantification data instead of inventing numbers

## 5) Non-Fabrication Rule (Critical)
AI must not invent:
- employers
- job titles
- dates
- certifications
- awards
- metrics
- outcomes the user did not provide

## 6) User Review and Acceptance Flow
AI output is never auto-applied silently.
User must explicitly choose to:
- accept improved version
- accept ATS version
- copy text
- cancel

Only explicit acceptance applies updates.

## 7) API Key Handling
API key resolution order:
1. request body `apiKey`
2. saved local setting `gemini_api_key`
3. `.env` (`GEMINI_API_KEY`) for development fallback

Keys are not logged or returned in responses.

## 8) Local Key Storage Location
When saved from Settings UI, key is stored locally in SQLite table:
- table: `app_settings`
- key: `gemini_api_key`

This is local machine storage for class project use.

## 9) Security Notes
- `.env` is gitignored
- real API keys must never be committed
- AI output is treated as untrusted text and handled as review data

## 10) Codex/Assistant Notes
AI assistant tooling was used for implementation acceleration and documentation drafting.
Final code behavior and decisions were validated in-project and aligned with class requirements.
