# Lighthouse Accessibility Tracking

## Current Status
- Latest score: `100`

## How To Run Lighthouse (Chrome)
1. Start app (`npm start`).
2. Open `http://localhost:3000` in Chrome.
3. Open DevTools.
4. Go to **Lighthouse** tab.
5. Select:
   - Mode: Navigation
   - Device: Desktop (and optionally Mobile)
   - Category: Accessibility
6. Click **Analyze page load**.
7. Save screenshot/report and record score in this file.

## Accessibility Checklist
- [done] Visible labels for every form input
- [done] Clear validation messaging for required fields
- [done] Keyboard navigation works across all sections
- [done] Interactive controls are reachable and usable without mouse
- [done] Modal dialogs are keyboard accessible and closable
- [done] Semantic headings and section structure used
- [done] Buttons and links have meaningful text
- [done] Focus styles remain visible
- [done] Contrast is readable in major views
- [done] Print preview remains legible and structured

## Current Implementation Notes
- SPA sections use semantic heading structure.
- Form-heavy pages include `<label>` + control associations.
- Toasts, modal, and confirm dialog use Bootstrap components.
- Print CSS isolates resume content for PDF export readability.

