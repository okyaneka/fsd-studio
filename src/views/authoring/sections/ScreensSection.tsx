import { useState } from 'react';
import type { FsdDocument, FsdModule, Screen, ScreenAnnotation, SectionState } from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { WireframeAssetViewer } from '../WireframeAssetViewer';
import { SectionStatusBadge } from '../components/SectionStatusBadge';

interface ScreensSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  projectId: string;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function ScreensSection({
  fsd,
  module,
  projectId,
  onUpdateModule,
}: ScreensSectionProps) {
  // Screen modal
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [editingScreenIndex, setEditingScreenIndex] = useState<number | null>(null);
  const [screenName, setScreenName] = useState('');
  const [screenDesc, setScreenDesc] = useState('');
  const [screenAssetId, setScreenAssetId] = useState<string | null>(null);
  const [screenCaption, setScreenCaption] = useState('');
  const [screenAlt, setScreenAlt] = useState('');
  const [screenOrientation, setScreenOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [screenAnnotations, setScreenAnnotations] = useState<ScreenAnnotation[]>([]);
  const [annotationInput, setAnnotationInput] = useState('');

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        screens: state,
      },
    });
  };

  const handleOpenAddScreen = () => {
    setEditingScreenIndex(null);
    setScreenName('');
    setScreenDesc('');
    setScreenAssetId(null);
    setScreenCaption('');
    setScreenAlt('');
    setScreenOrientation('auto');
    setScreenAnnotations([]);
    setAnnotationInput('');
    setScreenModalOpen(true);
  };

  const handleOpenEditScreen = (index: number) => {
    const s = module.screens[index];
    setEditingScreenIndex(index);
    setScreenName(s.name);
    setScreenDesc(s.description);
    setScreenAssetId(s.wireframeAssetId);
    setScreenCaption(s.imageCaption || '');
    setScreenAlt(s.imageAlt || '');
    setScreenOrientation(s.orientation);
    setScreenAnnotations(s.annotations || []);
    setAnnotationInput('');
    setScreenModalOpen(true);
  };

  const handleAddAnnotation = () => {
    if (!annotationInput.trim()) return;
    const nextNum = screenAnnotations.length + 1;
    setScreenAnnotations([
      ...screenAnnotations,
      { number: nextNum, text: annotationInput.trim(), requirementIds: [], validationIds: [] },
    ]);
    setAnnotationInput('');
  };

  const handleRemoveAnnotation = (idx: number) => {
    const updated = [...screenAnnotations];
    updated.splice(idx, 1);
    // Renumber
    updated.forEach((a, i) => (a.number = i + 1));
    setScreenAnnotations(updated);
  };

  const handleSaveScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenName.trim()) return;

    const seq = editingScreenIndex !== null ? editingScreenIndex + 1 : module.screens.length + 1;
    const generatedId =
      editingScreenIndex !== null
        ? module.screens[editingScreenIndex].id
        : createArtifactId('screen', module.code, seq, screenName.trim(), fsd.idConvention);

    const newScreen: Screen = {
      id: generatedId,
      name: screenName.trim(),
      description: screenDesc.trim(),
      wireframeAssetId: screenAssetId,
      imageCaption: screenCaption.trim(),
      imageAlt: screenAlt.trim(),
      orientation: screenOrientation,
      annotations: screenAnnotations,
    };

    const updated = [...module.screens];
    if (editingScreenIndex !== null) updated[editingScreenIndex] = newScreen;
    else updated.push(newScreen);

    onUpdateModule({
      ...module,
      screens: updated,
      sectionStates: {
        ...module.sectionStates,
        screens: module.sectionStates.screens === 'empty' ? 'in-progress' : module.sectionStates.screens,
      },
    });
    setScreenModalOpen(false);
  };

  const handleDeleteScreen = (index: number) => {
    const updated = [...module.screens];
    updated.splice(index, 1);
    onUpdateModule({ ...module, screens: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">2. UI & Lo-Fi Wireframes</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
          <SectionStatusBadge
            status={module.sectionStates.screens}
            onChange={(newStatus) => {
              onUpdateModule({
                ...module,
                sectionStates: {
                  ...module.sectionStates,
                  screens: newStatus,
                },
              });
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAddScreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Layar / Wireframe
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.screens === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.screens === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.screens.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">
            Belum ada wireframe layar yang didaftarkan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {module.screens.map((screen, sIdx) => {
              return (
                <div key={screen.id} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {screen.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{screen.name}</h4>
                      {screen.description && <p className="text-xs text-slate-500 mt-0.5">{screen.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditScreen(sIdx)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        title="Edit Layar"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScreen(sIdx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Hapus Layar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Screen Wireframe Asset View */}
                  <WireframeAssetViewer
                    assetId={screen.wireframeAssetId}
                    projectId={projectId}
                    fsdId={fsd.id}
                    moduleId={module.id}
                    screenId={screen.id}
                    onAssetChanged={(newAssetId) => {
                      const updatedScreens = [...module.screens];
                      updatedScreens[sIdx] = {
                        ...updatedScreens[sIdx],
                        wireframeAssetId: newAssetId,
                      };
                      onUpdateModule({ ...module, screens: updatedScreens });
                    }}
                  />

                  {screen.imageCaption && (
                    <p className="text-xs text-slate-600 italic text-center">Caption: "{screen.imageCaption}"</p>
                  )}

                  {/* Annotations */}
                  {screen.annotations && screen.annotations.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Anotasi Layar ({screen.annotations.length}):
                      </div>
                      <ul className="space-y-1">
                        {screen.annotations.map((ann, aIdx) => (
                          <li key={aIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {ann.number}
                            </span>
                            <span>{ann.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Screen */}
      <Modal isOpen={screenModalOpen} onClose={() => setScreenModalOpen(false)} title="Layar / Wireframe Lo-Fi" maxWidth="max-w-xl">
        <form onSubmit={handleSaveScreen} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Layar <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Halaman Login"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Layar</label>
            <input
              type="text"
              placeholder="Keterangan fungsi tampilan layar ini"
              value={screenDesc}
              onChange={(e) => setScreenDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Wireframe Asset Viewer & Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gambar Wireframe Lo-Fi</label>
            <WireframeAssetViewer
              assetId={screenAssetId}
              projectId={projectId}
              fsdId={fsd.id}
              moduleId={module.id}
              screenId={editingScreenIndex !== null ? module.screens[editingScreenIndex].id : 'temp-screen'}
              onAssetChanged={(newAssetId) => setScreenAssetId(newAssetId)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Caption Gambar</label>
              <input
                type="text"
                placeholder="Contoh: Gambar 1: Form Login"
                value={screenCaption}
                onChange={(e) => setScreenCaption(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alt Text</label>
              <input
                type="text"
                placeholder="Deskripsi aksesibilitas"
                value={screenAlt}
                onChange={(e) => setScreenAlt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Anotasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Daftar Anotasi Bernomor</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ketik anotasi dan tekan +"
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAnnotation();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddAnnotation}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                +
              </button>
            </div>
            <ul className="space-y-1 max-h-36 overflow-y-auto">
              {screenAnnotations.map((ann, aIdx) => (
                <li key={aIdx} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                      {ann.number}
                    </span>
                    <span>{ann.text}</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveAnnotation(aIdx)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setScreenModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Layar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

