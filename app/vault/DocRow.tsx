'use client';

import { useState } from 'react';
import { deleteDoc, downloadDoc, expiryStatus, openDoc, shareDoc } from '@/lib/vault';
import type { Doc } from '@/lib/types';

export default function DocRow({
  doc,
  onChanged,
  onError,
}: {
  doc: Doc;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const exp = expiryStatus(doc.expires_on);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong');
    }
    setBusy(false);
  }

  return (
    <div className="doc-row">
      <div className="doc-icon">📄</div>
      <div className="grow">
        <div className="doc-title">{doc.title}</div>
        {exp && <span className={`badge ${exp.cls}`}>{exp.label}</span>}
      </div>
      <div className="doc-actions">
        <button disabled={busy} onClick={() => run(() => openDoc(doc.file_path))}>Open</button>
        <button className="soft" disabled={busy} onClick={() => run(() => downloadDoc(doc.title, doc.file_path))}>
          Save
        </button>
        <button
          className="soft"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const msg = await shareDoc(doc.title, doc.file_path);
              if (msg) onError(msg);
            })
          }
        >
          Share
        </button>
        <button
          className="danger"
          disabled={busy}
          onClick={() => {
            if (confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
              run(async () => {
                await deleteDoc(doc.id, doc.file_path);
                onChanged();
              });
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
