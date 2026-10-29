const STORAGE_PREFIX='nova_last_repo_v3:';
export function repoKey(user){return STORAGE_PREFIX+(user?.id||user?.email||'guest')}
export function readLastRepo(user){try{const v=JSON.parse(localStorage.getItem(repoKey(user))||'null');return v&&Array.isArray(v.folders)?v:null}catch{return null}}
export function saveLastRepo(user,repo){if(!user||!repo?.folders)return;try{localStorage.setItem(repoKey(user),JSON.stringify(repo));localStorage.setItem('nova_recent_user',user.id||user.email||'')}catch(e){console.warn('Local storage quota reached. Keeping a compact repository snapshot.',e);try{const compact={...repo,folders:repo.folders.map(f=>({...f,files:(f.files||[]).slice(0,80)})),commits:(repo.commits||[]).slice(0,30)};localStorage.setItem(repoKey(user),JSON.stringify(compact))}catch{}}}
export function removeLastRepo(user){if(user)localStorage.removeItem(repoKey(user))}
