import { useState } from 'react';
import type {
  FsdDocument,
  FsdModule,
  AcceptanceCriterion,
  SectionState,
} from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { RelationalIdPicker } from '../RelationalIdPicker';
import { SectionStatusBadge } from '../components/SectionStatusBadge';

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
  // Acceptance Criteria modal (1 AC = 1 Scenario: Given-When-Then)
  const [acModalOpen, setAcModalOpen] = useState(false);
  const [editingAcIndex, setEditingAcIndex] = useState<number | null>(null);
  const [acName, setAcName] = useState('');
  const [acDesc, setAcDesc] = useState('');
  const [acGiven, setAcGiven] = useState('');
  const [acWhen, setAcWhen] = useState('');
  const [acThen, setAcThen] = useState('');
  const [acReqIds, setAcReqIds] = useState<string[]>([]);

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
    setAcGiven('');
    setAcWhen('');
    setAcThen('');
    setAcReqIds([]);
    setAcModalOpen(true);
  };

  const handleOpenEditAc = (index: number) => {
    const ac = module.acceptanceCriteria[index];
    setEditingAcIndex(index);
    setAcName(ac.name);
    setAcDesc(ac.description || '');
    setAcReqIds(ac.requirementIds || []);

    const givenVal =
      ac.given ??
      (ac.scenarios && ac.scenarios[0] ? ac.scenarios[0].given.join('\n') : '');
    const whenVal =
      ac.when ??
      (ac.scenarios && ac.scenarios[0] ? ac.scenarios[0].when : '');
    const thenVal =
      ac.then ??
      (ac.scenarios && ac.scenarios[0] ? ac.scenarios[0].then.join('\n') : '');

    setAcGiven(givenVal);
    setAcWhen(whenVal);
    setAcThen(thenVal);
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

    const trimmedGiven = acGiven.trim();
    const trimmedWhen = acWhen.trim();
    const trimmedThen = acThen.trim();

    const newAc: AcceptanceCriterion = {
      id: generatedId,
      name: acName.trim(),
      description: acDesc.trim(),
      given: trimmedGiven,
      when: trimmedWhen,
      then: trimmedThen,
      requirementIds: acReqIds,
      scenarios: [
        {
          title: acName.trim(),
          given: trimmedGiven ? trimmedGiven.split('\n').map((g) => g.trim()).filter(Boolean) : [],
          when: trimmedWhen,
          then: trimmedThen ? trimmedThen.split('\n').map((t) => t.trim()).filter(Boolean) : [],
        },
      ],
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
          <SectionStatusBadge
            status={module.sectionStates.acceptanceCriteria}
            onChange={(newStatus) => updateSectionState(newStatus)}
          />
        </div>

        <div className="flex items-center gap-3">
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
              const givenText = ac.given || (ac.scenarios?.[0]?.given?.join('\n') ?? '');
              const whenText = ac.when || (ac.scenarios?.[0]?.when ?? '');
              const thenText = ac.then || (ac.scenarios?.[0]?.then?.join('\n') ?? '');

              return (
                <div key={ac.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {ac.id}
                        </span>
                        {ac.requirementIds && ac.requirementIds.length > 0 && (
                          <span className="text-[10px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Terkait: {ac.requirementIds.join(', ')}
                          </span>
                        )}
                      </div>
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

                  {/* Given - When - Then Card Display */}
                  <div className="bg-white rounded-lg p-3.5 border border-slate-200 text-xs space-y-1.5 font-mono text-[11px]">
                    {givenText && (
                      <div className="text-slate-700">
                        <strong className="text-blue-700 font-sans font-bold text-xs mr-2">GIVEN:</strong>
                        <span className="whitespace-pre-line font-mono">{givenText}</span>
                      </div>
                    )}
                    {whenText && (
                      <div className="text-slate-700">
                        <strong className="text-amber-700 font-sans font-bold text-xs mr-2">WHEN:</strong>
                        <span className="whitespace-pre-line font-mono">{whenText}</span>
                      </div>
                    )}
                    {thenText && (
                      <div className="text-slate-700">
                        <strong className="text-emerald-700 font-sans font-bold text-xs mr-2">THEN:</strong>
                        <span className="whitespace-pre-line font-mono">{thenText}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Acceptance Criterion (1 AC = 1 Scenario) */}
      <Modal isOpen={acModalOpen} onClose={() => setAcModalOpen(false)} title="Acceptance Criterion (Given-When-Then)" maxWidth="max-w-xl">
        <form onSubmit={handleSaveAc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Skenario / Kriteria <span className="text-red-500">*</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Keterangan tambahan untuk skenario ini..."
              value={acDesc}
              onChange={(e) => setAcDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* GIVEN textarea */}
          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1">
              GIVEN <span className="font-normal text-slate-500">(Kondisi Awal / Prasyarat)</span> <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: Pengguna memiliki akun aktif dan berada pada halaman Login"
              value={acGiven}
              onChange={(e) => setAcGiven(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* WHEN textarea */}
          <div>
            <label className="block text-xs font-bold text-amber-700 mb-1">
              WHEN <span className="font-normal text-slate-500">(Aksi Pengguna / Pemicu Kejadian)</span> <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: Pengguna memasukkan email dan password yang valid lalu menekan Masuk"
              value={acWhen}
              onChange={(e) => setAcWhen(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* THEN textarea */}
          <div>
            <label className="block text-xs font-bold text-emerald-700 mb-1">
              THEN <span className="font-normal text-slate-500">(Hasil / Respon yang Diharapkan)</span> <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: Sistem mengautentikasi dan mengarahkan pengguna ke halaman Dashboard"
              value={acThen}
              onChange={(e) => setAcThen(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
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
