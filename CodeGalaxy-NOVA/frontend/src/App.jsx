import React,{useEffect,useState} from 'react';
import {BrowserRouter,Routes,Route,Navigate,useLocation} from 'react-router-dom';
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
function Experience(){const {pathname}=useLocation();const [session,setSession]=useState(null),[checked,setChecked]=useState(false);const [selected,setSelected]=useState(null),[speed,setSpeed]=useState(1),[paused,setPaused]=useState(false);
 useEffect(()=>{let mounted=true;async function load(){try{if(token()){const res=await api('/api/auth/me');if(mounted)setSession(res.user||null)}}catch{localStorage.removeItem('nova_token')}finally{if(mounted)setChecked(true)}}load();return()=>{mounted=false}},[]);
 useEffect(()=>{window.scrollTo(0,0)},[pathname]);
 const mode=pathname==='/solar-system'?'solar':pathname==='/explore'?'galaxy':pathname==='/observatory'||pathname==='/dashboard'||pathname==='/analyze'||pathname.startsWith('/galaxy/')?'none':'home';
 return <div className="app-shell"><Navigation session={session}/><WarpTransition/>{mode!=='none'&&<SpaceCanvas mode={mode} selected={selected} onSelect={setSelected} speed={speed} paused={paused}/>}
 <main><Routes>
 <Route path="/" element={<HomePage/>}/>
 <Route path="/explore" element={<ExplorePage/>}/>
 <Route path="/solar-system" element={<SolarPage selected={selected} setSelected={setSelected} speed={speed} setSpeed={setSpeed} paused={paused} setPaused={setPaused}/>}/>
 <Route path="/observatory" element={<ObservatoryPage/>}/>
 <Route path="/galaxy/:repoId" element={<ObservatoryPage/>}/>
 <Route path="/analyze" element={<ObservatoryPage/>}/>
 <Route path="/login" element={<AuthPage mode="login" onSuccess={setSession}/>}/>
 <Route path="/signup" element={<AuthPage mode="signup" onSuccess={setSession}/>}/>
 <Route path="/dashboard" element={<DashboardPage session={session} setSession={setSession} checked={checked}/>}/>
 <Route path="/about" element={<AboutPage/>}/>
 <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes></main><Footer/><div className="screen-noise" aria-hidden="true"/><div className="edge-vignette" aria-hidden="true"/></div>
}
export default function App(){return <BrowserRouter><Experience/></BrowserRouter>}
