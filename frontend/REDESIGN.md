# Frontend redesign notes

Presentation-only. Untouched (byte-identical): `src/api/*`, `src/types`, `src/context/AuthContext.tsx`,
`ProtectedRoute`, routes and role rules in `App.tsx`, `.env*`, `vite.config.ts`, `public/_redirects`.
Same endpoints, same payloads, same localStorage keys.

## Run
    npm install
    npm run dev      # or: npm run build

## Design tokens (src/index.css `:root`)
concrete #e8ebe7 page, white sheets, ink #14212b, forklift yellow #f5b800 (primary action, active tab),
ballpoint blue #1b4f9c (references, focus), stamp red #b3261e (low stock, cancel), tally green #20713f (confirmed).
Font: Archivo Variable (self-hosted via @fontsource-variable/archivo), width axis for condensed titles.

## Structure
- components/: Masthead, Sheet (side panel/dialog), Confirm, Pagination, StatusMark, TableState, LogoIcon
- context/ToastContext + hooks/useToast, hooks/useDebounce, lib/format
- Removed: Three.js background (and `three`, `@types/three`), Sidebar, emoji icons, glass/gradient CSS.

## Behaviour changes (frontend only)
Debounced search; stale-response guard; keeps rows visible while reloading; confirm dialog before cancelling an order;
stock warnings on order lines and stock movements; dashboard "Running low" list (existing products `lowStock` filter);
role-aware dashboard links; Esc/focus-trap/aria on dialogs; phone-friendly stacked tables; print-ready order (Print order).
