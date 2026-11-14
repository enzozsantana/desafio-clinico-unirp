import { sb } from '../../lib/supabase';

export function fileToJpegBlob(
  file: File,
  maxSide = 512,
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const obj = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(obj);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Falha ao processar imagem'));
        return;
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Falha ao processar imagem'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(obj);
      reject(new Error('Imagem inválida'));
    };
    img.src = obj;
  });
}

async function saveAvatarUrl(userId: string, url: string | null): Promise<void> {
  const { error } = await sb.from('professores').update({ avatar_url: url }).eq('id', userId);
  if (error) throw error;
  try {
    await sb.auth.updateUser({ data: { avatar_url: url } });
  } catch {
    /* ignore */
  }
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha uma imagem');
  if (file.size > 8 * 1024 * 1024) throw new Error('Imagem muito grande (máx. 8 MB)');
  const blob = await fileToJpegBlob(file);
  const path = `${userId}/avatar.jpg`;
  const { error: upErr } = await sb.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (upErr) throw upErr;
  const { data } = sb.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  await saveAvatarUrl(userId, url);
  return url;
}

export async function removeAvatar(userId: string): Promise<void> {
  await sb.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
  await saveAvatarUrl(userId, null);
}