import React from 'react';import {ArrowRight,ArrowUpRight}from'lucide-react';import{Link}from'react-router-dom';
export function Eyebrow({children}){return <div className="eyebrow"><span className="eyebrow-line"/>{children}</div>}
export function PrimaryLink({to,children,ghost=false}){return <Link to={to} className={'button '+(ghost?'button-ghost':'button-primary')}>{children}<ArrowUpRight size={17}/></Link>}
export function SectionTag({number,children}){return <div className="section-tag"><span>{number}</span>{children}</div>}
export function Readout({label,value,unit}){return <div className="readout"><span>{label}</span><b>{value}</b>{unit&&<small>{unit}</small>}</div>}
export function Footer(){return <footer className="footer"><div className="footer-brand">CODEGALAXY <em>NOVA</em></div><div>AN IMMERSIVE EXPERIENCE AT THE EDGE OF CODE & COSMOS</div><div>© 2026 · BUILT TO EXPLORE</div></footer>}
