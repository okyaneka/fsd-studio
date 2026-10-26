import { useState, useEffect, useMemo } from 'react';
import type { Project, FsdDocument, Screen } from '../../core/types';
import { getAssetById } from '../../core/assets';
import { buildTraceabilityMatrix } from '../../core/traceability';
import { ArrowLeftIcon } from '../../components/Icons';
import { DocumentCover } from './DocumentCover';
import { DocumentToc } from './DocumentToc';
import { metadataTitle } from './previewHelpers';
import { GlobalSectionsPreview } from './sections/GlobalSectionsPreview';
import { ModulePreviewSection } from './sections/ModulePreviewSection';
import { TraceabilityPreviewSection } from './sections/TraceabilityPreviewSection';
import { OpenItemsPreviewSection } from './sections/OpenItemsPreviewSection';

interface DocumentPreviewViewProps {
  project?: Project;
  fsd: FsdDocument;
  initialModuleId?: string | null;
  onBack: () => void;
}

export function DocumentPreviewView({
  project,
  fsd,
  initialModuleId = null,
  onBack,
}: DocumentPreviewViewProps) {
  const [selectedModuleScope, setSelectedModuleScope] = useState<string>(
    initialModuleId || 'all'
  );

  // Asset object URLs map: assetId -> objectUrl
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});

  // Traceability Summary
  const traceabilitySummary = useMemo(() => buildTraceabilityMatrix(fsd), [fsd]);

  // Load all wireframe assets from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const createdUrls: string[] = [];

    async function loadAssets() {
      const urlMap: Record<string, string> = {};
      const screensWithAssets: Screen[] = [];

      for (const mod of fsd.modules) {
        for (const scr of mod.screens) {
          if (scr.wireframeAssetId) {
            screensWithAssets.push(scr);
          }
        }
      }

      for (const scr of screensWithAssets) {
        if (!scr.wireframeAssetId) continue;
        try {
          const asset = await getAssetById(scr.wireframeAssetId);
          if (asset && asset.blob && isMounted) {
            const objUrl = URL.createObjectURL(asset.blob);
            createdUrls.push(objUrl);
            urlMap[scr.wireframeAssetId] = objUrl;
          }
        } catch (err) {
          console.error(`Gagal memuat aset wireframe ${scr.wireframeAssetId}:`, err);
        }
      }

      if (isMounted) {
        setAssetUrls(urlMap);
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [fsd]);

  const visibleModules = useMemo(() => {
    if (selectedModuleScope === 'all') return fsd.modules;
    return fsd.modules.filter((m) => m.id === selectedModuleScope);
  }, [fsd, selectedModuleScope]);

  const handlePrint = () => {
    window.print();
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fsd-canvas min-h-screen text-[#202a36]">
      {/* Top Application Bar (Hidden in Print) */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3 bg-[#142b40] text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Kembali ke Editor</span>
          </button>
          <div className="hidden sm:block text-xs font-semibold tracking-wider text-slate-300 border-l border-white/20 pl-3 uppercase">
            {metadataTitle(fsd.metadata.title)} · v{fsd.metadata.version}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scope Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden md:inline text-slate-300">Cakupan Tampilan:</span>
            <select
              value={selectedModuleScope}
              onChange={(e) => setSelectedModuleScope(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#1f3f5e] border border-white/20 rounded-md text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Seluruh Dokumen (Full FSD)</option>
              {fsd.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  Modul: {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#2e648e] hover:bg-[#3976a5] text-white rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print / Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={handleScrollTop}
            title="Kembali ke atas"
            className="hidden sm:flex items-center justify-center p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Document Shell */}
      <div className="fsd-shell grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] max-w-[1500px] mx-auto items-start gap-6 p-4 sm:p-6">
        {/* Navigation Sidebar (Desktop, hidden in Print) */}
        <DocumentToc fsd={fsd} activeModuleScope={selectedModuleScope} />

        {/* Center Document Canvas (White Pages on Neutral Canvas) */}
        <main className="min-w-0">
          {/* COVER PAGE */}
          <DocumentCover project={project} fsd={fsd} />

          {/* 1. DOCUMENT CONTROL, 2. OVERVIEW & SCOPE, 3. BUSINESS CONTEXT, 4. ACTORS */}
          <GlobalSectionsPreview fsd={fsd} />

          {/* 5-13. DYNAMIC MODULES SECTIONS */}
          {visibleModules.map((module) => (
            <ModulePreviewSection
              key={module.id}
              module={module}
              assetUrls={assetUrls}
            />
          ))}

          {/* 14. TRACEABILITY MATRIX */}
          <TraceabilityPreviewSection traceabilitySummary={traceabilitySummary} />

          {/* 15. OPEN ITEMS, APPROVALS & APPENDIX A */}
          <OpenItemsPreviewSection fsd={fsd} />
        </main>
      </div>
    </div>
  );
}
