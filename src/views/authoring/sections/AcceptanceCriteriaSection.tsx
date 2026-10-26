import { useState } from 'react';
import type {
  FsdDocument,
  FsdModule,
  AcceptanceCriterion,
  GivenWhenThenScenario,
  SectionState,
} from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { RelationalIdPicker } from '../RelationalIdPicker';

interface AcceptanceCriteriaSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function AcceptanceCriteriaSection({
  fsd,
  module,
  onUpdateModule,
}: AcceptanceCriteriaSectionProps) {
  // Acceptance Criteria modal (Given-When-Then)
  const [acModalOpen, setAcModalOpen] = useState(false);
  const [editingAcIndex, setEditingAcIndex] = useState<number | null>(null);
  const [acName, setAcName] = useState('');
  const [acDesc, setAcDesc] = useState('');
  const [acReqIds, setAcReqIds] = useState<string[]>([]);
  const [acScenarios, setAcScenarios] = useState<GivenWhenThenScenario[]>([
    {
      title: 'Happy Path - Berhasil',
      given: ['pengguna berada pada halaman utama yang valid'],
      when: 'pengguna menekan tombol konfirmasi transaksi',
      then: ['sistem memvalidasi parameter input', 'sistem menampilkan pesan sukses'],
    },
  ]);

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        acceptanceCriteria: state,
      },
    });
  };

  const handleOpenAddAc = () => {
    setEditingAcIndex(null);
    setAcName('');
    setAcDesc('');
    setAcReqIds([]);
    setAcScenarios([
      {
        title: 'Happy Path - Berhasil',
        given: ['pengguna berada pada halaman utama yang valid'],
        when: 'pengguna menekan tombol konfirmasi transaksi',
        then: ['sistem memvalidasi parameter input', 'sistem menampilkan pesan sukses'],
      },
    ]);
    setAcModalOpen(true);
  };

  const handleOpenEditAc = (index: number) => {
    const ac = module.acceptanceCriteria[index];
    setEditingAcIndex(index);
    setAcName(ac.name);
    setAcDesc(ac.description);
    setAcReqIds(ac.requirementIds || []);
    setAcScenarios(
      ac.scenarios && ac.scenarios.length > 0
        ? ac.scenarios.map((s) => ({ ...s, title: s.title || '' }))
        : [{ title: '', given: [''], when: '', then: [''] }]
    );
    setAcModalOpen(true);
  };

  const handleSaveAc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acName.trim()) return;

    const seq = editingAcIndex !== null ? editingAcIndex + 1 : module.acceptanceCriteria.length + 1;
    const generatedId =
      editingAcIndex !== null
        ? module.acceptanceCriteria[editingAcIndex].id
        : createArtifactId('acceptanceCriterion', module.code, seq, undefined, fsd.idConvention);

    const newAc: AcceptanceCriterion = {
      id: generatedId,
      name: acName.trim(),
      description: acDesc.trim(),
      requirementIds: acReqIds,
      scenarios: acScenarios,
    };

    const updatedAc = [...module.acceptanceCriteria];
    if (editingAcIndex !== null) updatedAc[editingAcIndex] = newAc;
    else updatedAc.push(newAc);

    // Sinkronkan dua arah ke requirements
    const updatedReqs = module.requirements.map((req) => {
      const isSelected = acReqIds.includes(req.id);
      const hasAcId = req.acceptanceCriteriaIds?.includes(generatedId);
      if (isSelected && !hasAcId) {
        return { ...req, acceptanceCriteriaIds: [...(req.acceptanceCriteriaIds || []), generatedId] };
      }
      if (!isSelected && hasAcId) {
        return {
          ...req,
          acceptanceCriteriaIds: (req.acceptanceCriteriaIds || []).filter((id) => id !== generatedId),
        };
      }
      return req;
    });

    onUpdateModule({
      ...module,
      acceptanceCriteria: updatedAc,
      requirements: updatedReqs,
      sectionStates: {
        ...module.sectionStates,
        acceptanceCriteria:
          module.sectionStates.acceptanceCriteria === 'empty' ? 'in-progress' : module.sectionStates.acceptanceCriteria,
      },
    });
    setAcModalOpen(false);
  };

  const handleDeleteAc = (index: number) => {
    const updated = [...module.acceptanceCriteria];
    updated.splice(index, 1);
    onUpdateModule({ ...module, acceptanceCriteria: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">9. Acceptance Criteria (GWT)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.acceptanceCriteria}
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
            onClick={handleOpenAddAc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Kriteria (GWT)
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.acceptanceCriteria === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.acceptanceCriteria === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.acceptanceCriteria.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">
            Belum ada Acceptance Criteria yang didefinisikan.
          </p>
        ) : (
          <div className="space-y-4">
            {module.acceptanceCriteria.map((ac, acIdx) => {
              return (
                <div key={ac.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ac.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{ac.name}</h4>
                      {ac.description && <p className="text-xs text-slate-500 mt-0.5">{ac.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAc(acIdx)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        title="Edit Acceptance Criteria"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAc(acIdx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Hapus Acceptance Criteria"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scenarios (Given-When-Then) */}
                  {ac.scenarios && ac.scenarios.length > 0 && (
                    <div className="space-y-3">
                      {ac.scenarios.map((sc, sIdx) => (
                        <div key={sIdx} className="bg-white rounded-lg p-3.5 border border-slate-200 text-xs space-y-2">
                          <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
                            <span>
                              {sc.title ? `Skenario #${sIdx + 1}: ${sc.title}` : `Skenario #${sIdx + 1}`}
                            </span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            {sc.given.map((g, gIdx) => (
                              <div key={gIdx} className="text-slate-700">
                                <strong className="text-blue-700">{gIdx === 0 ? 'GIVEN' : 'AND'}</strong> {g}
                              </div>
                            ))}
                            <div className="text-slate-700">
                              <strong className="text-amber-700">WHEN</strong> {sc.when}
                            </div>
                            {sc.then.map((t, tIdx) => (
                              <div key={tIdx} className="text-slate-700">
                                <strong className="text-emerald-700">{tIdx === 0 ? 'THEN' : 'AND'}</strong> {t}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Acceptance Criterion */}
      <Modal isOpen={acModalOpen} onClose={() => setAcModalOpen(false)} title="Acceptance Criterion (Given-When-Then)" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveAc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Acceptance Criterion <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="Contoh: Sukses Login dengan Kredensial Valid"
              value={acName}
              onChange={(e) => setAcName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Skenario Given–When–Then</label>
              <button
                type="button"
                onClick={() =>
                  setAcScenarios([
                    ...acScenarios,
                    { title: '', given: [''], when: '', then: [''] },
                  ])
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah Skenario
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto p-1">
              {acScenarios.map((sc, scIdx) => (
                <div key={scIdx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-700 border-b border-slate-200 pb-1">
                    <span>Skenario #{scIdx + 1}</span>
                    {acScenarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...acScenarios];
                          updated.splice(scIdx, 1);
                          setAcScenarios(updated);
                        }}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  {/* Scenario title input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Nama / Judul Skenario
                    </label>
                    <input
                      type="text"
                      placeholder={`Contoh: Happy Path, Password Salah, Akun Terkunci...`}
                      value={sc.title || ''}
                      onChange={(e) => {
                        const updated = [...acScenarios];
                        updated[scIdx].title = e.target.value;
                        setAcScenarios(updated);
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Given inputs */}
                  <div className="space-y-1">
                    <span className="font-bold text-blue-700 block">GIVEN:</span>
                    {sc.given.map((gVal, gIdx) => (
                      <div key={gIdx} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Kondisi awal..."
                          value={gVal}
                          onChange={(e) => {
                            const updated = [...acScenarios];
                            updated[scIdx].given[gIdx] = e.target.value;
                            setAcScenarios(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                        />
                        {sc.given.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...acScenarios];
                              updated[scIdx].given.splice(gIdx, 1);
                              setAcScenarios(updated);
                            }}
                            className="text-slate-400 hover:text-red-600 px-1 cursor-pointer"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...acScenarios];
                        updated[scIdx].given.push('');
                        setAcScenarios(updated);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      + Tambah GIVEN / AND
                    </button>
                  </div>

                  {/* When input */}
                  <div>
                    <span className="font-bold text-amber-700 block mb-0.5">WHEN:</span>
                    <input
                      type="text"
                      required
                      placeholder="Aksi pemicu oleh pengguna..."
                      value={sc.when}
                      onChange={(e) => {
                        const updated = [...acScenarios];
                        updated[scIdx].when = e.target.value;
                        setAcScenarios(updated);
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                    />
                  </div>

                  {/* Then inputs */}
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-700 block">THEN:</span>
                    {sc.then.map((tVal, tIdx) => (
                      <div key={tIdx} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Hasil / respon yang diharapkan..."
                          value={tVal}
                          onChange={(e) => {
                            const updated = [...acScenarios];
                            updated[scIdx].then[tIdx] = e.target.value;
                            setAcScenarios(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                        />
                        {sc.then.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...acScenarios];
                              updated[scIdx].then.splice(tIdx, 1);
                              setAcScenarios(updated);
                            }}
                            className="text-slate-400 hover:text-red-600 px-1 cursor-pointer"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...acScenarios];
                        updated[scIdx].then.push('');
                        setAcScenarios(updated);
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                    >
                      + Tambah THEN / AND
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang diuji atau divalidasi oleh skenario acceptance criteria ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={acReqIds}
              onChange={setAcReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAcModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Kriteria
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

