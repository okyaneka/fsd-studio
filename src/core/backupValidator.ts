import { BACKUP_FORMAT, BACKUP_VERSION, MODULE_SECTIONS } from './constants';
import type { BackupPayload, BackupAsset, Project, FsdDocument, FsdModule } from './types';
import { isDocumentStatus, createStarterWorkspace, createBackupPayload } from './schema';

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    projectCount: number;
    fsdCount: number;
    moduleCount: number;
    assetCount: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates a backup JSON payload thoroughly and returns a human-friendly report.
 */
export function validateBackupDetailed(payload: unknown): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const summary = {
    projectCount: 0,
    fsdCount: 0,
    moduleCount: 0,
    assetCount: 0,
  };

  if (!isRecord(payload)) {
    return {
      isValid: false,
      errors: ['Format file bukan merupakan objek JSON yang valid.'],
      warnings: [],
      summary,
    };
  }

  // 1. Format & Version Check
  if (payload.format !== BACKUP_FORMAT) {
    errors.push(
      `Format backup "${payload.format || 'tidak diketahui'}" tidak didukung. Format yang diharapkan adalah "${BACKUP_FORMAT}".`
    );
  }

  if (payload.version !== BACKUP_VERSION) {
    errors.push(
      `Versi skema "${payload.version || 'tidak diketahui'}" tidak kompatibel. Versi yang didukung saat ini adalah "${BACKUP_VERSION}".`
    );
  }

  // 2. Collection Existence Checks
  if (!Array.isArray(payload.projects)) {
    errors.push('Koleksi "projects" harus berupa array data.');
  }
  if (!Array.isArray(payload.fsdDocuments)) {
    errors.push('Koleksi "fsdDocuments" harus berupa array data.');
  }
  if (!Array.isArray(payload.assets)) {
    errors.push('Koleksi "assets" harus berupa array data.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, summary };
  }

  const rawProjects = payload.projects as unknown[];
  const rawDocuments = payload.fsdDocuments as unknown[];
  const rawAssets = payload.assets as unknown[];

  summary.projectCount = rawProjects.length;
  summary.fsdCount = rawDocuments.length;
  summary.assetCount = rawAssets.length;

  if (rawProjects.length === 0) {
    warnings.push('File backup tidak memiliki project sama sekali (kosong).');
  }

  // 3. Project Validation & ID indexing
  const projectIds = new Set<string>();
  rawProjects.forEach((proj, idx) => {
    if (!isRecord(proj)) {
      errors.push(`Project pada indeks #${idx} bukan objek valid.`);
      return;
    }
    if (!nonEmpty(proj.id)) {
      errors.push(`Project #${idx} tidak memiliki atribut "id" yang valid.`);
    } else if (projectIds.has(proj.id)) {
      errors.push(`Ditemukan duplikasi Project ID: "${proj.id}".`);
    } else {
      projectIds.add(proj.id);
    }

    if (!nonEmpty(proj.name)) {
      errors.push(`Project "${proj.id || `#${idx}`}" tidak memiliki nama (name).`);
    }
  });

  // 4. Document Validation & ID indexing
  const documentIds = new Set<string>();
  const moduleIds = new Set<string>();
  const screenIds = new Set<string>();

  rawDocuments.forEach((doc, idx) => {
    if (!isRecord(doc)) {
      errors.push(`Dokumen FSD pada indeks #${idx} bukan objek valid.`);
      return;
    }
    const docId = doc.id;
    if (!nonEmpty(docId)) {
      errors.push(`Dokumen FSD #${idx} tidak memiliki atribut "id" yang valid.`);
    } else if (documentIds.has(docId)) {
      errors.push(`Ditemukan duplikasi Document ID: "${docId}".`);
    } else {
      documentIds.add(docId);
    }

    const projId = doc.projectId;
    if (!nonEmpty(projId) || !projectIds.has(projId)) {
      errors.push(
        `Dokumen FSD "${docId || `#${idx}`}" merujuk ke Project ID "${projId}" yang tidak terdaftar dalam file backup.`
      );
    }

    if (!isRecord(doc.metadata) || !nonEmpty(doc.metadata.title)) {
      errors.push(`Dokumen FSD "${docId || `#${idx}`}" memiliki metadata title yang tidak valid.`);
    } else if (doc.metadata.status && !isDocumentStatus(doc.metadata.status)) {
      warnings.push(
        `Dokumen FSD "${doc.metadata.title}" memiliki status tidak standar: "${doc.metadata.status}".`
      );
    }

    // Check modules
    if (!Array.isArray(doc.modules)) {
      errors.push(`Dokumen FSD "${docId || `#${idx}`}" tidak memiliki array "modules".`);
      return;
    }

    summary.moduleCount += doc.modules.length;

    doc.modules.forEach((mod: unknown, mIdx: number) => {
      if (!isRecord(mod)) {
        errors.push(`Modul #${mIdx} dalam Dokumen "${docId}" bukan objek valid.`);
        return;
      }

      const modId = mod.id;
      if (!nonEmpty(modId)) {
        errors.push(`Modul #${mIdx} dalam Dokumen "${docId}" tidak memiliki ID.`);
      } else if (moduleIds.has(modId)) {
        errors.push(`Ditemukan duplikasi Module ID: "${modId}".`);
      } else {
        moduleIds.add(modId);
      }

      if (!nonEmpty(mod.name)) {
        errors.push(`Modul "${modId || `#${mIdx}`}" tidak memiliki nama modul.`);
      }

      // Check 9 mandatory sections existence
      for (const section of MODULE_SECTIONS) {
        if (!Array.isArray(mod[section])) {
          errors.push(
            `Modul "${mod.name || modId}" tidak memiliki subbagian wajib "${section}" (harus berupa array).`
          );
        }
      }

      // Check screens
      if (Array.isArray(mod.screens)) {
        mod.screens.forEach((scr: unknown, sIdx: number) => {
          if (!isRecord(scr) || !nonEmpty(scr.id)) {
            errors.push(`Screen #${sIdx} pada modul "${mod.name || modId}" tidak memiliki ID valid.`);
          } else if (screenIds.has(scr.id)) {
            errors.push(`Ditemukan duplikasi Screen ID: "${scr.id}".`);
          } else {
            screenIds.add(scr.id);
          }
        });
      }
    });
  });

  // 5. Asset Validation & Parent Relation Checks
  rawAssets.forEach((asset, idx) => {
    if (!isRecord(asset)) {
      errors.push(`Aset pada indeks #${idx} bukan objek valid.`);
      return;
    }

    const assetId = asset.id;
    if (!nonEmpty(assetId)) {
      errors.push(`Aset #${idx} tidak memiliki ID.`);
      return;
    }

    const pId = asset.projectId;
    const fId = asset.fsdId;
    const mId = asset.moduleId;
    const sId = asset.screenId;

    if (!nonEmpty(pId) || !projectIds.has(pId)) {
      errors.push(`Aset "${assetId}" terikat pada Project ID "${pId}" yang tidak ditemukan.`);
    }
    if (!nonEmpty(fId) || !documentIds.has(fId)) {
      errors.push(`Aset "${assetId}" terikat pada FSD ID "${fId}" yang tidak ditemukan.`);
    }
    if (!nonEmpty(mId) || !moduleIds.has(mId)) {
      errors.push(`Aset "${assetId}" terikat pada Module ID "${mId}" yang tidak ditemukan.`);
    }
    if (!nonEmpty(sId) || !screenIds.has(sId)) {
      errors.push(`Aset "${assetId}" terikat pada Screen ID "${sId}" yang tidak ditemukan.`);
    }

    const dataUrl = asset.dataUrl;
    if (!nonEmpty(dataUrl) || !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
      errors.push(`Aset "${assetId}" (${asset.name || 'tanpa nama'}) memiliki format data gambar Base64 yang tidak valid.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

/**
 * Creates a valid, comprehensive starter backup template for users to explore or use as schema reference.
 */
export function createBackupTemplate(): BackupPayload {
  const { project, fsd } = createStarterWorkspace({
    name: 'Contoh Proyek Template FSD',
    code: 'TMPL',
    description: 'Template resmi untuk skema backup FSD Studio.',
    clientName: 'Contoh Klien',
  });
  return createBackupPayload({
    projects: [project],
    fsdDocuments: [fsd],
    assets: [],
  });
}
