import { useState, useMemo } from 'react';
import type { FsdDocument, FsdModule, Flow, FlowStep, SectionState } from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';

interface FlowsSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function FlowsSection({ fsd, module, onUpdateModule }: FlowsSectionProps) {
  // Flow feature grouping & filter states
  const [selectedFlowFeatureFilter, setSelectedFlowFeatureFilter] = useState<string>('all');
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');

  // Collect all known features for flows in this module
  const allFeatures = useMemo(() => {
    const list = [...(module.features || [])];
    const set = new Set<string>(list);
    module.flows.forEach((f) => f.feature?.trim() && set.add(f.feature.trim()));
    return Array.from(set);
  }, [module.features, module.flows]);

  const displayedFlows = useMemo(() => {
    if (selectedFlowFeatureFilter === 'all') return module.flows;
    return module.flows.filter((f) => f.feature === selectedFlowFeatureFilter);
  }, [module.flows, selectedFlowFeatureFilter]);

  const handleAddNewFeature = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFeatureName.trim();
    if (!trimmed) return;
    if (!allFeatures.includes(trimmed)) {
      onUpdateModule({
        ...module,
        features: [...(module.features || []), trimmed],
      });
    }
    setNewFeatureName('');
    setIsAddFeatureModalOpen(false);
    setSelectedFlowFeatureFilter(trimmed);
    setFlowFeature(trimmed);
  };

  // Modal feature state
  const [flowFeature, setFlowFeature] = useState('');

  // Modal states for Flow
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDesc, setFlowDesc] = useState('');
  const [flowNotes, setFlowNotes] = useState('');
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        flows: state,
      },
    });
  };

  const handleOpenAddFlow = () => {
    setEditingFlowIndex(null);
    setFlowName('');
    setFlowDesc('');
    setFlowNotes('');
    setFlowFeature(selectedFlowFeatureFilter !== 'all' ? selectedFlowFeatureFilter : (allFeatures[0] || ''));
    setFlowSteps([
      { order: 1, actor: 'User', action: '', systemResponse: '', requirementIds: [] },
    ]);
    setFlowModalOpen(true);
  };

  const handleOpenEditFlow = (index: number) => {
    const f = module.flows[index];
    setEditingFlowIndex(index);
    setFlowName(f.name);
    setFlowDesc(f.description);
    setFlowNotes(f.notes || '');
    setFlowFeature(f.feature || '');
    setFlowSteps(f.steps.length ? f.steps : [{ order: 1, actor: 'User', action: '', systemResponse: '', requirementIds: [] }]);
    setFlowModalOpen(true);
  };

  const handleSaveFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim()) return;

    const seq = editingFlowIndex !== null ? editingFlowIndex + 1 : module.flows.length + 1;
    const generatedId =
      editingFlowIndex !== null
        ? module.flows[editingFlowIndex].id
        : createArtifactId('flow', module.code, seq, flowName.trim(), fsd.idConvention);

    const trimmedFeature = flowFeature.trim() || undefined;
    const currentFeatures = module.features || [];
    const nextFeatures =
      trimmedFeature && !currentFeatures.includes(trimmedFeature)
        ? [...currentFeatures, trimmedFeature]
        : currentFeatures;

    const newFlow: Flow = {
      id: generatedId,
      name: flowName.trim(),
      description: flowDesc.trim(),
      notes: flowNotes.trim(),
      steps: flowSteps,
      alternativePaths: [],
      feature: trimmedFeature,
    };

    const updated = [...module.flows];
    if (editingFlowIndex !== null) updated[editingFlowIndex] = newFlow;
    else updated.push(newFlow);

    onUpdateModule({
      ...module,
      flows: updated,
      features: nextFeatures,
      sectionStates: {
        ...module.sectionStates,
        flows: module.sectionStates.flows === 'empty' ? 'in-progress' : module.sectionStates.flows,
      },
    });
    setFlowModalOpen(false);
  };

  const handleDeleteFlow = (index: number) => {
    const updated = [...module.flows];
    updated.splice(index, 1);
    onUpdateModule({ ...module, flows: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">1. Process Flows</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.flows}
              onChange={(e) => updateSectionState(e.target.value as SectionState)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="empty">Kosong (Empty)</option>
              <option value="in-progress">In-Progress</option>
              <option value="complete">Selesai (Complete)</option>
              <option value="tbd">TBD (To Be Decided)</option>
              <option value="not-applicable">Not Applicable (N/A)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenAddFlow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Flow
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.flows === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.flows === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Feature Filter Bar khusus untuk Alur Proses */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap mr-1">
            Kategori Fitur:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFlowFeatureFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedFlowFeatureFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua Alur ({module.flows.length})
          </button>
          {allFeatures.map((feat) => (
            <button
              key={feat}
              type="button"
              onClick={() => setSelectedFlowFeatureFilter(feat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedFlowFeatureFilter === feat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {feat}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsAddFeatureModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Tambah Kategori Fitur</span>
        </button>
      </div>

      {displayedFlows.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 italic text-center">
          Belum ada alur proses {selectedFlowFeatureFilter !== 'all' ? `untuk fitur "${selectedFlowFeatureFilter}"` : ''} yang didefinisikan.
        </p>
      ) : (
        <div className="space-y-4">
          {displayedFlows.map((flow) => {
            const actualIdx = module.flows.findIndex((f) => f.id === flow.id);
            return (
              <div key={flow.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {flow.id}
                      </span>
                      {flow.feature && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          Fitur: {flow.feature}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{flow.name}</h4>
                    {flow.description && <p className="text-xs text-slate-600 mt-0.5">{flow.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditFlow(actualIdx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Edit Flow"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlow(actualIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                      title="Hapus Flow"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Steps table */}
                {flow.steps && flow.steps.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <th className="py-2 px-3 font-semibold w-16">Step</th>
                          <th className="py-2 px-3 font-semibold w-32">Aktor</th>
                          <th className="py-2 px-3 font-semibold">Aksi Pengguna</th>
                          <th className="py-2 px-3 font-semibold">Respon Sistem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {flow.steps.map((st, sIdx) => (
                          <tr key={sIdx}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-500">{st.order}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{st.actor}</td>
                            <td className="py-2 px-3">{st.action}</td>
                            <td className="py-2 px-3">{st.systemResponse}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {flow.notes && (
                  <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded border border-slate-200">
                    Catatan: {flow.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Flow */}
      <Modal isOpen={flowModalOpen} onClose={() => setFlowModalOpen(false)} title="Process Flow" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveFlow} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Alur Proses <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                required
                placeholder="Contoh: Login Pengguna Biasa"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kategori / Fitur Alur
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddFeatureModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  + Kategori Baru
                </button>
              </div>
              <select
                value={flowFeature}
                onChange={(e) => setFlowFeature(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tanpa Kategori (Umum)</option>
                {allFeatures.map((feat) => (
                  <option key={feat} value={feat}>
                    {feat}
                  </option>
                ))}
                {flowFeature && !allFeatures.includes(flowFeature) && (
                  <option value={flowFeature}>{flowFeature}</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
            <input
              type="text"
              placeholder="Penjelasan singkat alur proses bisnis"
              value={flowDesc}
              onChange={(e) => setFlowDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Langkah Alur (Steps)</label>
              <button
                type="button"
                onClick={() =>
                  setFlowSteps([
                    ...flowSteps,
                    { order: flowSteps.length + 1, actor: 'User', action: '', systemResponse: '', requirementIds: [] },
                  ])
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah Langkah
              </button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {flowSteps.map((st, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-500 w-5 text-center">{st.order}</span>
                  <input
                    type="text"
                    placeholder="Aktor"
                    value={st.actor}
                    onChange={(e) => {
                      const updated = [...flowSteps];
                      updated[idx].actor = e.target.value;
                      setFlowSteps(updated);
                    }}
                    className="w-24 px-2 py-1 bg-white border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Aksi Pengguna"
                    value={st.action}
                    onChange={(e) => {
                      const updated = [...flowSteps];
                      updated[idx].action = e.target.value;
                      setFlowSteps(updated);
                    }}
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Respon Sistem"
                    value={st.systemResponse}
                    onChange={(e) => {
                      const updated = [...flowSteps];
                      updated[idx].systemResponse = e.target.value;
                      setFlowSteps(updated);
                    }}
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...flowSteps];
                      updated.splice(idx, 1);
                      updated.forEach((s, i) => (s.order = i + 1));
                      setFlowSteps(updated);
                    }}
                    className="text-slate-400 hover:text-red-600 px-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={flowNotes}
              onChange={(e) => setFlowNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFlowModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Flow
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Tambah Fitur Baru */}
      <Modal
        isOpen={isAddFeatureModalOpen}
        onClose={() => setIsAddFeatureModalOpen(false)}
        title="Tambah Fitur Baru"
        description="Fitur ini akan tersedia sebagai kategori pengelompokan alur proses, layar wireframe, kebutuhan fungsional, dan acceptance criteria."
      >
        <form onSubmit={handleAddNewFeature} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Fitur <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Login, Registrasi, Forgot Password, Logout"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddFeatureModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Fitur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

