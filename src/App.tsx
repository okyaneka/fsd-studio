import { useEffect, useState, useCallback } from 'react';
import type { Project, FsdDocument } from './core/types';
import { getAllRecords } from './core/database';
import { STORES } from './core/constants';
import { Navbar } from './components/Navbar';
import { BackupModal } from './components/BackupModal';
import { ProjectDashboardView } from './views/ProjectDashboardView';
import { ProjectDetailView } from './views/ProjectDetailView';
import { FsdDetailView } from './views/FsdDetailView';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [fsdDocuments, setFsdDocuments] = useState<FsdDocument[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFsdId, setActiveFsdId] = useState<string | null>(null);
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

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectFsdDocuments = fsdDocuments.filter((d) => d.projectId === activeProjectId);
  const activeFsd = fsdDocuments.find((d) => d.id === activeFsdId);

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveFsdId(null);
  };

  const handleOpenFsd = (fsdId: string) => {
    setActiveFsdId(fsdId);
  };

  const handleGoHome = () => {
    setActiveProjectId(null);
    setActiveFsdId(null);
  };

  const handleBackToProject = () => {
    setActiveFsdId(null);
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
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
            >
              Coba Lagi
            </button>
          </div>
        ) : activeProject && activeFsd ? (
          <FsdDetailView
            project={activeProject}
            fsd={activeFsd}
            onBackToProject={handleBackToProject}
            onRefresh={refreshData}
          />
        ) : activeProject ? (
          <ProjectDetailView
            project={activeProject}
            fsdDocuments={projectFsdDocuments}
            onBackToDashboard={handleGoHome}
            onOpenFsd={handleOpenFsd}
            onRefresh={refreshData}
          />
        ) : (
          <ProjectDashboardView
            projects={projects}
            fsdDocuments={fsdDocuments}
            onOpenProject={handleOpenProject}
            onRefresh={refreshData}
          />
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

