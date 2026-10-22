import { redirect } from 'next/navigation';
import { Marketplace } from '@/components/Marketplace';
import { currentUser } from '@/lib/platform';
export const metadata={title:'Saved stays | Vabbot Resorts'};
export default async function Page(){if(!await currentUser())redirect('/account?next=/saved');return <Marketplace savedPage/>;}
