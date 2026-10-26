import { useState, useMemo } from 'react';
import type { FsdDocument, FsdModule, Flow, FlowStep, SectionState } from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon, DuplicateIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { SectionStatusBadge } from '../components/SectionStatusBadge';

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
    if (selectedFlowFeatureFilter === '__none__') return module.flows.filter((f) => !f.feature);
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

  // Modal states for Duplicate Flow
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [sourceFlow, setSourceFlow] = useState<Flow | null>(null);
  const [duplicateFlowName, setDuplicateFlowName] = useState('');
  const [duplicateFlowFeature, setDuplicateFlowFeature] = useState('');

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

  const handleOpenDuplicateFlow = (flow: Flow) => {
    setSourceFlow(flow);
    setDuplicateFlowName(`${flow.name} (Copy)`);
    setDuplicateFlowFeature(flow.feature || '');
    setDuplicateModalOpen(true);
  };

  const handleConfirmDuplicateFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceFlow || !duplicateFlowName.trim()) return;

    const newSeq = module.flows.length + 1;
    let generatedId = createArtifactId(
      'flow',
      module.code,
      newSeq,
      duplicateFlowName.trim(),
      fsd.idConvention
    );

    // Pastikan tidak ada duplikasi ID jika namanya menghasilkan slug yang sama
    if (module.flows.some((f) => f.id === generatedId)) {
      let counter = 2;
      while (module.flows.some((f) => f.id === `${generatedId}-${counter}`)) {
        counter++;
      }
      generatedId = `${generatedId}-${counter}`;
    }

    const trimmedFeature = duplicateFlowFeature.trim() || undefined;
    const currentFeatures = module.features || [];
    const nextFeatures =
      trimmedFeature && !currentFeatures.includes(trimmedFeature)
        ? [...currentFeatures, trimmedFeature]
        : currentFeatures;

    // Duplikasi langkah-langkah alur secara mendalam (deep copy)
    const duplicatedSteps: FlowStep[] = (sourceFlow.steps || []).map((step) => ({
      order: step.order,
      actor: step.actor,
      action: step.action,
      systemResponse: step.systemResponse,
      requirementIds: [...(step.requirementIds || [])],
    }));

    const duplicatedFlow: Flow = {
      id: generatedId,
      name: duplicateFlowName.trim(),
      description: sourceFlow.description,
      notes: sourceFlow.notes,
      steps: duplicatedSteps,
      alternativePaths: (sourceFlow.alternativePaths || []).map((ap) => ({ ...ap })),
      feature: trimmedFeature,
    };

    onUpdateModule({
      ...module,
      flows: [...module.flows, duplicatedFlow],
      features: nextFeatures,
      sectionStates: {
        ...module.sectionStates,
        flows: module.sectionStates.flows === 'empty' ? 'in-progress' : module.sectionStates.flows,
      },
    });

    setDuplicateModalOpen(false);
    setSourceFlow(null);
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">1. Process Flows</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
          <SectionStatusBadge
            status={module.sectionStates.flows}
            onChange={(newStatus) => {
              onUpdateModule({
                ...module,
                sectionStates: {
                  ...module.sectionStates,
                  flows: newStatus,
                },
              });
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Kategori (Select View) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 whitespace-nowrap">Kategori:</span>
            <select
              value={selectedFlowFeatureFilter}
              onChange={(e) => setSelectedFlowFeatureFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700 min-w-[140px]"
            >
              <option value="all">Semua Kategori ({module.flows.length})</option>
              {allFeatures.map((feat) => {
                const count = module.flows.filter((f) => f.feature === feat).length;
                return (
                  <option key={feat} value={feat}>
                    {feat} ({count})
                  </option>
                );
              })}
              {module.flows.some((f) => !f.feature) && (
                <option value="__none__">
                  Tanpa Kategori ({module.flows.filter((f) => !f.feature).length})
                </option>
              )}
            </select>
          </div>

          {/* Action Buttons: Tambah Kategori di samping Tambah Flow */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddFeatureModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Tambah Kategori Fitur Alur Baru"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Tambah Flow</span>
            </button>
          </div>
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
                  <div className='flex flex-col gap-1'>
                    <h4 className="text-sm font-bold text-slate-900">{flow.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {flow.id}
                      </span>
                      {flow.feature && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                          {flow.feature}
                        </span>
                      )}
                    </div>
                    {flow.description && <p className="text-xs text-slate-600">{flow.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDuplicateFlow(flow)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                      title="Duplikat Flow"
                    >
                      <DuplicateIcon className="w-4 h-4" />
                    </button>
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

      {/* Modal: Duplikat Flow */}
      <Modal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        title="Duplikat Alur Proses"
        description={`Menduplikasi alur "${sourceFlow?.name}" beserta seluruh ${sourceFlow?.steps?.length || 0} langkahnya.`}
      >
        <form onSubmit={handleConfirmDuplicateFlow} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Alur Proses Baru <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Login Pengguna Admin"
              value={duplicateFlowName}
              onChange={(e) => setDuplicateFlowName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Kode alur proses baru akan digenerate secara otomatis berdasarkan nama ini.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori / Fitur Alur
            </label>
            <select
              value={duplicateFlowFeature}
              onChange={(e) => setDuplicateFlowFeature(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tanpa Kategori (Umum)</option>
              {allFeatures.map((feat) => (
                <option key={feat} value={feat}>
                  {feat}
                </option>
              ))}
              {duplicateFlowFeature && !allFeatures.includes(duplicateFlowFeature) && (
                <option value={duplicateFlowFeature}>{duplicateFlowFeature}</option>
              )}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDuplicateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Duplikat Alur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

