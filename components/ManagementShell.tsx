import Link from 'next/link';
import { Brand } from './SiteShell';
export function ManagementHeader({admin=false}:{admin?:boolean}){return <header className="topbar"><div className="shell topbar-inner management-header"><div className="management-brand"><Brand/><span className="badge">{admin?'Super admin':'Hotel manager'}</span></div><nav className="management-nav" aria-label={admin?'Super admin navigation':'Hotel manager navigation'}><Link href="/">{admin?'Platform control centre':'My property workspace'}</Link></nav></div></header>;}
export function ManagementFooter({admin=false}:{admin?:boolean}){return <footer className="foot"><div className="shell management-foot"><span>Vabbot Resorts | {admin?'Platform administration':'Hotel management'}</span></div></footer>;}
