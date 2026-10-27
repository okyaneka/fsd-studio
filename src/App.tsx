import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import type { Project, FsdDocument, FsdModule } from './core/types';
import { getAllRecords, putRecord } from './core/database';
import { STORES } from './core/constants';
import { Navbar } from './components/Navbar';
import { BackupModal } from './components/BackupModal';
import { ProjectDashboardView } from './views/ProjectDashboardView';
import { ProjectDetailView } from './views/ProjectDetailView';
import { FsdDetailView } from './views/FsdDetailView';
import { ModuleAuthoringView } from './views/authoring/ModuleAuthoringView';
import { DocumentPreviewView } from './views/preview/DocumentPreviewView';

function ProjectDetailRoute({
  projects,
  fsdDocuments,
  onRefresh,
}: {
  projects: Project[];
  fsdDocuments: FsdDocument[];
  onRefresh: () => Promise<void>;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h3 className="text-base font-semibold text-amber-900">Project Tidak Ditemukan</h3>
        <p className="text-sm text-amber-700 mt-2">
          Project dengan ID &quot;{projectId}&quot; tidak ditemukan di dalam workspace.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const projectFsdDocuments = fsdDocuments.filter((d) => d.projectId === project.id);

  return (
    <ProjectDetailView
      project={project}
      fsdDocuments={projectFsdDocuments}
      onBackToDashboard={() => navigate('/')}
      onOpenFsd={(fsdId) => navigate(`/projects/${project.id}/fsd/${fsdId}`)}
      onRefresh={onRefresh}
    />
  );
}

function FsdDetailRoute({
  projects,
  fsdDocuments,
  onRefresh,
}: {
  projects: Project[];
  fsdDocuments: FsdDocument[];
  onRefresh: () => Promise<void>;
}) {
  const { projectId, fsdId } = useParams<{ projectId: string; fsdId: string }>();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId);
  const fsd = fsdDocuments.find((d) => d.id === fsdId);

  if (!project || !fsd) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h3 className="text-base font-semibold text-amber-900">Dokumen FSD Tidak Ditemukan</h3>
        <p className="text-sm text-amber-700 mt-2">
          Dokumen FSD dengan ID &quot;{fsdId}&quot; tidak ditemukan di dalam project ini.
        </p>
        <button
          type="button"
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
        >
          Kembali ke Project
        </button>
      </div>
    );
  }

  return (
    <FsdDetailView
      project={project}
      fsd={fsd}
      onBackToProject={() => navigate(`/projects/${project.id}`)}
      onRefresh={onRefresh}
    />
  );
}

