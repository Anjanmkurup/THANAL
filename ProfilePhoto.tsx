import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useThanal } from './ThanalContext';

/**
 * Profile photo for the signed-in user (volunteers and VSs).
 * - Photo is resized to a 512px square JPEG in the browser before upload.
 * - Stored privately in the Supabase "avatars" bucket at <user-id>/avatar.jpg.
 * - Shown through a short-lived signed URL.
 * Needs the SQL in the setup step (bucket, policies, users.avatar_path, set_my_avatar).
 */

const BUCKET = 'avatars';
const MAX_INPUT_MB = 10;
const SIGNED_URL_SECONDS = 60 * 60;

type Notice = { kind: 'ok' | 'error'; text: string } | null;

async function toSquareJpeg(file: File, size = 512): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('unsupported-image'));
      el.src = objectUrl;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('unsupported-image');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('unsupported-image'))), 'image/jpeg', 0.85)
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const ProfilePhoto: React.FC<{ size?: number }> = ({ size = 112 }) => {
  const { currentUser } = useThanal();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const signedUrl = async (p: string) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p, SIGNED_URL_SECONDS);
    return data?.signedUrl ?? null;
  };

  // Load the current photo, if any.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      setUid(auth.user.id);
      const { data: row } = await supabase
        .from('users')
        .select('avatar_path')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      const p = (row as { avatar_path?: string | null } | null)?.avatar_path ?? null;
      if (!p || cancelled) return;
      const u = await signedUrl(p);
      if (!cancelled) {
        setPath(p);
        setUrl(u);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uid) return;

    if (!file.type.startsWith('image/')) {
      setNotice({ kind: 'error', text: 'Choose an image file (JPG, PNG or WebP).' });
      return;
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      setNotice({ kind: 'error', text: `That photo is larger than ${MAX_INPUT_MB} MB. Choose a smaller one.` });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const blob = await toSquareJpeg(file);
      const newPath = `${uid}/avatar.jpg`;
      const { error: upError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
      if (upError) throw upError;

      const { error: rpcError } = await supabase.rpc('set_my_avatar', { p_path: newPath });
      if (rpcError) throw rpcError;

      setPath(newPath);
      setUrl(await signedUrl(newPath));
      setNotice({ kind: 'ok', text: 'Photo saved.' });
    } catch (err: any) {
      const text =
        err?.message === 'unsupported-image'
          ? "This photo format isn't supported. Try a JPG or PNG."
          : `Couldn't save the photo: ${err?.message || 'unknown error'}`;
      setNotice({ kind: 'error', text });
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!path) return;
    setBusy(true);
    setNotice(null);
    try {
      const { error: rmError } = await supabase.storage.from(BUCKET).remove([path]);
      if (rmError) throw rmError;
      const { error: rpcError } = await supabase.rpc('set_my_avatar', { p_path: null });
      if (rpcError) throw rpcError;
      setPath(null);
      setUrl(null);
      setNotice({ kind: 'ok', text: 'Photo removed.' });
    } catch (err: any) {
      setNotice({ kind: 'error', text: `Couldn't remove the photo: ${err?.message || 'unknown error'}` });
    } finally {
      setBusy(false);
    }
  };

  const initial = (currentUser?.name || '?').trim().charAt(0).toUpperCase();

  const btn: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: 8,
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.6 : 1,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '3px solid #2f6b3f',
          background: '#e4efe2',
          color: '#1f4d2c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.42,
          fontWeight: 700,
        }}
      >
        {url ? (
          <img
            src={url}
            alt={`${currentUser?.name || 'Your'} profile photo`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy || !uid}
            style={{ ...btn, background: '#1f5130', color: '#fff', border: '1px solid #1f5130' }}
          >
            {busy ? 'Saving…' : url ? 'Change photo' : 'Add photo'}
          </button>
          {url && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              style={{ ...btn, background: 'transparent', color: '#1f5130', border: '1px solid #2f6b3f' }}
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={onPick}
          style={{ display: 'none' }}
          aria-label="Choose a profile photo"
        />
        <div aria-live="polite" style={{ fontSize: 13, minHeight: 18, color: notice?.kind === 'error' ? '#a12622' : '#2f6b3f' }}>
          {notice?.text}
        </div>
      </div>
    </div>
  );
};

export default ProfilePhoto;
