import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Read-only profile photo for any user, by their Supabase user id.
 * Falls back to the first letter of their name when there is no photo.
 * Use it anywhere a list or card shows a volunteer, e.g.
 *   <Avatar userId={vol.id} name={vol.name} size={40} />
 */

const BUCKET = 'avatars';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TTL_MS = 50 * 60 * 1000; // signed URLs last 60 min; refresh a bit earlier

const cache = new Map<string, { at: number; url: Promise<string | null> }>();

function getPhotoUrl(userId: string): Promise<string | null> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.url;
  const url = supabase.storage
    .from(BUCKET)
    .createSignedUrl(`${userId}/avatar.jpg`, 60 * 60)
    .then(({ data, error }) => (error ? null : data?.signedUrl ?? null))
    .catch(() => null);
  cache.set(userId, { at: Date.now(), url });
  return url;
}

/** Call after a user changes their own photo so lists refetch it. */
export function clearAvatarCache(userId?: string) {
  if (userId) cache.delete(userId);
  else cache.clear();
}

const Avatar: React.FC<{ userId: string; name: string; size?: number }> = ({ userId, name, size = 40 }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (UUID.test(userId)) {
      getPhotoUrl(userId).then((u) => {
        if (!cancelled) setUrl(u);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        border: '2px solid #2f6b3f',
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
          alt={`${name} profile photo`}
          onError={() => setUrl(null)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span aria-hidden="true">{(name || '?').trim().charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};

export default Avatar;
