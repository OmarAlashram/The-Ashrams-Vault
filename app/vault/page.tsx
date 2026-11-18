'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from './Avatar';
import DocRow from './DocRow';
import type { Doc, Member } from '@/lib/types';

type Hit = Doc & { folders: { name: string; member_id: string } | null };

export default function VaultHome() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    createClient()
      .from('members')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setMembers((data ?? []) as Member[]);
      });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    createClient()
      .from('documents')
      .select('*, folders(name, member_id)')
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setHits((data ?? []) as Hit[]);
      });
  }, [query, tick]);

  const groups = useMemo(() => {
    const map = new Map<string, Member[]>();
    members.forEach((m) => map.set(m.group_name, [...(map.get(m.group_name) ?? []), m]));
    return Array.from(map.entries());
  }, [members]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.display_name ?? '';

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Family documents</p>
          <h1>The Ashrams Vault</h1>
        </div>
        <Link className="pill" href="/vault/account">Account</Link>
      </header>

      <input
        className="search"
        type="search"
        placeholder="Search all documents"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.trim() ? (
        <section>
          <h2 className="section-title">Results</h2>
          {hits.length === 0 && <p className="muted">No documents match.</p>}
          {hits.map((h) => (
            <div key={h.id} className="hit">
              {h.folder_id && h.folders && (
                <Link className="hit-where" href={`/vault/f/${h.folder_id}`}>
                  {memberName(h.folders.member_id)} › {h.folders.name}
                </Link>
              )}
              <div className="list">
                <DocRow doc={h} onChanged={() => setTick((t) => t + 1)} onError={setError} />
              </div>
            </div>
          ))}
        </section>
      ) : (
        groups.map(([group, list]) => (
          <section key={group}>
            <h2 className="section-title">{group}</h2>
            <div className="member-grid">
              {list.map((m) => (
                <Link key={m.id} href={`/vault/m/${m.id}`} className="member-card">
                  <Avatar member={m} size={72} />
                  <span>{m.display_name}</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
