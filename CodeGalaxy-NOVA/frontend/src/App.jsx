import React,{useEffect,useState} from 'react';
import {BrowserRouter,Routes,Route,Navigate,useLocation,useNavigate} from 'react-router-dom';
import Navigation from './components/Navigation';
import WarpTransition from './components/WarpTransition';
import {Footer} from './components/UI';
import SpaceCanvas from './scenes/SpaceCanvas';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import SolarPage from './pages/SolarPage';
import ObservatoryPage from './pages/ObservatoryPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import {api,token} from './lib/api';
import {readLastRepo} from './lib/recentRepo';
function Experience(){
 const {pathname}=useLocation(),navigate=useNavigate();
 const [session,setSession]=useState(null),[checked,setChecked]=useState(false);
 const [selected,setSelected]=useState(null),[speed,setSpeed]=useState(1),[paused,setPaused]=useState(false);
 const [repo,setRepo]=useState(null),[commit,setCommit]=useState(null),[meteorTick,setMeteorTick]=useState(0);
 useEffect(()=>{let mounted=true;async function load(){try{if(token()){const res=await api('/api/auth/me');if(mounted)setSession(res.user||null)}}catch{localStorage.removeItem('nova_token')}finally{if(mounted)setChecked(true)}}load();return()=>{mounted=false}},[]);
 useEffect(()=>{setRepo(session?readLastRepo(session):null)},[session]);
 useEffect(()=>{window.scrollTo(0,0)},[pathname]);
 const mode=pathname==='/solar-system'?'solar':pathname==='/explore'?'galaxy':pathname==='/observatory'||pathname==='/dashboard'||pathname==='/analyze'||pathname.startsWith('/galaxy/')?'none':'home';
 const handleRepo=data=>{setRepo(data);setSelected(null);setCommit(null)};
 return <div className="app-shell"><Navigation session={session}/><WarpTransition/>
 {mode!=='none'&&<SpaceCanvas mode={mode} selected={selected} onSelect={setSelected} speed={speed} paused={paused} repo={mode==='solar'?repo:null} commit={mode==='solar'?commit:null} meteorTick={meteorTick}/>}
 <main><Routes>
 <Route path="/" element={<HomePage/>}/>
 <Route path="/explore" element={<ExplorePage/>}/>
 <Route path="/solar-system" element={<SolarPage repo={repo} selected={selected} setSelected={setSelected} speed={speed} setSpeed={setSpeed} paused={paused} setPaused={setPaused} onCommit={setCommit} onMeteor={()=>setMeteorTick(n=>n+1)}/>}/>
 <Route path="/observatory" element={<ObservatoryPage session={session} checked={checked} onRepo={handleRepo}/>}/>
 <Route path="/galaxy/:repoId" element={<ObservatoryPage session={session} checked={checked} onRepo={handleRepo}/>}/>
 <Route path="/analyze" element={<ObservatoryPage session={session} checked={checked} onRepo={handleRepo}/>}/>
 <Route path="/login" element={<AuthPage mode="login" onSuccess={setSession}/>}/>
 <Route path="/signup" element={<AuthPage mode="signup" onSuccess={setSession}/>}/>
 <Route path="/dashboard" element={<DashboardPage session={session} setSession={setSession} checked={checked}/>}/>
 <Route path="/about" element={<AboutPage/>}/>
 <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes></main><Footer/><div className="screen-noise" aria-hidden="true"/><div className="edge-vignette" aria-hidden="true"/></div>
}
export default function App(){return <BrowserRouter><Experience/></BrowserRouter>}
