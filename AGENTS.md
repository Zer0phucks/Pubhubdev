# Repository Guidelines

## Project Structure & Module Organization
This Vite + React workspace keeps runtime code in `src`. `main.tsx` bootstraps React, while `App.tsx` orchestrates dashboard views and context providers. Modular UI lives in `src/components` (Radix primitives, command palette, Supabase-aware auth flows). Shared visuals stay in `src/assets` and `src/public` for icons. Style tokens and Tailwind overrides live in `src/index.css` and `src/styles`. Domain helpers (`src/utils`, `src/types`) centralize data contracts, and Supabase Edge functions reside in `src/supabase/functions/server`.

## Build, Test, and Development Commands
Run `npm install` once to sync dependencies. `npm run dev` launches Vite with HMR; append `-- --host 0.0.0.0` when testing on devices. `npm run build` emits the optimized bundle used for previews; always inspect the output or run `npx vite preview` after a successful build. Use `npx supabase functions serve src/supabase/functions/server` when iterating on backend logic.

## Coding Style & Naming Conventions
Code is TypeScript-first; keep components as typed functions with explicit props. Follow the existing two-space indentation, double quotes for strings, and trailing commas in multi-line data. Components, contexts, and providers use `PascalCase`, hooks use the `useX` prefix, and utility helpers stay `camelCase`. Tailwind utility chains belong in JSX `className`; extract repeated patterns into `clsx`/`cva` helpers under `src/styles` or `src/components/ui`.

## Testing Guidelines
Automated tests are not yet wired, so document manual QA steps inside each PR. When adding coverage, prefer Vitest + React Testing Library with colocated `*.test.tsx` files beside the component under test. Mock Supabase calls via dependency injection to avoid leaking keys, and include snapshot tests only for purely presentational widgets. For server functions, add lightweight `deno test` suites under `src/supabase/functions`.

## Commit & Pull Request Guidelines
History favors short imperative subjects (for example, “Update files from Figma Make”). Keep summaries under 60 characters, elaborate in the body if needed, and group changes by feature. Every PR should describe the user-facing impact, list reproduction steps, attach UI screenshots for visual updates, and link the relevant specification or issue. Confirm `npm run build` output, note any skipped verifications, and mention required environment variables so reviewers can reproduce.

## Security & Configuration Tips
Never commit `.env` files. Frontend code should read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, while Edge functions rely on `SUPABASE_SERVICE_ROLE_KEY`. Rotate keys if they leak, and audit requests hitting `src/components/AuthContext` so secrets never touch the client bundle. When sharing logs, redact tokens and user metadata, and update `claudedocs/` if the security posture changes.
