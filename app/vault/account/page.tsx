'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PasswordCard from '../PasswordCard';

export default function AccountPage() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  return (
    <main>
      <nav className="crumbs">
        <Link href="/vault">Family</Link>
      </nav>
      <h1>Account</h1>
      <PasswordCard />
      <button className="danger wide" onClick={signOut}>Sign out</button>
    </main>
  );
}
