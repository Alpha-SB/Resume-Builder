# Lighthouse Accessibility Tracking

## Accessibility Target
- Required Lighthouse accessibility score: **93+**

## Current Status
- Latest score: `TBD`
- Screenshot evidence path: `TBD (add image before final submission)`

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
- [ ] Visible labels for every form input
- [ ] Clear validation messaging for required fields
- [ ] Keyboard navigation works across all sections
- [ ] Interactive controls are reachable and usable without mouse
- [ ] Modal dialogs are keyboard accessible and closable
- [ ] Semantic headings and section structure used
- [ ] Buttons and links have meaningful text
- [ ] Focus styles remain visible
- [ ] Contrast is readable in major views
- [ ] Print preview remains legible and structured

## Current Implementation Notes
- SPA sections use semantic heading structure.
- Form-heavy pages include `<label>` + control associations.
- Toasts, modal, and confirm dialog use Bootstrap components.
- Print CSS isolates resume content for PDF export readability.

## Final Submission Reminder
Include:
- Lighthouse accessibility score screenshot
- score value entered above
- notes on any known accessibility limitations
