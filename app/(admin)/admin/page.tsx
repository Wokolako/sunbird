import { ManagementFooter, ManagementHeader } from '@/components/ManagementShell';
import { AdminApp } from '@/components/AdminApp';
export const metadata={title:'Super Admin | Vabbot Resorts'};
export default function Page(){return <><ManagementHeader admin/><main className="shell"><div className="page-head"><h1>Your platform, under control.</h1><p className="lead">Oversee managers, guests, listings and stay requests. Review applications and control platform access.</p></div><AdminApp/></main><ManagementFooter admin/></>;}
