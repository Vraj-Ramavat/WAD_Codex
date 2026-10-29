"""Create original procedural 1K textures for zero-network fallback. Not astronomical maps."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy.ndimage import gaussian_filter
from pathlib import Path
from math import pi
out=Path(__file__).resolve().parent.parent/'frontend/public/textures';out.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(42);W,H=1024,512
x=np.linspace(0,1,W)[None,:]; y=np.linspace(0,1,H)[:,None]
def field(s=12):
 a=np.zeros((H,W)); amp=1
 for sigma in [55,23,9,3]:
  n=gaussian_filter(rng.normal(size=(H,W)),sigma,mode='wrap');n=(n-n.mean())/(n.std()+1e-5)
  a+=n*amp; amp*=.45
 return a
noise=field()
def save(name,rgb):
 arr=np.asarray(rgb);arr=np.broadcast_to(arr,(H,W,3));arr=np.uint8(np.clip(arr,0,255));Image.fromarray(arr,'RGB').save(out/f'{name}.jpg',quality=87,optimize=True)
def mix(a,b,t): return np.asarray(a)[None,None,:]*(1-t[...,None])+np.asarray(b)[None,None,:]*t[...,None]
# Sun: golden solar granulation + hot bright faculae
v=np.clip(.53+.18*noise+.09*np.sin(x*130+noise*.9),0,1)
save('sun',mix([125,22,2],[255,207,71],v))
# Mercury: greyscale cratered terrain
v=np.clip(.4+.12*noise,0,1); save('mercury',mix([67,62,63],[167,151,130],v))
# Venus: ochre cloud layers
v=np.clip(.5+.22*np.sin(y*50+noise*.5)+.10*noise,0,1);save('venus',mix([112,64,28],[240,212,154],v))
# Earth continents via Natural Earth geometry - actual geographic outlines, stylized topography
mask=Image.new('L',(W,H),0);d=ImageDraw.Draw(mask)
try:
 import fiona
 shp='/opt/pyvenv/lib/python3.13/site-packages/pyogrio/tests/fixtures/naturalearth_lowres/naturalearth_lowres.shp'
 with fiona.open(shp) as features:
  for feature in features:
   g=feature['geometry']; coords=g['coordinates'];rings=[coords] if g['type']=='Polygon' else coords if g['type']=='MultiPolygon' else []
   for poly in rings:
    for j,ring in enumerate(poly):
     pts=[((lo+180)/360*W,(90-la)/180*H) for lo,la in ring]
     if len(pts)>2:d.polygon(pts,fill=255 if j==0 else 0)
except Exception as e: print('No earth coastlines:',e)
land=np.asarray(mask)/255
lat=np.abs(np.linspace(-1,1,H))[:,None]
ocean=np.stack([np.broadcast_to(14+10*noise,(H,W)),np.broadcast_to(38+11*noise,(H,W)),np.broadcast_to(77+14*noise,(H,W))],axis=-1)
terrain=mix([36,76,37],[151,135,87],np.clip(.46+.23*noise,0,1))
terrain=np.broadcast_to(terrain,(H,W,3));rgb=terrain*land[...,None]+ocean*(1-land[...,None]);ice=np.clip((lat-.86)*5,0,1)
rgb=rgb*(1-ice[...,None])+np.array([221,231,233])*ice[...,None]
# blended clouds
clouds=np.clip((field()-.82)*.25,0,.25);rgb=rgb*(1-clouds[...,None])+np.array([230,237,241])*clouds[...,None];save('earth',rgb)
# Mars orange dark lava marks
v=np.clip(.5+.23*noise+.1*np.sin(y*12+noise),0,1);save('mars',mix([88,44,30],[230,130,84],v))
# Jupiter bands and Great Red Spot hint
bands=np.sin(y*74+np.sin(x*15)*.9+noise*.5)*.55+np.sin(y*23+noise*.3)*.25+noise*.08
v=np.clip(.5+.29*bands,0,1);rgb=mix([118,67,50],[245,223,193],v)
spot=np.exp(-((x-.63)/.043)**2-((y-.59)/.052)**2)
rgb=rgb*(1-spot[...,None]*.7)+np.array([187,82,56])*spot[...,None]*.7; save('jupiter',rgb)
# Saturn banded ivory
v=np.clip(.53+.25*np.sin(y*85+noise*.15)+.1*np.sin(y*24),0,1);save('saturn',mix([130,104,75],[238,214,166],v))
# Ice giants
v=np.clip(.5+.08*noise+.1*np.sin(y*45+noise*.18),0,1);save('uranus',mix([83,153,164],[181,228,226],v))
v=np.clip(.4+.2*noise+.16*np.sin(y*41+noise*.24),0,1);save('neptune',mix([16,36,119],[75,129,220],v))
v=np.clip(.5+.18*noise,0,1);save('moon',mix([55,57,63],[182,178,173],v))
# transparent saturn ring with sharp divisions
rw=1024;rh=128
arr=np.zeros((rh,rw,4),dtype=np.uint8)
for j in range(rh):
 t=j/(rh-1); ring=np.sin(t*90)*.25+np.sin(t*190)*.12+.5
 alpha=int(180*max(0,min(1,ring))) if .07<t<.94 and not .58<t<.63 else 0
 arr[j,:,:3]=[int(171+31*ring),int(145+33*ring),int(105+32*ring)];arr[j,:,3]=alpha
Image.fromarray(arr,'RGBA').save(out/'saturn_ring.png')
print('Wrote 11 bundled original procedural texture fallback assets')
