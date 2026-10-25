import { ManagementFooter, ManagementHeader } from '@/components/ManagementShell';
import { ManagerApp } from '@/components/ManagerApp';
export const metadata={title:'Hotel Manager | Vabbot Resorts'};
export default function Page(){return <><ManagementHeader/><main className="shell"><div className="page-head"><h1>Your hotels. Your guests.</h1><p className="lead">Post and manage your own listings, set room prices, and handle your guests from one workspace.</p></div><ManagerApp/></main><ManagementFooter/></>;}
