# CodeGalaxy NOVA — Application Directory

**The complete and authoritative project documentation is in the [repository's root README](../README.md).**

That guide covers the full system architecture (with Mermaid diagrams), user journeys, page-by-page features, frontend and backend internals, 3D rendering, GitHub analysis, commit meteors, authentication, persistence, API endpoints, configuration, security, testing, deployment and limitations.

## Quick start

Open a terminal in this directory (`WAD_Codex/CodeGalaxy-NOVA/`).

```bash
npm run setup
```

Run the servers in separate terminals:

```bash
npm run dev:backend   # Express API on http://localhost:5000
npm run dev:frontend  # Vite frontend on http://localhost:3000
```

Create `backend/.env` with a strong `JWT_SECRET` and optional `GITHUB_TOKEN` before using authentication. Leave `DATABASE_URL` **unset** for the development in-memory fallback; configure a real Neon connection for persistent accounts.

## Important notes

- Everyone can explore the Milky Way and astronomical Solar System.
- Signing in is required for public GitHub repository analysis.
- The most recent analyzed repo is saved **per account, per browser**, not synchronized across devices.
- The Solar System reuses the existing eight planet visuals and maps the largest eight repository folders onto their labels.
- The commit timeline animates meteors only when GitHub changed-file paths can be resolved to mapped planets.
- Analytics include **estimates and heuristic metrics**; see the root README for precise limitations.
- The `backend/` source is committed here and includes NOVA changes. The optional `scripts/restore-backend.mjs` script is pinned to an older upstream `WAD_review` commit and should **not** be used to reset an updated backend.

[Read the complete technical README →](../README.md) · [GitHub source repository](https://github.com/Vraj-Ramavat/WAD_Codex)
