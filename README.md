# Jabiyen Website

Jabiyen is a frontend-only e-commerce website built with Next.js and React. Its approved frontend stack is **TypeScript, React, Next.js, Tailwind CSS, semantic HTML5, CSS3, and Motion for React (`motion`) only**.

## Stack rules

- Browser-facing app source must use `.ts` or `.tsx`; do not add plain JavaScript `.js` or `.jsx` frontend files.
- Do not add alternate frontend frameworks, styling libraries/systems, or animation libraries.
- HTML5 and CSS3 are web standards, not npm packages. Use semantic HTML and native CSS, plus the approved Tailwind CSS.
- Motion for React is provided by the `motion` package; it may be used when needed, but adding animations is not required.
- This is a frontend only. Requests are routed to the central `api.binzeo` service; do not create a local backend or change its API contracts.

## Development

Install packages with `npm install`. Run `npm run dev` to start the development server. The project requires `CENTRAL_API_BASE_URL` for Next configuration; production build validation can use a harmless HTTPS placeholder if no endpoint is available.

- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript without emitting output
- `npm run build` — create a production build

`next.config.mjs` is tool configuration and is intentionally not part of the UI TypeScript migration.
