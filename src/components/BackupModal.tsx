import { ChangeEvent, useState } from 'react';
import { Modal } from './Modal';
import { DownloadIcon, ExclamationTriangleIcon, UploadIcon } from './Icons';
import { createWorkspaceBackup, parseBackup, restoreWorkspaceBackup, stringifyBackup } from '../core/backup';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export function BackupModal({ isOpen, onClose, onRestored }: BackupModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const backup = await createWorkspaceBackup();
      const json = stringifyBackup(backup);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `fsd-studio-backup-${dateStr}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Gagal mengekspor backup: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
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
      const payload = parseBackup(text);
      await restoreWorkspaceBackup(payload);
      setImportSuccess('Data backup berhasil dipulihkan!');
      setTimeout(() => {
        onRestored();
        onClose();
      }, 1000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'File backup tidak valid atau rusak.');
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
        </div>

        {importError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
            <p className="font-semibold">Gagal Memulihkan Backup:</p>
            <p className="mt-0.5">{importError}</p>
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
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

