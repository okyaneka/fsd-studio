import { useState } from 'react';
import type {
  FsdDocument,
  FsdModule,
  ValidationRule,
  ValidationRuleItem,
  SectionState,
} from '../../../core/types';
import { createArtifactId } from '../../../core/schema';
import { PlusIcon, TrashIcon, EditIcon, XMarkIcon } from '../../../components/Icons';
import { Modal } from '../../../components/Modal';
import { RelationalIdPicker } from '../RelationalIdPicker';

interface ValidationsSectionProps {
  fsd: FsdDocument;
  module: FsdModule;
  onUpdateModule: (updatedModule: FsdModule) => void;
}

export function ValidationsSection({
  fsd,
  module,
  onUpdateModule,
}: ValidationsSectionProps) {
  // Validation Rule modal
  const [valModalOpen, setValModalOpen] = useState(false);
  const [editingValIndex, setEditingValIndex] = useState<number | null>(null);
  const [valField, setValField] = useState('');
  const [valName, setValName] = useState('');
  const [valRules, setValRules] = useState<Array<{ rule: string; value: string; errorMessage: string }>>([
    { rule: '', value: '', errorMessage: '' },
  ]);
  const [valReqIds, setValReqIds] = useState<string[]>([]);

  const updateSectionState = (state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        validations: state,
      },
    });
  };

  const handleOpenAddVal = () => {
    setEditingValIndex(null);
    setValField('');
    setValName('');
    setValRules([{ rule: '', value: '', errorMessage: '' }]);
    setValReqIds([]);
    setValModalOpen(true);
  };

  const handleOpenEditVal = (index: number) => {
    const v = module.validations[index];
    setEditingValIndex(index);
    setValField(v.field);
    setValName(v.name);
    if (v.rules && v.rules.length > 0) {
      setValRules(
        v.rules.map((r) => ({
          rule: r.rule || '',
          value: r.value || '',
          errorMessage: r.errorMessage || (r as unknown as { error_message?: string }).error_message || '',
        }))
      );
    } else {
      setValRules([
        { rule: v.condition || '', value: '', errorMessage: v.message || '' },
      ]);
    }
    setValReqIds(v.relatedRequirementIds || []);
    setValModalOpen(true);
  };

  const handleAddValRuleRow = () => {
    setValRules((prev) => [...prev, { rule: '', value: '', errorMessage: '' }]);
  };

  const handleRemoveValRuleRow = (rIndex: number) => {
    setValRules((prev) => {
      const updated = prev.filter((_, idx) => idx !== rIndex);
      return updated.length > 0 ? updated : [{ rule: '', value: '', errorMessage: '' }];
    });
  };

  const handleValRuleChange = (
    rIndex: number,
    field: 'rule' | 'value' | 'errorMessage',
    val: string
  ) => {
    setValRules((prev) => {
      const updated = [...prev];
      updated[rIndex] = { ...updated[rIndex], [field]: val };
      return updated;
    });
  };

  const handleSaveVal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valField.trim()) return;

    const cleanedRules: ValidationRuleItem[] = valRules
      .map((r) => ({
        rule: r.rule.trim(),
        value: r.value.trim() ? r.value.trim() : undefined,
        errorMessage: r.errorMessage.trim(),
      }))
      .filter((r) => r.rule || r.errorMessage);

    if (cleanedRules.length === 0) return;

    const seq = editingValIndex !== null ? editingValIndex + 1 : module.validations.length + 1;
    const generatedId =
      editingValIndex !== null
        ? module.validations[editingValIndex].id
        : createArtifactId('validation', module.code, seq, valField.trim(), fsd.idConvention);

    const derivedCondition = cleanedRules
      .map((r) => `${r.rule}${r.value ? ` (${r.value})` : ''}`)
      .join(', ');
    const derivedMessage = cleanedRules
      .map((r) => r.errorMessage)
      .filter(Boolean)
      .join(' | ');

    const newVal: ValidationRule = {
      id: generatedId,
      field: valField.trim(),
      name: valName.trim() || `Validasi ${valField.trim()}`,
      description: '',
      condition: derivedCondition,
      message: derivedMessage,
      rules: cleanedRules,
      relatedRequirementIds: valReqIds,
    };

    const updated = [...module.validations];
    if (editingValIndex !== null) updated[editingValIndex] = newVal;
    else updated.push(newVal);

    onUpdateModule({
      ...module,
      validations: updated,
      sectionStates: {
        ...module.sectionStates,
        validations: module.sectionStates.validations === 'empty' ? 'in-progress' : module.sectionStates.validations,
      },
    });
    setValModalOpen(false);
  };

  const handleDeleteVal = (index: number) => {
    const updated = [...module.validations];
    updated.splice(index, 1);
    onUpdateModule({ ...module, validations: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Header & Status Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">5. Data & Validation Rules</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian wajib standar spesifikasi fungsional FSD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status Subbagian:</span>
            <select
              value={module.sectionStates.validations}
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
            onClick={handleOpenAddVal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Validasi
          </button>
        </div>
      </div>

      {/* Explicit N/A or TBD Notice */}
      {module.sectionStates.validations === 'not-applicable' && (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
        </div>
      )}
      {module.sectionStates.validations === 'tbd' && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-4">
        {module.validations.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada aturan validasi data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-32">Validation ID</th>
                  <th className="py-2.5 px-3 font-semibold w-40">Nama Field</th>
                  <th className="py-2.5 px-3 font-semibold">Kondisi / Aturan Validasi</th>
                  <th className="py-2.5 px-3 font-semibold w-64">Pesan Error ke Pengguna</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {module.validations.map((val, idx) => (
                  <tr key={val.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{val.id}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{val.field}</td>
                    <td className="py-2.5 px-3 leading-relaxed">
                      {val.rules && val.rules.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {val.rules.map((r, i) => (
                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                              <span className="font-semibold text-slate-800">{r.rule}</span>
                              {r.value && <span className="text-slate-500 ml-1">({r.value})</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        val.condition
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-red-600 font-mono text-[11px]">
                      {val.rules && val.rules.length > 0 ? (
                        <div className="space-y-0.5">
                          {val.rules.map((r, i) => (
                            <div key={i}>{r.errorMessage || '—'}</div>
                          ))}
                        </div>
                      ) : (
                        val.message
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => handleOpenEditVal(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteVal(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer">
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

      {/* Modal: Validation */}
      <Modal isOpen={valModalOpen} onClose={() => setValModalOpen(false)} title="Validation Rule" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveVal} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Field / Input <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                required
                placeholder="Contoh: email, password"
                value={valField}
                onChange={(e) => setValField(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Label Validasi</label>
              <input
                type="text"
                placeholder="Contoh: Format Email"
                value={valName}
                onChange={(e) => setValName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Daftar Aturan Validasi (Rules) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddValRuleRow}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Tambah Rule
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {valRules.map((ruleRow, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Rule #{rIdx + 1}
                    </span>
                    {valRules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveValRuleRow(rIdx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Hapus rule ini"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Rule Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: required, email"
                        value={ruleRow.rule}
                        onChange={(e) => handleValRuleChange(rIdx, 'rule', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Value / Parameter <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 8, RFC 5322"
                        value={ruleRow.value}
                        onChange={(e) => handleValRuleChange(rIdx, 'value', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Error Message
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Email wajib diisi"
                        value={ruleRow.errorMessage}
                        onChange={(e) => handleValRuleChange(rIdx, 'errorMessage', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-red-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleAddValRuleRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Tambah Rule
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang mewajibkan aturan validasi ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={valReqIds}
              onChange={setValReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setValModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Validasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