function ModuleAuthoringRoute({
  projects,
  fsdDocuments,
  onRefresh,
}: {
  projects: Project[];
  fsdDocuments: FsdDocument[];
  onRefresh: () => Promise<void>;
}) {
  const { projectId, fsdId, moduleId } = useParams<{
    projectId: string;
    fsdId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId);
  const fsd = fsdDocuments.find((d) => d.id === fsdId);
  const module = fsd?.modules.find((m) => m.id === moduleId);

  if (!project || !fsd) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h3 className="text-base font-semibold text-amber-900">Dokumen FSD Tidak Ditemukan</h3>
        <p className="text-sm text-amber-700 mt-2">
          Dokumen FSD tidak ditemukan di dalam workspace ini.
        </p>
        <button
          type="button"
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
        >
          Kembali ke Project
        </button>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h3 className="text-base font-semibold text-amber-900">Modul Tidak Ditemukan</h3>
        <p className="text-sm text-amber-700 mt-2">
          Modul dengan ID &quot;{moduleId}&quot; tidak ditemukan di dalam dokumen FSD ini.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/projects/${project.id}/fsd/${fsd.id}`)}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
        >
          Kembali ke Daftar Modul FSD
        </button>
      </div>
    );
  }

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
    await putRecord(STORES.fsdDocuments, updatedFsd);
    await onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ModuleAuthoringView
        fsd={fsd}
        module={module}
        projectId={project.id}
        onUpdateModule={handleModuleUpdate}
        onBack={() => navigate(`/projects/${project.id}/fsd/${fsd.id}`)}
      />
    </div>
  );
}

function DocumentPreviewRoute({
  projects,
  fsdDocuments,
}: {
  projects: Project[];
  fsdDocuments: FsdDocument[];
}) {
  const { projectId, fsdId } = useParams<{ projectId: string; fsdId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId);
  const fsd = fsdDocuments.find((d) => d.id === fsdId);
  const moduleId = searchParams.get('module') || null;

  if (!project || !fsd) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h3 className="text-base font-semibold text-amber-900">Dokumen FSD Tidak Ditemukan</h3>
        <p className="text-sm text-amber-700 mt-2">
          Dokumen FSD tidak ditemukan untuk pratinjau.
        </p>
        <button
          type="button"
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <DocumentPreviewView
      project={project}
      fsd={fsd}
      initialModuleId={moduleId}
      onBack={() => navigate(`/projects/${project.id}/fsd/${fsd.id}`)}
    />
  );
}

function ModuleAliasRoute() {
  const { projectId, fsdId, moduleId } = useParams<{
    projectId: string;
    fsdId: string;
    moduleId: string;
  }>();
  return <Navigate to={`/projects/${projectId}/fsd/${fsdId}/modules/${moduleId}`} replace />;
}

function FsdShortcutRoute({ fsdDocuments }: { fsdDocuments: FsdDocument[] }) {
  const { fsdId } = useParams<{ fsdId: string }>();
  const fsd = fsdDocuments.find((d) => d.id === fsdId);

  if (!fsd) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/projects/${fsd.projectId}/fsd/${fsd.id}`} replace />;
}

function AppContent() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fsdDocuments, setFsdDocuments] = useState<FsdDocument[]>([]);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const [allProjects, allFsdDocs] = await Promise.all([
        getAllRecords<Project>(STORES.projects),
        getAllRecords<FsdDocument>(STORES.fsdDocuments),
      ]);
      // Sort projects by newest updated
      allProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProjects(allProjects);
      setFsdDocuments(allFsdDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data dari IndexedDB.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar
        onGoHome={handleGoHome}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Memuat Workspace...</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <h3 className="text-base font-semibold text-red-900">Terjadi Kesalahan</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
            <button
              type="button"
              onClick={() => refreshData()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <ProjectDashboardView
                  projects={projects}
                  fsdDocuments={fsdDocuments}
                  onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
                  onRefresh={refreshData}
                />
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProjectDetailRoute
                  projects={projects}
                  fsdDocuments={fsdDocuments}
                  onRefresh={refreshData}
                />
              }
            />
            <Route
              path="/projects/:projectId/fsd/:fsdId"
              element={
                <FsdDetailRoute
                  projects={projects}
                  fsdDocuments={fsdDocuments}
                  onRefresh={refreshData}
                />
              }
            />
            <Route
              path="/projects/:projectId/fsd/:fsdId/modules/:moduleId"
              element={
                <ModuleAuthoringRoute
                  projects={projects}
                  fsdDocuments={fsdDocuments}
                  onRefresh={refreshData}
                />
              }
            />
            <Route
              path="/projects/:projectId/fsd/:fsdId/module/:moduleId"
              element={<ModuleAliasRoute />}
            />
            <Route
              path="/projects/:projectId/fsd/:fsdId/preview"
              element={
                <DocumentPreviewRoute
                  projects={projects}
                  fsdDocuments={fsdDocuments}
                />
              }
            />
            <Route
              path="/fsd/:fsdId"
              element={<FsdShortcutRoute fsdDocuments={fsdDocuments} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        FSD Studio &bull; Functional Specification Document Workspace &bull; Local Storage via IndexedDB
      </footer>

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestored={async () => {
          await refreshData();
          handleGoHome();
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

