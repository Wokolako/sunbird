import { redirect } from 'next/navigation';
import { GuestBookings } from '@/components/GuestBookings';
import { currentUser } from '@/lib/platform';
export const metadata={title:'My stays | Vabbot Resorts'};
export default async function Page(){const user=await currentUser();if(!user)redirect('/account?next=/bookings');return <GuestBookings/>;}
