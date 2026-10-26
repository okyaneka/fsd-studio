import { useState } from 'react';
import type { FsdDocument, FsdModule, NonFunctionalRequirement, SectionState } from '../../../core/types';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';

interface NfrsSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function NfrsSection({
  fsd,
  module,
  onUpdateModule,
}: NfrsSectionProps) {
  // NFR modal
  const [nfrModalOpen, setNfrModalOpen] = useState(false);
  const [editingNfrIndex, setEditingNfrIndex] = useState<number | null>(null);
  const [nfrName, setNfrName] = useState('');
  const [nfrCategory, setNfrCategory] = useState('Performance');
  const [nfrMeasure, setNfrMeasure] = useState('');
  const [nfrDesc, setNfrDesc] = useState('');

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        nfrs: state,
      },
    });
  };

  const handleOpenAddNfr = () => {
    setEditingNfrIndex(null);
    setNfrName('');
    setNfrCategory('Security');
    setNfrMeasure('');
    setNfrDesc('');
    setNfrModalOpen(true);
  };

  const handleOpenEditNfr = (index: number) => {
    const n = module.nfrs[index];
    setEditingNfrIndex(index);
    setNfrName(n.name);
    setNfrCategory(n.category);
    setNfrMeasure(n.measure);
    setNfrDesc(n.description);
    setNfrModalOpen(true);
  };

  const handleSaveNfr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfrName.trim() || !nfrMeasure.trim()) return;

    const seq = editingNfrIndex !== null ? editingNfrIndex + 1 : module.nfrs.length + 1;
    const prefix = fsd.idConvention.prefix ? `${fsd.idConvention.prefix}-` : '';
    const generatedId =
      editingNfrIndex !== null
        ? module.nfrs[editingNfrIndex].id
        : `NFR-${prefix}${module.code}-${String(seq).padStart(2, '0')}`;

    const newNfr: NonFunctionalRequirement = {
      id: generatedId,
      name: nfrName.trim(),
      category: nfrCategory.trim(),
      measure: nfrMeasure.trim(),
      description: nfrDesc.trim(),
    };

    const updated = [...module.nfrs];
    if (editingNfrIndex !== null) updated[editingNfrIndex] = newNfr;
    else updated.push(newNfr);

    onUpdateModule({
      ...module,
      nfrs: updated,
      sectionStates: {
        ...module.sectionStates,
        nfrs: module.sectionStates.nfrs === 'empty' ? 'in-progress' : module.sectionStates.nfrs,
      },
    });
    setNfrModalOpen(false);
  };

  const handleDeleteNfr = (index: number) => {
    const updated = [...module.nfrs];
    updated.splice(index, 1);
    onUpdateModule({ ...module, nfrs: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">8. Security & NFR</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.nfrs}
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
            onClick={handleOpenAddNfr}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah NFR
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.nfrs === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.nfrs === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.nfrs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada Non-Functional Requirement.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-32">NFR ID</th>
                  <th className="py-2.5 px-3 font-semibold w-40">Kategori</th>
                  <th className="py-2.5 px-3 font-semibold w-48">Kebutuhan NFR</th>
                  <th className="py-2.5 px-3 font-semibold">Ukuran / Metrik Target</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {module.nfrs.map((nfr, idx) => (
                  <tr key={nfr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{nfr.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{nfr.category}</td>
                    <td className="py-2.5 px-3">{nfr.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{nfr.measure}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => handleOpenEditNfr(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteNfr(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer">
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

      {/* Modal: NFR */}
      <Modal isOpen={nfrModalOpen} onClose={() => setNfrModalOpen(false)} title="Security & NFR">
        <form onSubmit={handleSaveNfr} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori NFR</label>
              <select
                value={nfrCategory}
                onChange={(e) => setNfrCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Security">Security</option>
                <option value="Performance">Performance</option>
                <option value="Reliability">Reliability</option>
                <option value="Availability">Availability</option>
                <option value="Compliance">Compliance</option>
                <option value="Usability">Usability</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kebutuhan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Waktu Respon Login"
                value={nfrName}
                onChange={(e) => setNfrName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Metrik Target / SLA <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: < 500 ms p95 pada 1000 concurrent user"
              value={nfrMeasure}
              onChange={(e) => setNfrMeasure(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Ruang Uji</label>
            <textarea
              rows={2}
              value={nfrDesc}
              onChange={(e) => setNfrDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setNfrModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan NFR
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

