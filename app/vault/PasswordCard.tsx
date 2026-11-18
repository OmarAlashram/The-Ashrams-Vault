'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Lets a signed-in family member set or change their password,
// so later sign-ins don't need an emailed link.
export default function PasswordCard() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (password.length < 8) {
      setIsError(true);
      setMessage('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setIsError(true);
      setMessage('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setIsError(false);
      setMessage('Password saved. Use it next time you sign in.');
      setPassword('');
      setConfirm('');
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <strong>Set or change your password</strong>
      <input
        type="password"
        autoComplete="new-password"
        placeholder="New password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder="Type it again"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      {message && <p className={isError ? 'error' : 'muted'}>{message}</p>}
    </form>
  );
}
