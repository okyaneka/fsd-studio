import { useState } from 'react';
import type { FsdDocument, FsdModule, IntegrationRequirement, SectionState } from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { RelationalIdPicker } from '../RelationalIdPicker';

interface IntegrationsSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function IntegrationsSection({
  fsd,
  module,
  onUpdateModule,
}: IntegrationsSectionProps) {
  // Integration modal
  const [intModalOpen, setIntModalOpen] = useState(false);
  const [editingIntIndex, setEditingIntIndex] = useState<number | null>(null);
  const [intName, setIntName] = useState('');
  const [intDesc, setIntDesc] = useState('');
  const [intOwner, setIntOwner] = useState('');
  const [intInput, setIntInput] = useState('');
  const [intOutcome, setIntOutcome] = useState('');
  const [intReqIds, setIntReqIds] = useState<string[]>([]);

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        integrations: state,
      },
    });
  };

  const handleOpenAddInt = () => {
    setEditingIntIndex(null);
    setIntName('');
    setIntDesc('');
    setIntOwner('');
    setIntInput('');
    setIntOutcome('');
    setIntReqIds([]);
    setIntModalOpen(true);
  };

  const handleOpenEditInt = (index: number) => {
    const it = module.integrations[index];
    setEditingIntIndex(index);
    setIntName(it.name);
    setIntDesc(it.description);
    setIntOwner(it.owner);
    setIntInput(it.input);
    setIntOutcome(it.outcome);
    setIntReqIds(it.relatedRequirementIds || []);
    setIntModalOpen(true);
  };

  const handleSaveInt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intName.trim()) return;

    const seq = editingIntIndex !== null ? editingIntIndex + 1 : module.integrations.length + 1;
    const generatedId =
      editingIntIndex !== null
        ? module.integrations[editingIntIndex].id
        : createArtifactId('integration', module.code, seq, intName.trim(), fsd.idConvention);

    const newInt: IntegrationRequirement = {
      id: generatedId,
      name: intName.trim(),
      description: intDesc.trim(),
      owner: intOwner.trim(),
      input: intInput.trim(),
      outcome: intOutcome.trim(),
      relatedRequirementIds: intReqIds,
    };

    const updated = [...module.integrations];
    if (editingIntIndex !== null) updated[editingIntIndex] = newInt;
    else updated.push(newInt);

    onUpdateModule({
      ...module,
      integrations: updated,
      sectionStates: {
        ...module.sectionStates,
        integrations: module.sectionStates.integrations === 'empty' ? 'in-progress' : module.sectionStates.integrations,
      },
    });
    setIntModalOpen(false);
  };

  const handleDeleteInt = (index: number) => {
    const updated = [...module.integrations];
    updated.splice(index, 1);
    onUpdateModule({ ...module, integrations: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">6. Integration Requirements</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.integrations}
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
            onClick={handleOpenAddInt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Integrasi
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.integrations === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.integrations === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.integrations.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada integrasi sistem eksternal.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-32">Integration ID</th>
                  <th className="py-2.5 px-3 font-semibold w-48">Nama Integrasi</th>
                  <th className="py-2.5 px-3 font-semibold w-36">Owner / Service</th>
                  <th className="py-2.5 px-3 font-semibold">Input / Payload</th>
                  <th className="py-2.5 px-3 font-semibold">Outcome / Respon</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {module.integrations.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">{it.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{it.name}</td>
                    <td className="py-2.5 px-3">{it.owner || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{it.input || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{it.outcome || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => handleOpenEditInt(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteInt(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer">
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

      {/* Modal: Integration */}
      <Modal isOpen={intModalOpen} onClose={() => setIntModalOpen(false)} title="Integration Requirement">
        <form onSubmit={handleSaveInt} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Integrasi <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                required
                placeholder="Contoh: Single Sign-On Google OAuth"
                value={intName}
                onChange={(e) => setIntName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Service SA</label>
              <input
                type="text"
                placeholder="Contoh: Identity Provider Team"
                value={intOwner}
                onChange={(e) => setIntOwner(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Input / Payload Parameter</label>
            <textarea
              rows={2}
              placeholder="Contoh: auth_code, redirect_uri, client_id"
              value={intInput}
              onChange={(e) => setIntInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome / Respon Sistem</label>
            <textarea
              rows={2}
              placeholder="Contoh: Access Token JWT, user_id, email"
              value={intOutcome}
              onChange={(e) => setIntOutcome(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang memanfaatkan antarmuka / integrasi sistem ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={intReqIds}
              onChange={setIntReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIntModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Integrasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

