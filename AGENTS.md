# Frontend stack policy

This repository is a frontend-only Next.js website. The allowed frontend stack is **TypeScript, React, Next.js, Tailwind CSS, semantic HTML5, CSS3, and Motion for React (`motion`) only**.

- New browser-facing application source must be TypeScript (`.ts` or `.tsx`); do not add plain JavaScript (`.js` or `.jsx`) frontend files.
- Do not introduce another frontend framework, styling system/library, or animation library. CSS3 and Tailwind CSS are the approved styling options; Motion for React is the approved animation package.
- HTML5 and CSS3 are web standards, not npm packages; do not attempt to install packages named for those standards.
- This frontend routes API traffic to the central service at `api.binzeo`. Do not add a local backend, API server, database, or API contract here.
- Keep `next.config.mjs` as tool configuration, not UI source; do not migrate it to TypeScript.
- Preserve existing API contracts, business logic, and visual design unless a task explicitly authorizes changes.
