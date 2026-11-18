'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '../../Avatar';
import type { Folder, Member } from '@/lib/types';

export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const [m, f] = await Promise.all([
      supabase.from('members').select('*').eq('id', id).single(),
      supabase.from('folders').select('*').eq('member_id', id).is('parent_id', null).order('name'),
    ]);
    if (m.error) setError(m.error.message);
    else setMember(m.data as Member);
    if (f.error) setError(f.error.message);
    else setFolders((f.data ?? []) as Folder[]);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changePhoto(file: File) {
    setBusy(true);
    setError('');
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // A new file name each time, so the photo refreshes on screen.
    const path = `avatars/${id}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('vault').upload(path, file, { contentType: file.type || undefined });
    if (up.error) {
      setError(up.error.message);
    } else {
      const upd = await supabase.from('members').update({ avatar_path: path }).eq('id', id);
      if (upd.error) setError(upd.error.message);
    }
    setBusy(false);
    load();
  }

  async function addFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const { error } = await createClient().from('folders').insert({ member_id: id, name: newName.trim() });
    if (error) setError(error.message);
    else {
      setNewName('');
      load();
    }
  }

  return (
    <main>
      <nav className="crumbs">
        <Link href="/vault">Family</Link>
      </nav>

      {member && (
        <div className="profile">
          <Avatar member={member} size={104} />
          <h1>{member.display_name}</h1>
          <label className="btn soft">
            {busy ? 'Saving photo…' : 'Change photo'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) changePhoto(f);
              }}
            />
          </label>
        </div>
      )}

      <h2 className="section-title">Folders</h2>
      <div className="list">
        {folders.map((f) => (
          <Link key={f.id} href={`/vault/f/${f.id}`} className="row">
            <span className="folder-ico">📁</span>
            <span className="grow">{f.name}</span>
            <span className="chev">›</span>
          </Link>
        ))}
        {folders.length === 0 && <p className="muted" style={{ padding: 16 }}>No folders yet.</p>}
      </div>

      <form className="card" onSubmit={addFolder}>
        <strong>New folder</strong>
        <div className="inline-form">
          <input placeholder="Folder name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button type="submit">Add</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
