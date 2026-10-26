import { useState, useMemo } from 'react';
import type { Project, FsdDocument } from '../core/types';
import { createProjectWithStarterFsd, deleteProjectAndRelatedRecords, putRecord } from '../core/database';
import { createStarterWorkspace, normalizeModuleCode } from '../core/schema';
import { STORES } from '../core/constants';
import { Modal } from '../components/Modal';
import { FolderIcon, PlusIcon, SearchIcon, TrashIcon, EditIcon, ChevronRightIcon, ExclamationTriangleIcon, DownloadIcon } from '../components/Icons';
import { downloadBackupFile } from '../core/backup';

interface ProjectDashboardViewProps {
  projects: Project[];
  fsdDocuments: FsdDocument[];
  onOpenProject: (projectId: string) => void;
  onRefresh: () => Promise<void>;
}

export function ProjectDashboardView({
  projects,
  fsdDocuments,
  onOpenProject,
  onRefresh,
}: ProjectDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createClient, setCreateClient] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createIdPrefix, setCreateIdPrefix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete confirm state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Map FSD count per project
  const fsdCountByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of fsdDocuments) {
      counts[doc.projectId] = (counts[doc.projectId] || 0) + 1;
    }
    return counts;
  }, [fsdDocuments]);

  // Filter projects by query
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleOpenCreateModal = () => {
    setCreateName('');
    setCreateCode('');
    setCreateClient('');
    setCreateDescription('');
    setCreateIdPrefix('');
    setIsCreateModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setIsSubmitting(true);
      const { project, fsd } = createStarterWorkspace({
        name: createName.trim(),
        code: normalizeModuleCode(createCode) || '',
        clientName: createClient.trim(),
        description: createDescription.trim(),
      });

      // Update ID Prefix if provided
      if (createIdPrefix.trim()) {
        const prefix = normalizeModuleCode(createIdPrefix);
        fsd.idConvention.prefix = prefix;
        // update starters to match prefix if needed
        fsd.modules.forEach(m => {
          m.flows.forEach((flow, idx) => {
            flow.id = `FLOW-${prefix}-${m.code}-${flow.name.toUpperCase().replace(/\s+/g, '-')}`;
          });
          m.screens.forEach((screen) => {
            screen.id = `SCR-${prefix}-${m.code}-${screen.name.toUpperCase().replace(/\s+/g, '-')}`;
          });
        });
      }

      await createProjectWithStarterFsd(project, fsd);
      await onRefresh();
      setIsCreateModalOpen(false);
      onOpenProject(project.id);
    } catch (err) {
      alert(`Gagal membuat project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditCode(project.code);
    setEditClient(project.clientName);
    setEditDescription(project.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      const updated: Project = {
        ...editingProject,
        name: editName.trim(),
        code: normalizeModuleCode(editCode) || '',
        clientName: editClient.trim(),
        description: editDescription.trim(),
        updatedAt: new Date().toISOString(),
      };
      await putRecord(STORES.projects, updated);
      await onRefresh();
      setEditingProject(null);
    } catch (err) {
      alert(`Gagal memperbarui project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingProject(project);
    setDeleteConfirmText('');
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

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    try {
      setIsSubmitting(true);
      await deleteProjectAndRelatedRecords(deletingProject.id);
      await onRefresh();
      setDeletingProject(null);
    } catch (err) {
      alert(`Gagal menghapus project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola Functional Specification Document (FSD) untuk setiap inisiatif dan project bisnis.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Project Baru
        </button>
      </div>

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama project, kode, klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          Menampilkan {filteredProjects.length} dari {projects.length} project
        </div>
      </div>

      {/* Project Grid / Empty State */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <FolderIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Belum Ada Project</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Mulai dengan membuat project baru. Sistem akan secara otomatis menginisialisasi dokumen FSD awal lengkap dengan starter module Authentication.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Buat Project Pertama
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          Tidak ada project yang cocok dengan pencarian "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const docCount = fsdCountByProject[project.id] || 0;
            return (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group relative bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                        <FolderIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {project.name}
                        </h2>
                        {project.code && (
                          <span className="inline-block px-2 py-0.5 mt-0.5 text-[11px] font-mono font-medium rounded bg-slate-100 text-slate-700">
                            {project.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(project, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Project"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleStartDelete(project, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus Project"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {project.clientName && (
                    <div className="mt-3 text-xs text-slate-500 font-medium">
                      Klien / Partner: <span className="text-slate-800">{project.clientName}</span>
                    </div>
                  )}

                  {project.description && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {docCount} Dokumen FSD
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    Buka Project
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Project */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Project Baru"
        description="Setiap project baru secara otomatis membuat FSD awal dengan modul Authentication."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Project <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: HRIS Portal Employee, E-Commerce Mobile"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Project (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: HRIS, ECOM"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Klien / Divisi
              </label>
              <input
                type="text"
                placeholder="Contoh: Internal HR, PT ABC"
                value={createClient}
                onChange={(e) => setCreateClient(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ID Prefix untuk FSD Starter (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: CLIENT (menghasilkan FR-CLIENT-AUTH-01)"
              value={createIdPrefix}
              onChange={(e) => setCreateIdPrefix(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Prefix opsional disisipkan pada visible ID artefak FSD starter.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Project
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan ruang lingkup atau sasaran project..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
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
              disabled={isSubmitting || !createName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Project */}
      <Modal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title="Edit Project"
        description="Ubah informasi metadata project."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Project <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Project
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
                Nama Klien / Divisi
              </label>
              <input
                type="text"
                value={editClient}
                onChange={(e) => setEditClient(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Project
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !editName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Project Confirmation */}
      <Modal
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        title="Hapus Project?"
        description="Tindakan ini tidak dapat dibatalkan."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Konfirmasi Penghapusan Permanen</p>
              <p className="leading-relaxed">
                Menghapus project <strong>"{deletingProject?.name}"</strong> akan menghapus seluruh dokumen FSD di dalamnya beserta gambar wireframe Lo-Fi terkait.
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

          <div>
            <p className="text-xs text-slate-600 mb-2">
              Ketik <strong>{deletingProject?.name}</strong> di bawah untuk mengonfirmasi:
            </p>
            <input
              type="text"
              placeholder={deletingProject?.name}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingProject(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isSubmitting || deleteConfirmText !== deletingProject?.name}
              className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

