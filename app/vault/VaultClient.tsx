'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Doc = {
  id: string;
  owner_member: string;
  category: string;
  title: string;
  file_path: string;
  expires_on: string | null;
};

const MEMBERS = ['Omar', 'Leen', 'Yasmine', 'Talal', 'Jumana', 'Alayman', 'Dima', 'Haneen', 'Household'];

function expiryBadge(expires: string | null) {
  if (!expires) return null;
  const days = Math.round((new Date(expires).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="badge expired">Expired {expires}</span>;
  if (days <= 180) return <span className="badge expiring">Expires {expires}</span>;
  return <span className="badge">Expires {expires}</span>;
}

export default function VaultClient() {
  const supabase = createClient();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Upload form state
  const [member, setMember] = useState(MEMBERS[0]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [expires, setExpires] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    let q = supabase
      .from('documents')
      .select('id, owner_member, category, title, file_path, expires_on')
      .order('owner_member')
      .order('category');
    if (query.trim()) q = q.ilike('title', `%${query.trim()}%`);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setDocs((data ?? []) as Doc[]);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${member}/${category.replace(/\s+/g, '_')}/${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage.from('vault').upload(path, file, {
      contentType: file.type || undefined,
    });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    const { error: dbErr } = await supabase.from('documents').insert({
      owner_member: member,
      category,
      title: title || safeName,
      file_path: path,
      mime_type: file.type || null,
      expires_on: expires || null,
    });
    if (dbErr) setError(dbErr.message);

    setCategory('');
    setTitle('');
    setExpires('');
    setFile(null);
    setBusy(false);
    load();
  }

  async function open(doc: Doc) {
    // Open a blank tab immediately (inside the tap), so Safari does not block it.
    const win = window.open('', '_blank');
    const { data, error } = await supabase.storage.from('vault').createSignedUrl(doc.file_path, 300);
    if (error || !data) {
      win?.close();
      setError(error?.message ?? 'Could not open file');
    } else if (win) {
      win.location.href = data.signedUrl;
    } else {
      window.location.href = data.signedUrl;
    }
  }

  async function fetchFile(doc: Doc): Promise<File | null> {
    const { data, error } = await supabase.storage.from('vault').createSignedUrl(doc.file_path, 300);
    if (error || !data) {
      setError(error?.message ?? 'Could not get file');
      return null;
    }
    const res = await fetch(data.signedUrl);
    const blob = await res.blob();
    const name = doc.title.replace(/[\\/:*?"<>|]+/g, '_');
    const ext = doc.file_path.includes('.') ? doc.file_path.split('.').pop() : '';
    const fileName = ext && !name.toLowerCase().endsWith(`.${ext.toLowerCase()}`) ? `${name}.${ext}` : name;
    return new File([blob], fileName, { type: blob.type || undefined });
  }

  async function download(doc: Doc) {
    const file = await fetchFile(doc);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function share(doc: Doc) {
    const file = await fetchFile(doc);
    if (!file) return;
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] });
    if (!canShareFiles) {
      setError('Sharing is not supported on this device. Use Download instead.');
      return;
    }
    try {
      await navigator.share({ files: [file], title: doc.title });
    } catch (e) {
      // User cancelled the share sheet: nothing to do.
      if (e instanceof Error && e.name !== 'AbortError') setError(e.message);
    }
  }

  return (
    <>
      <input
        type="search"
        placeholder="Search by title"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <div className="card">
        {docs.length === 0 && <p className="muted">No documents yet.</p>}
        {docs.map((d) => (
          <div key={d.id} className="doc" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div><strong>{d.title}</strong></div>
              <small>{d.owner_member} · {d.category}</small>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {expiryBadge(d.expires_on)}
              <button onClick={() => open(d)}>Open</button>
              <button onClick={() => download(d)} style={{ background: '#4a6b8a' }}>Download</button>
              <button onClick={() => share(d)} style={{ background: '#2e7d5b' }}>Share</button>
            </div>
          </div>
        ))}
      </div>

      <form className="card" onSubmit={upload}>
        <strong>Add a document</strong>
        <select value={member} onChange={(e) => setMember(e.target.value)}>
          {MEMBERS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input placeholder="Category (e.g. Passport, Saudi ID)" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="muted">Expiry date (passports only)</label>
        <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        <button type="submit" disabled={busy || !file || !category}>{busy ? 'Uploading…' : 'Upload'}</button>
      </form>
    </>
  );
}
