import { useState } from 'react';
import type { Project, FsdDocument, FsdModule, SectionState, ModuleSection } from '../core/types';
import { createEmptyModule, normalizeModuleCode } from '../core/schema';
import { putRecord, deleteAssetsForModule } from '../core/database';
import { STORES, MODULE_SECTIONS } from '../core/constants';
import { Modal } from '../components/Modal';
import {
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  LayersIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '../components/Icons';
import { DocumentControlEditor } from './authoring/DocumentControlEditor';
import { GlobalContextEditor } from './authoring/GlobalContextEditor';
import { OpenItemsApprovalEditor } from './authoring/OpenItemsApprovalEditor';
import { ModuleAuthoringView } from './authoring/ModuleAuthoringView';
import { TraceabilityMatrixView } from './authoring/TraceabilityMatrixView';
import { BaselineCheckModal } from './authoring/BaselineCheckModal';
import { DocumentPreviewView } from './preview/DocumentPreviewView';

interface FsdDetailViewProps {
  project: Project;
  fsd: FsdDocument;
  onBackToProject: () => void;
  onRefresh: () => Promise<void>;
}

type FsdTab = 'modules' | 'traceability' | 'documentControl' | 'globalContext' | 'openItemsApproval';

const SECTION_LABELS: Record<ModuleSection, string> = {
  flows: 'Process Flows',
  screens: 'UI / Lo-Fi',
  requirements: 'Functional Req.',
  businessRules: 'Business Rules',
  validations: 'Validation Rules',
  integrations: 'Integrations',
  errorStates: 'Error States',
  nfrs: 'Security & NFR',
  acceptanceCriteria: 'Acceptance Criteria',
};

export function FsdDetailView({
  project,
  fsd,
  onBackToProject,
  onRefresh,
}: FsdDetailViewProps) {
  const [activeTab, setActiveTab] = useState<FsdTab>('modules');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);

  // Add / Edit / Delete module modals
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<FsdModule | null>(null);
  const [deletingModule, setDeletingModule] = useState<FsdModule | null>(null);

  // Form states
  const [moduleName, setModuleName] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModName, setEditModName] = useState('');
  const [editModCode, setEditModCode] = useState('');
  const [editModDesc, setEditModDesc] = useState('');

  const activeModule = fsd.modules.find((m) => m.id === activeModuleId);

  // Handler for full FSD document updates from sub-editors
  const handleFsdUpdate = async (updatedFsd: FsdDocument) => {
    try {
      await putRecord(STORES.fsdDocuments, updatedFsd);
      await onRefresh();
    } catch (err) {
      alert(`Gagal menyimpan perubahan: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handler for single module update from ModuleAuthoringView
  const handleModuleUpdate = async (updatedModule: FsdModule) => {
    const updatedModules = fsd.modules.map((m) => (m.id === updatedModule.id ? updatedModule : m));
    const updatedFsd: FsdDocument = {
      ...fsd,
      modules: updatedModules,
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    await handleFsdUpdate(updatedFsd);
  };

  const handleOpenAddModal = () => {
    setModuleName('');
    setModuleCode('');
    setModuleDesc('');
    setIsAddModuleModalOpen(true);
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim()) return;

    try {
      setIsSubmitting(true);
      const code = normalizeModuleCode(moduleCode) || normalizeModuleCode(moduleName).slice(0, 8) || 'MODULE';
      const newModule = createEmptyModule({
        name: moduleName.trim(),
        code,
        description: moduleDesc.trim(),
      });

      const updatedFsd: FsdDocument = {
        ...fsd,
        modules: [...fsd.modules, newModule],
        metadata: {
          ...fsd.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await putRecord(STORES.fsdDocuments, updatedFsd);
      await onRefresh();
      setIsAddModuleModalOpen(false);
      setActiveModuleId(newModule.id);
    } catch (err) {
      alert(`Gagal menambah modul: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditModule = (mod: FsdModule, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModule(mod);
    setEditModName(mod.name);
    setEditModCode(mod.code);
    setEditModDesc(mod.description);
  };

  const handleSaveEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !editModName.trim()) return;

    try {
      setIsSubmitting(true);
      const code = normalizeModuleCode(editModCode) || editingModule.code;
      const updatedModules = fsd.modules.map((m) =>
        m.id === editingModule.id
          ? {
              ...m,
              name: editModName.trim(),
              code,
              description: editModDesc.trim(),
            }
          : m
      );

      const updatedFsd: FsdDocument = {
        ...fsd,
        modules: updatedModules,
        metadata: {
          ...fsd.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await putRecord(STORES.fsdDocuments, updatedFsd);
      await onRefresh();
      setEditingModule(null);
    } catch (err) {
      alert(`Gagal menyimpan perubahan modul: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDeleteModule = (mod: FsdModule, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingModule(mod);
  };

  const handleConfirmDeleteModule = async () => {
    if (!deletingModule) return;
    try {
      setIsSubmitting(true);
      await deleteAssetsForModule(deletingModule.id);
      const updatedModules = fsd.modules.filter((m) => m.id !== deletingModule.id);
      const updatedFsd: FsdDocument = {
        ...fsd,
        modules: updatedModules,
        metadata: {
          ...fsd.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
      await putRecord(STORES.fsdDocuments, updatedFsd);
      await onRefresh();
      if (activeModuleId === deletingModule.id) setActiveModuleId(null);
      setDeletingModule(null);
    } catch (err) {
      alert(`Gagal menghapus modul: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionBadge = (state: SectionState, count: number) => {
    if (count > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          ✓ {count} item
        </span>
      );
    }
    switch (state) {
      case 'in-progress':
        return <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">In Progress</span>;
      case 'complete':
        return <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Selesai</span>;
      case 'tbd':
        return <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">TBD</span>;
      case 'not-applicable':
        return <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">N/A</span>;
      case 'empty':
      default:
        return <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Kosong</span>;
    }
  };

  // If document preview mode is active, render DocumentPreviewView
  if (isPreviewMode) {
    return (
      <DocumentPreviewView
        project={project}
        fsd={fsd}
        initialModuleId={previewModuleId}
        onBack={() => {
          setIsPreviewMode(false);
          setPreviewModuleId(null);
        }}
      />
    );
  }

  // If a specific module is being authored, render ModuleAuthoringView
  if (activeModule) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModuleAuthoringView
          fsd={fsd}
          module={activeModule}
          projectId={project.id}
          onUpdateModule={handleModuleUpdate}
          onBack={() => setActiveModuleId(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <button
          type="button"
          onClick={onBackToProject}
          className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {project.name}
        </button>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate">{fsd.metadata.title}</span>
      </div>

      {/* FSD Document Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                {fsd.metadata.code}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                v{fsd.metadata.version}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {fsd.metadata.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {fsd.metadata.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPreviewModuleId(null);
                setIsPreviewMode(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>Preview & Cetak Dokumen</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBaselineModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
              <span>Cek Baseline FSD</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Modul
            </button>
          </div>
        </div>

        {/* FSD Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block font-medium">Author / BA</span>
            <span className="text-slate-700 font-semibold mt-0.5 block">{fsd.metadata.author || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Target Release</span>
            <span className="text-slate-700 font-semibold mt-0.5 block">{fsd.metadata.targetRelease || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">ID Prefix Namespace</span>
            <span className="text-slate-700 font-mono font-semibold mt-0.5 block">{fsd.idConvention.prefix || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Terakhir Diperbarui</span>
            <span className="text-slate-700 font-semibold mt-0.5 block">
              {new Date(fsd.metadata.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Authoring Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'modules'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <LayersIcon className="w-4 h-4" />
          <span>Modul FSD ({fsd.modules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('traceability')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'traceability'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Matriks Keterlacakan (RTM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documentControl')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'documentControl'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span>Kontrol Dokumen & Revisi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('globalContext')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'globalContext'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserGroupIcon className="w-4 h-4" />
          <span>Ruang Lingkup & Konteks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('openItemsApproval')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'openItemsApproval'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ClipboardDocumentCheckIcon className="w-4 h-4" />
          <span>Open Items & Approval</span>
        </button>
      </div>

      {/* Tab 1: Module List & Management */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Daftar Modul ({fsd.modules.length})
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Klik modul untuk menyusun 9 subbagian wajib
            </span>
          </div>

          {fsd.modules.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <LayersIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Belum Ada Modul</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dokumen FSD ini belum memiliki modul. Tambahkan modul untuk mulai menyusun kebutuhan fungsional.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Tambah Modul Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {fsd.modules.map((mod) => {
                const itemCounts: Record<ModuleSection, number> = {
                  flows: mod.flows.length,
                  screens: mod.screens.length,
                  requirements: mod.requirements.length,
                  businessRules: mod.businessRules.length,
                  validations: mod.validations.length,
                  integrations: mod.integrations.length,
                  errorStates: mod.errorStates.length,
                  nfrs: mod.nfrs.length,
                  acceptanceCriteria: mod.acceptanceCriteria.length,
                };

                return (
                  <div
                    key={mod.id}
                    onClick={() => setActiveModuleId(mod.id)}
                    className="group bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-6 shadow-xs transition-all space-y-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            MOD-{mod.code}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {mod.name}
                          </h3>
                        </div>
                        {mod.description && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{mod.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleStartEditModule(mod, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Modul"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleStartDeleteModule(mod, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Modul"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewModuleId(mod.id);
                            setIsPreviewMode(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Preview Modul Ini"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                        </button>
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 ml-2 group-hover:translate-x-0.5 transition-transform">
                          Buka Editor 9 Subbagian
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* 9 Standard Sub-sections Grid */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Status 9 Subbagian Wajib:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                        {MODULE_SECTIONS.map((secKey) => (
                          <div
                            key={secKey}
                            className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-between"
                          >
                            <span className="text-xs font-medium text-slate-700 truncate mb-1.5">
                              {SECTION_LABELS[secKey]}
                            </span>
                            <div>{renderSectionBadge(mod.sectionStates[secKey], itemCounts[secKey])}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Traceability Matrix */}
      {activeTab === 'traceability' && (
        <TraceabilityMatrixView
          fsd={fsd}
          onOpenBaselineCheck={() => setIsBaselineModalOpen(true)}
        />
      )}

      {/* Tab 3: Document Control & Metadata */}
      {activeTab === 'documentControl' && (
        <DocumentControlEditor fsd={fsd} onChange={handleFsdUpdate} />
      )}

      {/* Tab 3: Global Scope & Context */}
      {activeTab === 'globalContext' && (
        <GlobalContextEditor fsd={fsd} onChange={handleFsdUpdate} />
      )}

      {/* Tab 4: Open Items & Approval */}
      {activeTab === 'openItemsApproval' && (
        <OpenItemsApprovalEditor fsd={fsd} onChange={handleFsdUpdate} />
      )}

      {/* Modal: Add Module */}
      <Modal
        isOpen={isAddModuleModalOpen}
        onClose={() => setIsAddModuleModalOpen(false)}
        title="Tambah Modul Baru"
        description="Setiap modul memiliki 9 subbagian wajib standar dokumen FSD."
      >
        <form onSubmit={handleAddModule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Modul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Checkout, Payment Gateway, User Profile"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Modul (Namespace ID)
            </label>
            <input
              type="text"
              placeholder="Contoh: PAY, CHECKOUT, PROFILE"
              value={moduleCode}
              onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Digunakan sebagai kode artefak (misal: FR-PAY-01, BR-PAY-01).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Modul
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan tujuan dan cakupan fungsional modul ini..."
              value={moduleDesc}
              onChange={(e) => setModuleDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModuleModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !moduleName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menambahkan...' : 'Tambah Modul'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Module */}
      <Modal
        isOpen={Boolean(editingModule)}
        onClose={() => setEditingModule(null)}
        title="Edit Modul"
        description="Perbarui informasi umum modul."
      >
        <form onSubmit={handleSaveEditModule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Modul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editModName}
              onChange={(e) => setEditModName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Modul
            </label>
            <input
              type="text"
              value={editModCode}
              onChange={(e) => setEditModCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Modul
            </label>
            <textarea
              rows={3}
              value={editModDesc}
              onChange={(e) => setEditModDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingModule(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !editModName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Module Confirmation */}
      <Modal
        isOpen={Boolean(deletingModule)}
        onClose={() => setDeletingModule(null)}
        title="Hapus Modul?"
        description="Tindakan ini tidak dapat dibatalkan."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Konfirmasi Penghapusan Modul</p>
              <p className="leading-relaxed">
                Anda akan menghapus modul <strong>"{deletingModule?.name}"</strong> ({deletingModule?.code}) beserta seluruh requirement, wireframe, dan skenario di dalamnya.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingModule(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteModule}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Modul'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Baseline Completeness Check */}
      <BaselineCheckModal
        isOpen={isBaselineModalOpen}
        onClose={() => setIsBaselineModalOpen(false)}
        fsd={fsd}
      />
    </div>
  );
}
