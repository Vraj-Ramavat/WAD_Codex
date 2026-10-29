# CodeGalaxy NOVA — immersive 3D website

This repository has been initialized as the destination for CodeGalaxy NOVA. **The application source and assets have not yet been uploaded.**

The complete application is available in the previously provided `CodeGalaxy_NOVA_Immersive_3D_Website.zip` archive. To publish it, extract the archive and push the contents of the **CodeGalaxy-NOVA** folder to this repository's `main` branch.

```bash
cd CodeGalaxy-NOVA
git init
git branch -M main
git remote add origin https://github.com/Vraj-Ramavat/WAD_Codex.git
git fetch origin main
git add .
git commit -m "feat: add immersive CodeGalaxy NOVA website"
git pull --rebase origin main
git push -u origin main
```

The `backend/` directory in the archive is only a placeholder; `npm run setup` restores the unchanged backend from the pinned `WAD_review` commit. This requires Git and an internet connection. The frontend and fallback planetary textures are included in the archive.
