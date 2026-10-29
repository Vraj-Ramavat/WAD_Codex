import React,{useState} from 'react';
import {Link,NavLink,useLocation} from 'react-router-dom';
import {ArrowUpRight,Menu,X,Orbit} from 'lucide-react';
export default function Navigation({session}){
 const [mobile,setMobile]=useState(false);const {pathname}=useLocation();React.useEffect(()=>setMobile(false),[pathname]);
 return <header className="nav-wrap">
  <Link to="/" className="brand" aria-label="CodeGalaxy NOVA home"><span className="brand-icon"><Orbit size={24} strokeWidth={1.5}/></span><span className="brand-word">CODEGALAXY<span>NOVA</span></span></Link>
  <nav className={'nav-links '+(mobile?'open':'')} aria-label="Main navigation">
   <NavLink end to="/">Home</NavLink><NavLink to="/explore">Milky Way</NavLink><NavLink to="/solar-system">Solar System</NavLink><NavLink to="/observatory">Observatory <small className="nova-nav-update">V2.1</small></NavLink><NavLink to="/about">About</NavLink>
  </nav>
  <div className="nav-actions"><span className="system-status"><i/> ALL SYSTEMS ONLINE</span><Link className="nav-cta" to={session?'/dashboard':'/login'}>{session?'Mission control':'Sign in'}<ArrowUpRight size={15}/></Link><button className="mobile-menu" aria-label={mobile?'Close navigation':'Open navigation'} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button></div>
 </header>
}
