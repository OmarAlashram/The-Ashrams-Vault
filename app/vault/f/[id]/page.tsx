'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DocRow from '../../DocRow';
import type { Doc, Folder, Member } from '@/lib/types';

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [parent, setParent] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [newFolder, setNewFolder] = useState('');
  const [title, setTitle] = useState('');
  const [expires, setExpires] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const f = await supabase.from('folders').select('*').eq('id', id).single();
    if (f.error || !f.data) {
      setError(f.error?.message ?? 'Folder not found');
      return;
    }
    const fo = f.data as Folder;
    setFolder(fo);
    const [m, sub, d] = await Promise.all([
      supabase.from('members').select('*').eq('id', fo.member_id).single(),
      supabase.from('folders').select('*').eq('parent_id', fo.id).order('name'),
      supabase.from('documents').select('*').eq('folder_id', fo.id).order('created_at', { ascending: false }),
    ]);
    if (m.data) setMember(m.data as Member);
    setSubfolders((sub.data ?? []) as Folder[]);
    setDocs((d.data ?? []) as Doc[]);
    if (fo.parent_id) {
      const p = await supabase.from('folders').select('*').eq('id', fo.parent_id).single();
      setParent((p.data ?? null) as Folder | null);
    } else {
      setParent(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !folder) return;
    setBusy(true);
    setError('');
    const supabase = createClient();
    const safe = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${folder.member_id}/${folder.id}/${Date.now()}_${safe}`;
    const up = await supabase.storage.from('vault').upload(path, file, { contentType: file.type || undefined });
    if (up.error) {
      setError(up.error.message);
    } else {
      const ins = await supabase.from('documents').insert({
        folder_id: folder.id,
        title: title.trim() || safe,
        file_path: path,
        mime_type: file.type || null,
        expires_on: expires || null,
      });
      if (ins.error) setError(ins.error.message);
    }
    setTitle('');
    setExpires('');
    setFile(null);
    setFileKey((k) => k + 1);
    setBusy(false);
    load();
  }

  async function addSubfolder(e: React.FormEvent) {
    e.preventDefault();
    if (!folder || !newFolder.trim()) return;
    const { error } = await createClient()
      .from('folders')
      .insert({ member_id: folder.member_id, parent_id: folder.id, name: newFolder.trim() });
    if (error) setError(error.message);
    else {
      setNewFolder('');
      load();
    }
  }

  return (
    <main>
      <nav className="crumbs">
        <Link href="/vault">Family</Link>
        {member && (
          <>
            <span>›</span>
            <Link href={`/vault/m/${member.id}`}>{member.display_name}</Link>
          </>
        )}
        {parent && (
          <>
            <span>›</span>
            <Link href={`/vault/f/${parent.id}`}>{parent.name}</Link>
          </>
        )}
      </nav>

      <h1>{folder?.name ?? '…'}</h1>

      {subfolders.length > 0 && (
        <>
          <h2 className="section-title">Subfolders</h2>
          <div className="list">
            {subfolders.map((s) => (
              <Link key={s.id} href={`/vault/f/${s.id}`} className="row">
                <span className="folder-ico">📁</span>
                <span className="grow">{s.name}</span>
                <span className="chev">›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Documents</h2>
      <div className="list">
        {docs.map((d) => (
          <DocRow key={d.id} doc={d} onChanged={load} onError={setError} />
        ))}
      </div>
      {docs.length === 0 && <p className="muted">No documents in this folder yet.</p>}

      <form className="card" onSubmit={upload}>
        <strong>Add a document</strong>
        <input placeholder="Title (for example: Saudi ID - Omar)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="muted">Expiry date (passports only)</label>
        <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        <input
          key={fileKey}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</button>
      </form>

      <form className="card" onSubmit={addSubfolder}>
        <strong>New subfolder</strong>
        <div className="inline-form">
          <input placeholder="Subfolder name" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} />
          <button type="submit">Add</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
