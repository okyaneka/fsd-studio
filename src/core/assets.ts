import { getDatabase, putRecord } from './database';
import { STORES } from './constants';
import { createId } from './schema';
import type { AssetRecord } from './types';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Format file "${file.type}" tidak didukung. Harap gunakan PNG, JPEG, atau WebP.`,
    };
  }
  if (file.size > MAX_ASSET_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran file (${sizeMb} MB) melebihi batas maksimal 5 MB.`,
    };
  }
  return { valid: true };
}

export async function saveScreenWireframeAsset({
  projectId,
  fsdId,
  moduleId,
  screenId,
  file,
}: {
  projectId: string;
  fsdId: string;
  moduleId: string;
  screenId: string;
  file: File;
}): Promise<AssetRecord> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File tidak valid.');
  }

  const asset: AssetRecord = {
    id: createId('asset'),
    projectId,
    fsdId,
    moduleId,
    screenId,
    name: file.name,
    mimeType: file.type as AssetRecord['mimeType'],
    size: file.size,
    blob: file,
    createdAt: new Date().toISOString(),
  };

  await putRecord(STORES.assets, asset);
  return asset;
}

export async function getAssetById(id: string): Promise<AssetRecord | undefined> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.assets, 'readonly');
    const req = tx.objectStore(STORES.assets).get(id);
    req.onsuccess = () => resolve(req.result as AssetRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAssetById(id: string): Promise<void> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.assets, 'readwrite');
    const req = tx.objectStore(STORES.assets).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

