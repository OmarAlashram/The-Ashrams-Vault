'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Passwordless sign-in: a one-time link is emailed to each family member.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main>
      <h1>The Ashrams Vault</h1>
      <form className="card" onSubmit={send}>
        {status === 'sent' ? (
          <p>Check your email for the sign-in link. You can close this page and open the link on this iPhone.</p>
        ) : (
          <>
            <label htmlFor="email" className="muted">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            {status === 'error' && <p className="error">{message}</p>}
          </>
        )}
      </form>
    </main>
  );
}
