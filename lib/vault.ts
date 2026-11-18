import { createClient } from '@/lib/supabase/client';

export async function signedUrl(path: string, seconds = 300): Promise<string> {
  const { data, error } = await createClient().storage.from('vault').createSignedUrl(path, seconds);
  if (error || !data) throw new Error(error?.message ?? 'Could not get the file');
  return data.signedUrl;
}

function safeName(title: string, path: string): string {
  const ext = path.includes('.') ? path.split('.').pop()!.toLowerCase() : '';
  let name = title.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document';
  if (ext && !name.toLowerCase().endsWith('.' + ext)) name += '.' + ext;
  return name;
}

// Opens the file in a new tab. The tab is opened straight away (inside the tap)
// so Safari does not block it as a pop-up.
export async function openDoc(path: string): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const url = await signedUrl(path);
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (e) {
    win?.close();
    throw e;
  }
}

async function fetchAsFile(title: string, path: string): Promise<File> {
  const url = await signedUrl(path);
  const blob = await (await fetch(url)).blob();
  return new File([blob], safeName(title, path), { type: blob.type || undefined });
}

// Saves the file to the device (Files app on iPhone, Downloads on a computer).
export async function downloadDoc(title: string, path: string): Promise<void> {
  const file = await fetchAsFile(title, path);
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Opens the native share sheet. Returns a message to show, or null if shared/cancelled.
export async function shareDoc(title: string, path: string): Promise<string | null> {
  const file = await fetchAsFile(title, path);
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare?.({ files: [file] })) {
    return 'Sharing is not supported on this device. Use Save instead.';
  }
  try {
    await navigator.share({ files: [file], title });
    return null;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return null;
    return e instanceof Error ? e.message : 'Could not share the file';
  }
}

export async function deleteDoc(id: string, path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from('vault').remove([path]);
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function expiryStatus(expires: string | null): { label: string; cls: string } | null {
  if (!expires) return null;
  const days = Math.round((new Date(expires).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Expired ${expires}`, cls: 'expired' };
  if (days <= 180) return { label: `Expires ${expires}`, cls: 'expiring' };
  return { label: `Expires ${expires}`, cls: '' };
}
