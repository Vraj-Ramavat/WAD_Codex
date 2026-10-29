const BASE=import.meta.env.VITE_API_BASE_URL||'';
export const token=()=>localStorage.getItem('nova_token');
export async function api(path, options={}){
 const res=await fetch(BASE+path,{credentials:'include',...options,headers:{'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`} :{}),...options.headers}});
 let data;try{data=await res.json()}catch{throw Error(`Server returned an invalid response (${res.status}). Is the Express backend running?`)}
 if(!res.ok)throw Error(data?.error||data?.message||`Request failed: ${res.status}`);
 return data;
}
export async function analyzeRepo(url){
  const result=await api('/api/repos/analyze',{method:'POST',body:JSON.stringify({url})});
  if(result.data) return result.data;
  if(result.repo) return result.repo;
  if(result.jobId) return pollJob(result.jobId);
  throw Error('The backend did not return an analysis object.');
}
async function pollJob(id){for(let i=0;i<45;i++){
 const value=await api('/api/repos/status?jobId='+encodeURIComponent(id));
 if(value.status==='done')return value.data||value.resultRepo;
 if(value.status==='failed')throw Error(value.error||'Analysis failed');
 await new Promise(r=>setTimeout(r,1200));
}throw Error('Analysis timed out. Please retry.');}
export const fmt=(n)=>typeof n==='number'?n.toLocaleString('en-US'):n??'—';
