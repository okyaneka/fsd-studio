import { useState } from 'react';
import type {
  FsdDocument,
  FsdModule,
  FunctionalRequirement,
  RequirementStatus,
  SectionState,
} from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { REQUIREMENT_STATUSES } from '../../../core/constants';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { RelationalIdPicker } from '../RelationalIdPicker';

interface RequirementsSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function RequirementsSection({
  fsd,
  module,
  onUpdateModule,
}: RequirementsSectionProps) {
  // Requirement modal
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [editingReqIndex, setEditingReqIndex] = useState<number | null>(null);
  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqStatus, setReqStatus] = useState<RequirementStatus>('Draft');
  const [reqPriority, setReqPriority] = useState<FunctionalRequirement['priority']>('Must');
  const [reqFlowIds, setReqFlowIds] = useState<string[]>([]);
  const [reqScreenIds, setReqScreenIds] = useState<string[]>([]);
  const [reqAcIds, setReqAcIds] = useState<string[]>([]);

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        requirements: state,
      },
    });
  };

  const handleOpenAddReq = () => {
    setEditingReqIndex(null);
    setReqName('');
    setReqDesc('');
    setReqStatus('Draft');
    setReqPriority('Must');
    setReqFlowIds([]);
    setReqScreenIds([]);
    setReqAcIds([]);
    setReqModalOpen(true);
  };

  const handleOpenEditReq = (index: number) => {
    const r = module.requirements[index];
    setEditingReqIndex(index);
    setReqName(r.name);
    setReqDesc(r.description);
    setReqStatus(r.status);
    setReqPriority(r.priority);
    setReqFlowIds(r.flowIds || []);
    setReqScreenIds(r.screenIds || []);
    setReqAcIds(r.acceptanceCriteriaIds || []);
    setReqModalOpen(true);
  };

  const handleSaveReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim()) return;

    const seq = editingReqIndex !== null ? editingReqIndex + 1 : module.requirements.length + 1;
    const generatedId =
      editingReqIndex !== null
        ? module.requirements[editingReqIndex].id
        : createArtifactId('requirement', module.code, seq, undefined, fsd.idConvention);

    const newReq: FunctionalRequirement = {
      id: generatedId,
      name: reqName.trim(),
      description: reqDesc.trim(),
      status: reqStatus,
      priority: reqPriority,
      flowIds: reqFlowIds,
      screenIds: reqScreenIds,
      acceptanceCriteriaIds: reqAcIds,
    };

    const updatedReqs = [...module.requirements];
    if (editingReqIndex !== null) updatedReqs[editingReqIndex] = newReq;
    else updatedReqs.push(newReq);

    // Sinkronkan dua arah ke Acceptance Criteria
    const updatedAc = module.acceptanceCriteria.map((ac) => {
      const isSelected = reqAcIds.includes(ac.id);
      const hasReqId = ac.requirementIds?.includes(generatedId);
      if (isSelected && !hasReqId) {
        return { ...ac, requirementIds: [...(ac.requirementIds || []), generatedId] };
      }
      if (!isSelected && hasReqId) {
        return { ...ac, requirementIds: (ac.requirementIds || []).filter((id) => id !== generatedId) };
      }
      return ac;
    });

    onUpdateModule({
      ...module,
      requirements: updatedReqs,
      acceptanceCriteria: updatedAc,
      sectionStates: {
        ...module.sectionStates,
        requirements: module.sectionStates.requirements === 'empty' ? 'in-progress' : module.sectionStates.requirements,
      },
    });
    setReqModalOpen(false);
  };

  const handleDeleteReq = (index: number) => {
    const updated = [...module.requirements];
    updated.splice(index, 1);
    onUpdateModule({ ...module, requirements: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">3. Functional Requirements</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.requirements}
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
            onClick={handleOpenAddReq}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Requirement
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.requirements === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.requirements === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.requirements.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">
            Belum ada Functional Requirement yang didefinisikan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-32">Req ID</th>
                  <th className="py-2.5 px-3 font-semibold w-56">Kebutuhan Fungsional</th>
                  <th className="py-2.5 px-3 font-semibold">Deskripsi & Perilaku Sistem</th>
                  <th className="py-2.5 px-3 font-semibold w-24">Prioritas</th>
                  <th className="py-2.5 px-3 font-semibold w-28">Status</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {module.requirements.map((req, rIdx) => {
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{req.id}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{req.name}</div>
                      </td>
                      <td className="py-2.5 px-3 leading-relaxed whitespace-break-spaces">{req.description || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          req.priority === 'Must'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : req.priority === 'Should'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditReq(rIdx)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Edit Requirement"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReq(rIdx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            title="Hapus Requirement"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Requirement */}
      <Modal isOpen={reqModalOpen} onClose={() => setReqModalOpen(false)} title="Functional Requirement" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveReq} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Requirement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Otentikasi Email dan Password"
              value={reqName}
              onChange={(e) => setReqName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Perilaku Sistem</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kebutuhan fungsional secara rinci..."
              value={reqDesc}
              onChange={(e) => setReqDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas (MoSCoW)</label>
              <select
                value={reqPriority}
                onChange={(e) => setReqPriority(e.target.value as FunctionalRequirement['priority'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Must">Must Have</option>
                <option value="Should">Should Have</option>
                <option value="Could">Could Have</option>
                <option value="Won't">Won't Have</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={reqStatus}
                onChange={(e) => setReqStatus(e.target.value as RequirementStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {REQUIREMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Relational Pickers for Traceability */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <RelationalIdPicker
              title="Tautkan ke Alur Proses (Flow)"
              description="Pilih alur proses bisnis yang mengimplementasikan requirement ini."
              options={module.flows.map((f) => ({ id: f.id, label: f.name }))}
              selectedIds={reqFlowIds}
              onChange={setReqFlowIds}
              emptyMessage="Belum ada Alur Proses di modul ini."
            />

            <RelationalIdPicker
              title="Tautkan ke Layar / Wireframe (Screen)"
              description="Pilih layar tampilan UI tempat requirement ini ditampilkan ke pengguna."
              options={module.screens.map((s) => ({ id: s.id, label: s.name }))}
              selectedIds={reqScreenIds}
              onChange={setReqScreenIds}
              emptyMessage="Belum ada Layar Wireframe di modul ini."
            />

            <RelationalIdPicker
              title="Tautkan ke Acceptance Criteria (AC)"
              description="Pilih kriteria pengujian Given-When-Then yang memvalidasi requirement ini."
              options={module.acceptanceCriteria.map((a) => ({ id: a.id, label: a.name }))}
              selectedIds={reqAcIds}
              onChange={setReqAcIds}
              emptyMessage="Belum ada Acceptance Criteria di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setReqModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Requirement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

