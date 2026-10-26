import { ChangeEvent, useState } from 'react';
import { Modal } from './Modal';
import { DownloadIcon, ExclamationTriangleIcon, UploadIcon, DocumentIcon } from './Icons';
import { downloadBackupFile, restoreWorkspaceBackup } from '../core/backup';
import { validateBackupDetailed, createBackupTemplate } from '../core/backupValidator';
import type { BackupPayload } from '../core/types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export function BackupModal({ isOpen, onClose, onRestored }: BackupModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadBackupFile();
    } catch (err) {
      alert(`Gagal mengekspor backup: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = createBackupTemplate();
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'fsd-studio-template.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidationErrors([]);
    setValidationWarnings([]);
    setImportSuccess(null);

    const confirmed = window.confirm(
      'PERINGATAN: Memulihkan backup akan menggantikan semua project, dokumen FSD, dan aset yang ada di browser saat ini. Apakah Anda yakin ingin melanjutkan?'
    );
    if (!confirmed) {
      event.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      let rawPayload: unknown;
      try {
        rawPayload = JSON.parse(text);
      } catch {
        setValidationErrors(['File yang diunggah bukan format JSON yang valid.']);
        return;
      }

      // Detailed Schema Validation
      const report = validateBackupDetailed(rawPayload);
      if (!report.isValid) {
        setValidationErrors(report.errors);
        setValidationWarnings(report.warnings);
        return;
      }

      if (report.warnings.length > 0) {
        setValidationWarnings(report.warnings);
      }

      await restoreWorkspaceBackup(rawPayload as BackupPayload);
      setImportSuccess(
        `Data backup berhasil dipulihkan! (${report.summary.projectCount} project, ${report.summary.fsdCount} dokumen, ${report.summary.moduleCount} modul, ${report.summary.assetCount} aset)`
      );
      setTimeout(() => {
        onRestored();
        onClose();
      }, 1500);
    } catch (err) {
      setValidationErrors([err instanceof Error ? err.message : 'File backup tidak valid atau gagal dipulihkan.']);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backup & Restore Workspace"
      description="Data disimpan secara lokal di browser Anda. Ekspor secara berkala untuk mencadangkan data."
    >
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Penting: Data Tersimpan di Browser</p>
            <p className="text-amber-800 leading-relaxed">
              FSD Studio menggunakan IndexedDB lokal. Menghapus cache browser dapat menghapus data Anda. Selalu unduh backup setelah membuat perubahan penting.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ekspor Backup */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Ekspor Backup</h4>
              <p className="text-xs text-slate-500 mt-0.5">Unduh seluruh project, dokumen, dan gambar ke format file JSON.</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <DownloadIcon className="w-4 h-4" />
              {isExporting ? 'Mengekspor...' : 'Unduh JSON'}
            </button>
          </div>

          {/* Pulihkan Backup */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Pulihkan Backup (Restore)</h4>
              <p className="text-xs text-slate-500 mt-0.5">Unggah file backup `.json` untuk memulihkan seluruh data workspace.</p>
            </div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer">
              <UploadIcon className="w-4 h-4 text-slate-600" />
              {isImporting ? 'Memulihkan...' : 'Pilih File'}
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>

          {/* Unduh Template Backup */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Template Skema Backup</h4>
              <p className="text-xs text-slate-500 mt-0.5">Unduh contoh template JSON yang valid dengan struktur 9 subbagian modul lengkap.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <DocumentIcon className="w-4 h-4 text-slate-600" />
              Unduh Template
            </button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-red-800">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
              Validasi Skema Gagal ({validationErrors.length} kesalahan ditemukan):
            </div>
            <ul className="list-disc list-inside space-y-1 text-red-700 pl-1">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="leading-relaxed">{err}</li>
              ))}
            </ul>
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <p className="font-semibold text-amber-800">Catatan / Peringatan:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700 pl-1">
              {validationWarnings.map((warn, idx) => (
                <li key={idx} className="leading-relaxed">{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {importSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <p className="font-semibold">{importSuccess}</p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
