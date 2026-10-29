import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=resolve(fileURLToPath(new URL('..', import.meta.url)));
const TARGET=join(ROOT,'backend');
const SHA='6c48d2660dce5646578b4b3ea04eae142ed9614a';
if(existsSync(join(TARGET,'src','server.ts'))){ console.log('Original backend already exists. No files modified.'); process.exit(0); }
const tmp=mkdtempSync(join(tmpdir(),'codegalaxy-nova-'));
try {
  console.log('Restoring WAD_review backend from immutable upstream Git commit '+SHA+' ...');
  execFileSync('git',['clone','--quiet','--no-checkout','https://github.com/Vraj-Ramavat/WAD_review.git',join(tmp,'upstream')],{stdio:'inherit'});
  execFileSync('git',['-C',join(tmp,'upstream'),'checkout','--quiet',SHA],{stdio:'inherit'});
  cpSync(join(tmp,'upstream','backend'),TARGET,{recursive:true,force:true});
  console.log('Backend copied unmodified from upstream '+SHA);
} catch(err) { console.error('Could not restore backend. Check Git and internet connectivity.',err.message); process.exitCode=1; }
finally {rmSync(tmp,{recursive:true,force:true});}
