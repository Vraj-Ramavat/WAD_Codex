# CodeGalaxy NOVA — Milky Way + Solar System + Repository Observatory

A ground-up, cinematic Three.js/React frontend inspired by [Vraj-Ramavat/WAD_review](https://github.com/Vraj-Ramavat/WAD_review). The original WAD_review Express/TypeScript backend is **restored without source modification** during setup, pinned to commit `6c48d2660dce5646578b4b3ea04eae142ed9614a` (October 22, 2026). The ZIP includes the complete new frontend, bundled procedural fallback maps, and the automated original-backend restoration mechanism.

> **Important packaging note:** The GitHub source could be inspected using a GitHub connector, but an archive could not be downloaded into the packaging environment. To guarantee the backend stays *exactly* as upstream instead of recreating or modifying it, `npm run setup` checks out the pinned upstream commit and copies its `backend/` directory untouched. This first-time step requires Git + internet and is **part of the installation**. The backend's source is not embedded in this ZIP; the ZIP is usable after setup.

## Run in VS Code (Windows, Linux, macOS)

1. Extract the ZIP and open the `CodeGalaxy-NOVA` folder in VS Code.
2. Install [Node.js 20.19+ or 22+](https://nodejs.org) and [Git](https://git-scm.com) if needed.
3. Open a VS Code terminal in the project root and run:

   ```bash
   npm run setup
   ```

   This restores the **original backend at the pinned commit**, installs frontend and backend dependencies, and attempts to upgrade the bundled placeholder planet textures to genuine 2K maps. If the texture download fails, the site still works with the included maps. (Textured planet maps are included as procedural fallbacks in the ZIP.)

4. **Terminal 1:**
   ```bash
   npm run dev:backend
   ```
   Expected API: `http://localhost:5000/api/health`

5. **Terminal 2:**
   ```bash
   npm run dev:frontend
   ```
   Visit **http://localhost:3000**.

**Windows shortcut:** After setup, double-click `start-windows.bat` to open both development servers. On macOS/Linux run `./start-linux-mac.sh`.

## What is implemented

- **Milky Way:** Procedurally generated, scientifically inspired four-arm spiral structure, warm dense galactic core, 28k stars, galactic dust bands, background stars, code constellation beacons, responsive orbit camera, and drifting meteor streaks.
- **Solar System:** Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn and its textured rings, Uranus, Neptune, planetary atmospheres, animated orbits, smooth camera fly-to, pause, time-speed controls, and planetary fact panels. Eight planets, correct names and approximate physical fact values; **sizes, distances and speeds are compressed and not orbital ephemerides**.
- **Realistic planetary maps:** Setup downloads real-colour 2K equirectangular maps from Solar System Scope (CC BY 4.0) into `frontend/public/textures/` and uses the locally served maps to avoid third-party cross-origin texture restrictions. If unavailable, bundled original procedural maps render instead. Run `npm run assets:upgrade` any time to retry.
- **Navigation:** Cinematic hyperspace transition with streaks, responsive navigation, carefully designed panels, scrollytelling landing page and motion-reduced OS preference support.
- **Code Observatory:** Real GitHub repository analysis via the existing Express backend. A central repository star; orbiting folder planets; files visualized as moons; folder detail inspector, LOC and ML-derived risk, stars, forks, overall health.
- **Authentication and Mission Control:** Signup, login, session checking, logout using the original API routes (JWT). Last analysis is cached in **sessionStorage on this browser session only**; it is not a replacement database.

## Backend integration

The original backend is **not changed**. Vite proxies `/api/*` to `http://127.0.0.1:5000`.

| API | New frontend behavior |
| --- | --- |
| `POST /api/auth/signup` | Signup and cookie/JWT session |
| `POST /api/auth/login` | Login and cookie/JWT session |
| `GET /api/auth/me` | Current user |
| `POST /api/auth/logout` | Logout |
| `POST /api/repos/analyze` | Direct repo analysis; reads **`data`** from the original Express response |
| `POST /api/repos/process-job` | Existing endpoint preserved; frontend doesn't need it |
| `GET /api/repos/status?jobId=...` | Supports job polling for a compatible async response |
| `GET /api/health` | Express health endpoint |

Unlike the older frontend, the new analysis page does not assume `/api/repos/analyze` always returns `jobId`. The Express backend returns `{status, repoId, data}` for a direct analysis; both direct and async formats are supported.

### Environment configuration

- Backend: `backend/.env.example` is restored by setup. Optional `DATABASE_URL`, `JWT_SECRET`, GitHub API token, etc., work according to the original backend. Without a DB, it uses an **in-memory fallback** (accounts and analysis cache reset after API server restart). Review your backend env file before production.
- Frontend: `VITE_API_BASE_URL` optional; default is same-origin `/api` via the dev proxy.
- For production deployment, point the frontend at your hosted backend and configure CORS/origin according to original `backend/src/server.ts`. The original backend permits `http://localhost:3000`, localhost and configured `FRONTEND_URL`.

## Commands

```bash
npm run setup              # one-time: restore backend + install + attempt real textures
npm run dev:backend        # API on :5000
npm run dev:frontend       # frontend on :3000
npm run build              # production frontend build
npm run assets:upgrade     # retry genuine 2K maps
npm run check:backend      # check that upstream backend source was restored
```

## Directory structure

```
CodeGalaxy-NOVA/
├── frontend/
│   ├── public/textures/       # bundled maps; updated with real maps at setup
│   ├── src/pages/             # landing, galaxy, solar, observatory, auth, dashboard
│   ├── src/scenes/            # custom Three.js and React Three Fiber worlds
│   ├── src/components/        # navigation and hyperspace transitions
│   ├── src/data/              # planet facts and featured code constellations
│   └── vite.config.js
├── backend/                 # original WAD_review backend restored by setup
├── scripts/
│   ├── restore-backend.mjs   # pinned, unmodified backend fetch
│   ├── download-textures.mjs # NASA-based visual textures (CC BY 4.0)
│   └── generate_fallback_textures.py
├── start-windows.bat
└── start-linux-mac.sh
```

## Scientific scope / technical limitations

The Milky Way scene illustrates a barred four-arm-like galactic morphology with procedural particles. It is *not* a measured reconstruction of actual stars, a Gaia catalogue, or photorealistic volumetric astrophysics. Planet orbital placements are for interactive demonstration; accurate ephemerides and physically correct size/distance scales are not provided. Texture downloads reproduce Solar System Scope maps based on NASA data, with some source imagery artistically filled or colour-adjusted.

The repository analyzer uses the **original project's** approximate ML bug-risk and dependency parsing methods, not static-analysis proof of defects. GitHub requests depend on API availability and rate limits. The original in-memory job tracking does not persist across deployments.

## Image attribution

Planet and Sun texture assets downloaded by `scripts/download-textures.mjs` are by **Solar System Scope**, licensed **Creative Commons Attribution 4.0 International (CC BY 4.0)**, based on NASA imagery.

- Source: https://www.solarsystemscope.com/textures/
- License: https://creativecommons.org/licenses/by/4.0/

Bundled fallback JPG and PNG texture images were generated programmatically by this project (illustrative, not accurate surface maps). When redistributed after setup, preserve this attribution.

## Backend provenance

- Upstream repository: https://github.com/Vraj-Ramavat/WAD_review
- Pinned revision: `6c48d2660dce5646578b4b3ea04eae142ed9614a`
- Preserved original backend files: `backend/` directory and its `package.json`, TypeScript controllers/services, schemas, API routes and environment template from that exact revision.

The source repository is **not modified by this project**. No GitHub writes are performed.
