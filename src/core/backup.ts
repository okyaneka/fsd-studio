import { getWorkspaceRecords, replaceWorkspaceRecords } from './database';
import { createBackupPayload, validateBackupPayload } from './schema';
import type { AssetRecord, BackupAsset, BackupPayload } from './types';

export async function createWorkspaceBackup(): Promise<BackupPayload> {
  const workspace = await getWorkspaceRecords();
  const assets = await Promise.all(workspace.assets.map(serializeAsset));
  return createBackupPayload({ projects: workspace.projects, fsdDocuments: workspace.fsdDocuments, assets });
}

export async function restoreWorkspaceBackup(payload: unknown): Promise<void> {
  validateBackupPayload(payload);
  const assets = await Promise.all(payload.assets.map(deserializeAsset));
  await replaceWorkspaceRecords({ projects: payload.projects, fsdDocuments: payload.fsdDocuments, assets });
}

export function stringifyBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }
}

async function serializeAsset(asset: AssetRecord): Promise<BackupAsset> {
  const { blob, ...metadata } = asset;
  return { ...metadata, dataUrl: await blobToDataUrl(blob) };
}

async function deserializeAsset(asset: BackupAsset): Promise<AssetRecord> {
  const { dataUrl, ...metadata } = asset;
  return { ...metadata, blob: dataUrlToBlob(dataUrl) };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image asset.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',');
  const mime = header?.match(/data:(.*?);base64/)?.[1];
  if (!mime || !encoded) throw new Error('Backup contains an invalid asset data URL.');
  const bytes = atob(encoded);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) buffer[index] = bytes.charCodeAt(index);
  return new Blob([buffer], { type: mime });
}
