import { useState } from 'react';
import type { FsdDocument, FsdModule, BusinessRule, SectionState } from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { RelationalIdPicker } from '../RelationalIdPicker';

interface BusinessRulesSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function BusinessRulesSection({
  fsd,
  module,
  onUpdateModule,
}: BusinessRulesSectionProps) {
  // Business Rule modal
  const [brModalOpen, setBrModalOpen] = useState(false);
  const [editingBrIndex, setEditingBrIndex] = useState<number | null>(null);
  const [brName, setBrName] = useState('');
  const [brDesc, setBrDesc] = useState('');
  const [brRationale, setBrRationale] = useState('');
  const [brReqIds, setBrReqIds] = useState<string[]>([]);

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        businessRules: state,
      },
    });
  };

  const handleOpenAddBr = () => {
    setEditingBrIndex(null);
    setBrName('');
    setBrDesc('');
    setBrRationale('');
    setBrReqIds([]);
    setBrModalOpen(true);
  };

  const handleOpenEditBr = (index: number) => {
    const br = module.businessRules[index];
    setEditingBrIndex(index);
    setBrName(br.name);
    setBrDesc(br.description);
    setBrRationale(br.rationale || '');
    setBrReqIds(br.relatedRequirementIds || []);
    setBrModalOpen(true);
  };

  const handleSaveBr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brName.trim()) return;

    const seq = editingBrIndex !== null ? editingBrIndex + 1 : module.businessRules.length + 1;
    const generatedId =
      editingBrIndex !== null
        ? module.businessRules[editingBrIndex].id
        : createArtifactId('businessRule', module.code, seq, undefined, fsd.idConvention);

    const newBr: BusinessRule = {
      id: generatedId,
      name: brName.trim(),
      description: brDesc.trim(),
      rationale: brRationale.trim(),
      relatedRequirementIds: brReqIds,
    };

    const updated = [...module.businessRules];
    if (editingBrIndex !== null) updated[editingBrIndex] = newBr;
    else updated.push(newBr);

    onUpdateModule({
      ...module,
      businessRules: updated,
      sectionStates: {
        ...module.sectionStates,
        businessRules: module.sectionStates.businessRules === 'empty' ? 'in-progress' : module.sectionStates.businessRules,
      },
    });
    setBrModalOpen(false);
  };

  const handleDeleteBr = (index: number) => {
    const updated = [...module.businessRules];
    updated.splice(index, 1);
    onUpdateModule({ ...module, businessRules: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">4. Business Rules</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.businessRules}
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
            onClick={handleOpenAddBr}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Aturan Bisnis
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.businessRules === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.businessRules === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.businessRules.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada Business Rule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-28">Rule ID</th>
                  <th className="py-2.5 px-3 font-semibold w-48">Nama Aturan Bisnis</th>
                  <th className="py-2.5 px-3 font-semibold">Deskripsi Aturan</th>
                  <th className="py-2.5 px-3 font-semibold w-64">Rasional Bisnis</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {module.businessRules.map((br, idx) => (
                  <tr key={br.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{br.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{br.name}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{br.description || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{br.rationale || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => handleOpenEditBr(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteBr(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer">
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

      {/* Modal: Business Rule */}
      <Modal isOpen={brModalOpen} onClose={() => setBrModalOpen(false)} title="Business Rule">
        <form onSubmit={handleSaveBr} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aturan Bisnis <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Penguncian Akun Setelah 5 Kali Gagal"
              value={brName}
              onChange={(e) => setBrName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Aturan</label>
            <textarea
              rows={2}
              value={brDesc}
              onChange={(e) => setBrDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rasional Bisnis / Alasan Kebijakan</label>
            <input
              type="text"
              placeholder="Contoh: Mencegah serangan brute-force dan pencurian kredensial"
              value={brRationale}
              onChange={(e) => setBrRationale(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang mendasari atau diatur oleh aturan bisnis ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={brReqIds}
              onChange={setBrReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setBrModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

