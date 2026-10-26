import { useState } from 'react';
import type { Project, FsdDocument, DocumentStatus } from '../core/types';
import { createFsdDocument, normalizeIdPrefix } from '../core/schema';
import { putRecord, deleteFsdDocumentAndRelatedRecords } from '../core/database';
import { STORES, DOCUMENT_STATUSES } from '../core/constants';
import { Modal } from '../components/Modal';
import { ArrowLeftIcon, PlusIcon, DocumentIcon, EditIcon, TrashIcon, ChevronRightIcon, ExclamationTriangleIcon, LayersIcon, DownloadIcon } from '../components/Icons';
import { downloadBackupFile } from '../core/backup';

interface ProjectDetailViewProps {
  project: Project;
  fsdDocuments: FsdDocument[];
  onBackToDashboard: () => void;
  onOpenFsd: (fsdId: string) => void;
  onRefresh: () => Promise<void>;
}

export function ProjectDetailView({
  project,
  fsdDocuments,
  onBackToDashboard,
  onOpenFsd,
  onRefresh,
}: ProjectDetailViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFsd, setEditingFsd] = useState<FsdDocument | null>(null);
  const [deletingFsd, setDeletingFsd] = useState<FsdDocument | null>(null);

  // Create FSD state
  const [createTitle, setCreateTitle] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createIdPrefix, setCreateIdPrefix] = useState('');
  const [createAuthor, setCreateAuthor] = useState('');
  const [createTargetRelease, setCreateTargetRelease] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit FSD state
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editStatus, setEditStatus] = useState<DocumentStatus>('Draft');
  const [editAuthor, setEditAuthor] = useState('');
  const [editTargetRelease, setEditTargetRelease] = useState('');

  const handleOpenCreateModal = () => {
    const nextSeq = fsdDocuments.length + 1;
    const defaultCode = project.code ? `FSD-${project.code}-${String(nextSeq).padStart(3, '0')}` : `FSD-${String(nextSeq).padStart(3, '0')}`;
    setCreateTitle('');
    setCreateCode(defaultCode);
    setCreateIdPrefix('');
    setCreateAuthor('');
    setCreateTargetRelease('');
    setIsCreateModalOpen(true);
  };

  const handleCreateFsd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const newFsd = createFsdDocument({
        projectId: project.id,
        title: createTitle.trim(),
        code: createCode.trim() || `FSD-${String(fsdDocuments.length + 1).padStart(3, '0')}`,
        idPrefix: normalizeIdPrefix(createIdPrefix),
        withAuthenticationStarter: false, // Second and subsequent FSDs start empty as per workflow spec
      });

      if (createAuthor.trim()) newFsd.metadata.author = createAuthor.trim();
      if (createTargetRelease.trim()) newFsd.metadata.targetRelease = createTargetRelease.trim();

      await putRecord(STORES.fsdDocuments, newFsd);
      await onRefresh();
      setIsCreateModalOpen(false);
      onOpenFsd(newFsd.id);
    } catch (err) {
      alert(`Gagal membuat FSD: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (fsd: FsdDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFsd(fsd);
    setEditTitle(fsd.metadata.title);
    setEditCode(fsd.metadata.code);
    setEditVersion(fsd.metadata.version);
    setEditStatus(fsd.metadata.status);
    setEditAuthor(fsd.metadata.author);
    setEditTargetRelease(fsd.metadata.targetRelease);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFsd || !editTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const updated: FsdDocument = {
        ...editingFsd,
        metadata: {
          ...editingFsd.metadata,
          title: editTitle.trim(),
          code: editCode.trim(),
          version: editVersion.trim() || '0.1',
          status: editStatus,
          author: editAuthor.trim(),
          targetRelease: editTargetRelease.trim(),
          updatedAt: new Date().toISOString(),
        },
      };

      await putRecord(STORES.fsdDocuments, updated);
      await onRefresh();
      setEditingFsd(null);
    } catch (err) {
      alert(`Gagal memperbarui FSD: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleQuickBackup = async () => {
    try {
      setIsBackingUp(true);
      await downloadBackupFile();
    } catch (err) {
      alert(`Gagal mengekspor backup: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleStartDelete = (fsd: FsdDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingFsd(fsd);
  };

  const handleConfirmDelete = async () => {
    if (!deletingFsd) return;
    try {
      setIsSubmitting(true);
      await deleteFsdDocumentAndRelatedRecords(deletingFsd.id);
      await onRefresh();
      setDeletingFsd(null);
    } catch (err) {
      alert(`Gagal menghapus FSD: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">Draft</span>;
      case 'In Review':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">In Review</span>;
      case 'Baseline':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Baseline</span>;
      case 'Superseded':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">Superseded</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Dashboard
        </button>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate">{project.name}</span>
      </div>

      {/* Project Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            {project.code && (
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                {project.code}
              </span>
            )}
            {project.clientName && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                Klien: {project.clientName}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{project.description}</p>
          )}
          <div className="text-xs text-slate-400">
            Dibuat pada {new Date(project.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          Buat Dokumen FSD
        </button>
      </div>

      {/* FSD Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Daftar Dokumen FSD ({fsdDocuments.length})</h2>
          <span className="text-xs text-slate-500">
            Struktur FSD menggunakan hierarki standar perusahaan
          </span>
        </div>

        {fsdDocuments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <DocumentIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Belum Ada Dokumen FSD</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan dokumen FSD baru untuk project ini untuk mulai mendefinisikan modul dan kebutuhan fungsional.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Buat Dokumen FSD
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fsdDocuments.map((fsd) => {
              const moduleCount = fsd.modules.length;
              return (
                <div
                  key={fsd.id}
                  onClick={() => onOpenFsd(fsd.id)}
                  className="group bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {fsd.metadata.code}
                          </span>
                          <span className="text-xs font-medium text-slate-500">v{fsd.metadata.version}</span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mt-1.5">
                          {fsd.metadata.title}
                        </h3>
                      </div>
                      <div>{getStatusBadge(fsd.metadata.status)}</div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 pt-1">
                      {fsd.metadata.author && (
                        <div>
                          Author: <span className="text-slate-700 font-medium">{fsd.metadata.author}</span>
                        </div>
                      )}
                      {fsd.metadata.targetRelease && (
                        <div>
                          Target Release: <span className="text-slate-700 font-medium">{fsd.metadata.targetRelease}</span>
                        </div>
                      )}
                      {fsd.idConvention.prefix && (
                        <div>
                          ID Prefix: <span className="text-slate-700 font-mono font-medium">{fsd.idConvention.prefix}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <LayersIcon className="w-3.5 h-3.5 text-slate-500" />
                      {moduleCount} Modul
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(fsd, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Metadata FSD"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleStartDelete(fsd, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus FSD"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                      <div className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ml-1">
                        Buka
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create FSD */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Dokumen FSD Baru"
        description="Dokumen FSD baru dimulai dengan struktur 9 subbagian modul standar."
      >
        <form onSubmit={handleCreateFsd} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul FSD <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Modul Checkout & Payment Gateway"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Dokumen
              </label>
              <input
                type="text"
                placeholder="FSD-002"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Prefix (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: PAY"
                value={createIdPrefix}
                onChange={(e) => setCreateIdPrefix(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author / Lead BA
              </label>
              <input
                type="text"
                placeholder="Nama penyusun dokumen"
                value={createAuthor}
                onChange={(e) => setCreateAuthor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Release
              </label>
              <input
                type="text"
                placeholder="Contoh: Q4 2026 / Sprint 24"
                value={createTargetRelease}
                onChange={(e) => setCreateTargetRelease(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !createTitle.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Membuat...' : 'Buat FSD'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit FSD Metadata */}
      <Modal
        isOpen={Boolean(editingFsd)}
        onClose={() => setEditingFsd(null)}
        title="Edit Metadata Dokumen FSD"
        description="Perbarui informasi umum dan status dokumen."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul FSD <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Dokumen
              </label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Versi
              </label>
              <input
                type="text"
                value={editVersion}
                onChange={(e) => setEditVersion(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Dokumen
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as DocumentStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author
              </label>
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Release
              </label>
              <input
                type="text"
                value={editTargetRelease}
                onChange={(e) => setEditTargetRelease(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingFsd(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !editTitle.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete FSD Confirmation */}
      <Modal
        isOpen={Boolean(deletingFsd)}
        onClose={() => setDeletingFsd(null)}
        title="Hapus Dokumen FSD?"
        description="Tindakan ini tidak dapat dibatalkan."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Konfirmasi Penghapusan Dokumen</p>
              <p className="leading-relaxed">
                Anda akan menghapus dokumen <strong>"{deletingFsd?.metadata.title}"</strong> ({deletingFsd?.metadata.code}) beserta seluruh modul dan wireframe di dalamnya.
              </p>
            </div>
          </div>

          {/* Anjuran Backup */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-800">Anjuran Pencadangan Data</p>
              <p className="text-amber-700 mt-0.5">Disarankan mengekspor file backup sebelum menghapus data permanen.</p>
            </div>
            <button
              type="button"
              onClick={handleQuickBackup}
              disabled={isBackingUp}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              {isBackingUp ? 'Mengunduh...' : 'Ekspor Backup'}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingFsd(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Dokumen'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

