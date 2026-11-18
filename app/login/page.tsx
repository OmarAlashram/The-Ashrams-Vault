'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Sign in with email and password (default). An emailed link is available as a fallback.
export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus('busy');
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      window.location.href = '/vault';
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('busy');
    setMessage('');
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

      {status === 'sent' ? (
        <div className="card">
          <p>Check your email for the sign-in link. You can open it on this phone.</p>
        </div>
      ) : mode === 'password' ? (
        <form className="card" onSubmit={signInWithPassword}>
          <label htmlFor="email" className="muted">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password" className="muted">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={status === 'busy'}>
            {status === 'busy' ? 'Signing in…' : 'Sign in'}
          </button>
          {status === 'error' && <p className="error">{message}</p>}
          <p className="muted" style={{ marginTop: 12 }}>
            First time, or forgot your password?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('link'); setStatus('idle'); }}>
              Email me a sign-in link
            </a>
          </p>
        </form>
      ) : (
        <form className="card" onSubmit={sendLink}>
          <label htmlFor="email" className="muted">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={status === 'busy'}>
            {status === 'busy' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          {status === 'error' && <p className="error">{message}</p>}
          <p className="muted" style={{ marginTop: 12 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('password'); setStatus('idle'); }}>
              Back to password sign-in
            </a>
          </p>
        </form>
      )}
    </main>
  );
}
