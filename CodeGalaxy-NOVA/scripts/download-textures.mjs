import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const dir=resolve('frontend/public/textures'); await mkdir(dir,{recursive:true});
const maps={sun:'2k_sun.jpg',mercury:'2k_mercury.jpg',venus:'2k_venus_atmosphere.jpg',earth:'2k_earth_daymap.jpg',mars:'2k_mars.jpg',jupiter:'2k_jupiter.jpg',saturn:'2k_saturn.jpg',uranus:'2k_uranus.jpg',neptune:'2k_neptune.jpg',moon:'2k_moon.jpg',saturn_ring:'2k_saturn_ring_alpha.png'};
let ok=0;
await Promise.all(Object.entries(maps).map(async ([name,file])=>{
 try{ const response=await fetch(`https://www.solarsystemscope.com/textures/download/${file}`,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const blob=Buffer.from(await response.arrayBuffer()); if(blob.length<8000)throw Error('File too small');
  await writeFile(`${dir}/${name}.${file.endsWith('.png')?'png':'jpg'}`,blob); console.log('✓',name,Math.round(blob.length/1024)+'KB');ok++;
 }catch(e){console.warn('Using bundled procedural fallback for',name,'—',e.message)}
}));
console.log(`${ok}/${Object.keys(maps).length} astronomy texture maps upgraded.`);
