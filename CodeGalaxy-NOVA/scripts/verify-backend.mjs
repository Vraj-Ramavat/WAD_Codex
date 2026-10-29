import { existsSync } from 'node:fs';
if(!existsSync('backend/src/server.ts')){console.error('Backend not restored. Run npm run setup');process.exit(1)}
console.log('Backend source present. Original reference: Vraj-Ramavat/WAD_review @ 6c48d2660dce5646578b4b3ea04eae142ed9614a');
