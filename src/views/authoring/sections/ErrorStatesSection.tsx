import { useState } from 'react';
import type { FsdDocument, FsdModule, ErrorState, SectionState } from '../../../core/types';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';

interface ErrorStatesSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function ErrorStatesSection({
  fsd,
  module,
  onUpdateModule,
}: ErrorStatesSectionProps) {
  // Error State modal
  const [errModalOpen, setErrModalOpen] = useState(false);
  const [editingErrIndex, setEditingErrIndex] = useState<number | null>(null);
  const [errName, setErrName] = useState('');
  const [errDesc, setErrDesc] = useState('');
  const [errTrigger, setErrTrigger] = useState('');
  const [errUserMessage, setErrUserMessage] = useState('');
  const [errRecovery, setErrRecovery] = useState('');

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        errorStates: state,
      },
    });
  };

  const handleOpenAddErr = () => {
    setEditingErrIndex(null);
    setErrName('');
    setErrDesc('');
    setErrTrigger('');
    setErrUserMessage('');
    setErrRecovery('');
    setErrModalOpen(true);
  };

  const handleOpenEditErr = (index: number) => {
    const err = module.errorStates[index];
    setEditingErrIndex(index);
    setErrName(err.name);
    setErrDesc(err.description);
    setErrTrigger(err.trigger);
    setErrUserMessage(err.userMessage);
    setErrRecovery(err.recovery);
    setErrModalOpen(true);
  };

  const handleSaveErr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errName.trim()) return;

    const seq = editingErrIndex !== null ? editingErrIndex + 1 : module.errorStates.length + 1;
    const prefix = fsd.idConvention.prefix ? `${fsd.idConvention.prefix}-` : '';
    const generatedId =
      editingErrIndex !== null
        ? module.errorStates[editingErrIndex].id
        : `ERR-${prefix}${module.code}-${String(seq).padStart(2, '0')}`;

    const newErr: ErrorState = {
      id: generatedId,
      name: errName.trim(),
      description: errDesc.trim(),
      trigger: errTrigger.trim(),
      userMessage: errUserMessage.trim(),
      recovery: errRecovery.trim(),
      relatedRequirementIds: [],
    };

    const updated = [...module.errorStates];
    if (editingErrIndex !== null) updated[editingErrIndex] = newErr;
    else updated.push(newErr);

    onUpdateModule({
      ...module,
      errorStates: updated,
      sectionStates: {
        ...module.sectionStates,
        errorStates: module.sectionStates.errorStates === 'empty' ? 'in-progress' : module.sectionStates.errorStates,
      },
    });
    setErrModalOpen(false);
  };

  const handleDeleteErr = (index: number) => {
    const updated = [...module.errorStates];
    updated.splice(index, 1);
    onUpdateModule({ ...module, errorStates: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">7. Error Handling & UI States</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.errorStates}
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
            onClick={handleOpenAddErr}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Error State
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.errorStates === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.errorStates === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.errorStates.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada kondisi error state yang didefinisikan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-32">Error ID</th>
                  <th className="py-2.5 px-3 font-semibold w-44">Nama Kondisi Error</th>
                  <th className="py-2.5 px-3 font-semibold">Pemicu (Trigger)</th>
                  <th className="py-2.5 px-3 font-semibold w-64">Pesan Layar (User Message)</th>
                  <th className="py-2.5 px-3 font-semibold w-64">Tindakan Pemulihan (Recovery)</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {module.errorStates.map((err, idx) => (
                  <tr key={err.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{err.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{err.name}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{err.trigger || '—'}</td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">{err.userMessage || '—'}</td>
                    <td className="py-2.5 px-3">{err.recovery || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => handleOpenEditErr(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteErr(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer">
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

      {/* Modal: Error State */}
      <Modal isOpen={errModalOpen} onClose={() => setErrModalOpen(false)} title="Error Handling & UI State">
        <form onSubmit={handleSaveErr} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kondisi Error <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kredensial Tidak Cocok"
              value={errName}
              onChange={(e) => setErrName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pemicu Error (Trigger)</label>
            <input
              type="text"
              placeholder="Contoh: Password salah dimasukkan atau email belum terdaftar"
              value={errTrigger}
              onChange={(e) => setErrTrigger(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan Layar (User Message)</label>
            <input
              type="text"
              placeholder="Contoh: Email atau kata sandi salah. Silakan coba lagi."
              value={errUserMessage}
              onChange={(e) => setErrUserMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-rose-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tindakan Pemulihan (Recovery)</label>
            <input
              type="text"
              placeholder="Contoh: Tampilkan link Lupa Password dan fokuskan kursor ke input password"
              value={errRecovery}
              onChange={(e) => setErrRecovery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setErrModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Error State
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

