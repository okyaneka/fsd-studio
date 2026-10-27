import { useState } from 'react';
import type { FsdDocument, RevisionHistoryEntry, RelatedDocument, DocumentStatus } from '../../core/types';
import { DOCUMENT_STATUSES } from '../../core/constants';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';
import { checkFsdCompleteness } from '../../core/integrity';
import { BaselineCheckModal } from './BaselineCheckModal';

interface DocumentControlEditorProps {
  fsd: FsdDocument;
  onChange: (updatedFsd: FsdDocument) => void;
}

export function DocumentControlEditor({ fsd, onChange }: DocumentControlEditorProps) {
  // Reviewer input state
  const [newReviewer, setNewReviewer] = useState('');

  // Revision history modal state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [editingRevIndex, setEditingRevIndex] = useState<number | null>(null);
  const [revVersion, setRevVersion] = useState('');
  const [revDate, setRevDate] = useState(new Date().toISOString().slice(0, 10));
  const [revAuthor, setRevAuthor] = useState('');
  const [revSummary, setRevSummary] = useState('');

  // Related documents modal state
  const [isRelDocModalOpen, setIsRelDocModalOpen] = useState(false);
  const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);
  const [relDocName, setRelDocName] = useState('');
  const [relDocRef, setRelDocRef] = useState('');
  const [relDocDesc, setRelDocDesc] = useState('');

  // Baseline check modal state
  const [isBaselineCheckOpen, setIsBaselineCheckOpen] = useState(false);

  const updateMetadata = (key: keyof FsdDocument['metadata'], value: unknown) => {
    onChange({
      ...fsd,
      metadata: {
        ...fsd.metadata,
        [key]: value,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleStatusChange = (newStatus: DocumentStatus) => {
    if (newStatus === 'Baseline') {
      const report = checkFsdCompleteness(fsd);
      if (!report.isBaselineReady) {
        setIsBaselineCheckOpen(true);
        return;
      }
    }
    updateMetadata('status', newStatus);
  };

  const handleAddReviewer = () => {
    if (!newReviewer.trim()) return;
    if (fsd.metadata.reviewers.includes(newReviewer.trim())) return;
    updateMetadata('reviewers', [...fsd.metadata.reviewers, newReviewer.trim()]);
    setNewReviewer('');
  };

  const handleRemoveReviewer = (index: number) => {
    const updated = [...fsd.metadata.reviewers];
    updated.splice(index, 1);
    updateMetadata('reviewers', updated);
  };

  // Revision handlers
  const handleOpenAddRevision = () => {
    setEditingRevIndex(null);
    setRevVersion(`0.${fsd.documentControl.revisionHistory.length + 1}`);
    setRevDate(new Date().toISOString().slice(0, 10));
    setRevAuthor(fsd.metadata.author || '');
    setRevSummary('');
    setIsRevisionModalOpen(true);
  };

  const handleOpenEditRevision = (index: number) => {
    const item = fsd.documentControl.revisionHistory[index];
    setEditingRevIndex(index);
    setRevVersion(item.version);
    setRevDate(item.date);
    setRevAuthor(item.author);
    setRevSummary(item.changeSummary);
    setIsRevisionModalOpen(true);
  };

  const handleSaveRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revVersion.trim() || !revSummary.trim()) return;

    const entry: RevisionHistoryEntry = {
      version: revVersion.trim(),
      date: revDate.trim(),
      author: revAuthor.trim(),
      changeSummary: revSummary.trim(),
    };

    const updatedHistory = [...fsd.documentControl.revisionHistory];
    if (editingRevIndex !== null) {
      updatedHistory[editingRevIndex] = entry;
    } else {
      updatedHistory.push(entry);
    }

    onChange({
      ...fsd,
      documentControl: {
        ...fsd.documentControl,
        revisionHistory: updatedHistory,
      },
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    });

    setIsRevisionModalOpen(false);
  };

  const handleDeleteRevision = (index: number) => {
    const updatedHistory = [...fsd.documentControl.revisionHistory];
    updatedHistory.splice(index, 1);
    onChange({
      ...fsd,
      documentControl: {
        ...fsd.documentControl,
        revisionHistory: updatedHistory,
      },
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  // Related documents handlers
  const handleOpenAddRelDoc = () => {
    setEditingDocIndex(null);
    setRelDocName('');
    setRelDocRef('');
    setRelDocDesc('');
    setIsRelDocModalOpen(true);
  };

  const handleOpenEditRelDoc = (index: number) => {
    const item = fsd.documentControl.relatedDocuments[index];
    setEditingDocIndex(index);
    setRelDocName(item.name);
    setRelDocRef(item.reference);
    setRelDocDesc(item.description);
    setIsRelDocModalOpen(true);
  };

  const handleSaveRelDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relDocName.trim()) return;

    const entry: RelatedDocument = {
      name: relDocName.trim(),
      reference: relDocRef.trim(),
      description: relDocDesc.trim(),
    };

    const updatedDocs = [...fsd.documentControl.relatedDocuments];
    if (editingDocIndex !== null) {
      updatedDocs[editingDocIndex] = entry;
    } else {
      updatedDocs.push(entry);
    }

    onChange({
      ...fsd,
      documentControl: {
        ...fsd.documentControl,
        relatedDocuments: updatedDocs,
      },
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    });

    setIsRelDocModalOpen(false);
  };

  const handleDeleteRelDoc = (index: number) => {
    const updatedDocs = [...fsd.documentControl.relatedDocuments];
    updatedDocs.splice(index, 1);
    onChange({
      ...fsd,
      documentControl: {
        ...fsd.documentControl,
        relatedDocuments: updatedDocs,
      },
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Document Metadata Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          1. Metadata Dokumen & Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Dokumen FSD
            </label>
            <input
              type="text"
              value={fsd.metadata.title}
              onChange={(e) => updateMetadata('title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Dokumen
            </label>
            <input
              type="text"
              value={fsd.metadata.code}
              onChange={(e) => updateMetadata('code', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Status Dokumen
              </label>
              <button
                type="button"
                onClick={() => setIsBaselineCheckOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Cek Kelayakan Baseline
              </button>
            </div>
            <select
              value={fsd.metadata.status}
              onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Versi Dokumen
            </label>
            <input
              type="text"
              value={fsd.metadata.version}
              onChange={(e) => updateMetadata('version', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Release
            </label>
            <input
              type="date"
              value={fsd.metadata.targetRelease}
              onChange={(e) => updateMetadata('targetRelease', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Author (Lead Business Analyst)
            </label>
            <input
              type="text"
              placeholder="Nama penyusun dokumen"
              value={fsd.metadata.author}
              onChange={(e) => updateMetadata('author', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reviewer / Stakeholder
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Tambah nama reviewer (misal: SA Lead, Product Owner)..."
                value={newReviewer}
                onChange={(e) => setNewReviewer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReviewer();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddReviewer}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Tambah
              </button>
            </div>
            {fsd.metadata.reviewers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fsd.metadata.reviewers.map((rev, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                  >
                    {rev}
                    <button
                      type="button"
                      onClick={() => handleRemoveReviewer(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada reviewer yang ditambahkan.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Revision History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Riwayat Revisi Dokumen</h3>
            <p className="text-xs text-slate-500">Mencatat setiap rilis dan pembaruan spesifikasi.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddRevision}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Entri
          </button>
        </div>

        {fsd.documentControl.revisionHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic text-center">Belum ada catatan riwayat revisi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-20">Versi</th>
                  <th className="py-2.5 px-3 font-semibold w-28">Tanggal</th>
                  <th className="py-2.5 px-3 font-semibold w-36">Author</th>
                  <th className="py-2.5 px-3 font-semibold">Ringkasan Perubahan</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fsd.documentControl.revisionHistory.map((rev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium">{rev.version}</td>
                    <td className="py-2.5 px-3">{rev.date}</td>
                    <td className="py-2.5 px-3">{rev.author}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{rev.changeSummary}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRevision(idx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRevision(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Hapus"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Related Documents */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">3. Dokumen Terkait & Referensi</h3>
            <p className="text-xs text-slate-500">Tautan BRD, PRD, Arsitektur, atau Figma yang menjadi acuan.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddRelDoc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Dokumen
          </button>
        </div>

        {fsd.documentControl.relatedDocuments.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic text-center">Belum ada dokumen terkait.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-48">Nama Dokumen</th>
                  <th className="py-2.5 px-3 font-semibold w-48">Referensi / Tautan</th>
                  <th className="py-2.5 px-3 font-semibold">Deskripsi</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fsd.documentControl.relatedDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{doc.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 truncate max-w-xs">{doc.reference || '—'}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{doc.description || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRelDoc(idx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRelDoc(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Hapus"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Revision */}
      <Modal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title={editingRevIndex !== null ? 'Edit Riwayat Revisi' : 'Tambah Riwayat Revisi'}
      >
        <form onSubmit={handleSaveRevision} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Versi <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                required
                placeholder="Contoh: 1.0"
                value={revVersion}
                onChange={(e) => setRevVersion(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                required
                value={revDate}
                onChange={(e) => setRevDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Author
            </label>
            <input
              type="text"
              placeholder="Nama penanggung jawab revisi"
              value={revAuthor}
              onChange={(e) => setRevAuthor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ringkasan Perubahan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan bagian atau requirement yang ditambahkan atau diubah..."
              value={revSummary}
              onChange={(e) => setRevSummary(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRevisionModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Related Document */}
      <Modal
        isOpen={isRelDocModalOpen}
        onClose={() => setIsRelDocModalOpen(false)}
        title={editingDocIndex !== null ? 'Edit Dokumen Terkait' : 'Tambah Dokumen Terkait'}
      >
        <form onSubmit={handleSaveRelDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Dokumen <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Business Requirements Document (BRD)"
              value={relDocName}
              onChange={(e) => setRelDocName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referensi / Nomor / Tautan URL
            </label>
            <input
              type="text"
              placeholder="Contoh: BRD-2026-004 atau https://..."
              value={relDocRef}
              onChange={(e) => setRelDocRef(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi / Catatan Hubungan
            </label>
            <textarea
              rows={2}
              placeholder="Keterangan bagaimana dokumen ini berkaitan dengan FSD..."
              value={relDocDesc}
              onChange={(e) => setRelDocDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRelDocModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Baseline Completeness Check */}
      <BaselineCheckModal
        isOpen={isBaselineCheckOpen}
        onClose={() => setIsBaselineCheckOpen(false)}
        fsd={fsd}
        isStatusChangeAttempt={true}
        onConfirmBaseline={() => {
          updateMetadata('status', 'Baseline');
          setIsBaselineCheckOpen(false);
        }}
      />
    </div>
  );
}

