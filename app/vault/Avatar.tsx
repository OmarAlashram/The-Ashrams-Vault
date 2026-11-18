'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Member } from '@/lib/types';

const COLORS = ['#1f4e78', '#2e7d5b', '#7a3e9d', '#b5651d', '#2c7a8c', '#8a3b3b', '#4f6d2a', '#4b56a8'];

// Shows the member's photo if they have one, otherwise coloured initials.
export default function Avatar({ member, size = 56 }: { member: Pick<Member, 'display_name' | 'avatar_path'>; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!member.avatar_path) {
      setUrl(null);
      return;
    }
    createClient()
      .storage.from('vault')
      .createSignedUrl(member.avatar_path, 3600)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [member.avatar_path]);

  const style = { width: size, height: size, borderRadius: '50%', flexShrink: 0 } as const;

  if (url) {
    return <img src={url} alt={member.display_name} style={{ ...style, objectFit: 'cover' }} />;
  }

  const initials = member.display_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const color = COLORS[member.display_name.length % COLORS.length];

  return (
    <div
      style={{
        ...style,
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
