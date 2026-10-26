import { useState } from 'react';
import type { FsdDocument, ReferenceItem } from '../../../../core/types';
import { EditIcon, TrashIcon } from '../../../../components/Icons';
import { TagListEditor } from '../components/TagListEditor';
import { KeyValueModal } from '../components/KeyValueModal';

interface OverviewScopeEditorProps {
  overview: FsdDocument['overview'];
  onChange: (updated: Partial<FsdDocument['overview']>) => void;
}

export function OverviewScopeEditor({ overview, onChange }: OverviewScopeEditorProps) {
  // Success Outcomes Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [editingSuccessIndex, setEditingSuccessIndex] = useState<number | null>(null);

  // Definitions Modal State
  const [isDefModalOpen, setIsDefModalOpen] = useState(false);
  const [editingDefIndex, setEditingDefIndex] = useState<number | null>(null);

  // In-Scope handlers
  const handleAddInScope = (item: string) => {
    onChange({ inScope: [...overview.inScope, item] });
  };
  const handleRemoveInScope = (index: number) => {
    const list = [...overview.inScope];
    list.splice(index, 1);
    onChange({ inScope: list });
  };

  // Out-of-Scope handlers
  const handleAddOutScope = (item: string) => {
    onChange({ outOfScope: [...overview.outOfScope, item] });
  };
  const handleRemoveOutScope = (index: number) => {
    const list = [...overview.outOfScope];
    list.splice(index, 1);
    onChange({ outOfScope: list });
  };

  // Success Outcomes handlers
  const handleOpenAddSuccess = () => {
    setEditingSuccessIndex(null);
    setIsSuccessModalOpen(true);
  };
  const handleOpenEditSuccess = (index: number) => {
    setEditingSuccessIndex(index);
    setIsSuccessModalOpen(true);
  };
  const handleSaveSuccess = (item: ReferenceItem) => {
    const list = [...overview.successOutcomes];
    if (editingSuccessIndex !== null) {
      list[editingSuccessIndex] = item;
    } else {
      list.push(item);
    }
    onChange({ successOutcomes: list });
    setIsSuccessModalOpen(false);
  };
  const handleDeleteSuccess = (index: number) => {
    const list = [...overview.successOutcomes];
    list.splice(index, 1);
    onChange({ successOutcomes: list });
  };

  // Definitions handlers
  const handleOpenAddDef = () => {
    setEditingDefIndex(null);
    setIsDefModalOpen(true);
  };
  const handleOpenEditDef = (index: number) => {
    setEditingDefIndex(index);
    setIsDefModalOpen(true);
  };
  const handleSaveDef = (item: ReferenceItem) => {
    const list = [...overview.definitions];
    if (editingDefIndex !== null) {
      list[editingDefIndex] = item;
    } else {
      list.push(item);
    }
    onChange({ definitions: list });
    setIsDefModalOpen(false);
  };
  const handleDeleteDef = (index: number) => {
    const list = [...overview.definitions];
    list.splice(index, 1);
    onChange({ definitions: list });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
        1. Gambaran Umum & Ruang Lingkup (Overview & Scope)
      </h3>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Tujuan Dokumen / Sasaran Bisnis (Objective)
        </label>
        <textarea
          rows={3}
          placeholder="Jelaskan tujuan utama yang ingin dicapai melalui fungsionalitas dalam FSD ini..."
          value={overview.objective}
          onChange={(e) => onChange({ objective: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagListEditor
          title="In-Scope (Fitur Masuk Cakupan)"
          placeholder="Tambah butir in-scope..."
          items={overview.inScope}
          onAdd={handleAddInScope}
          onRemove={handleRemoveInScope}
          theme="emerald"
        />
        <TagListEditor
          title="Out-of-Scope (Batas Cakupan)"
          placeholder="Tambah butir out-of-scope..."
          items={overview.outOfScope}
          onAdd={handleAddOutScope}
          onRemove={handleRemoveOutScope}
          theme="rose"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        {/* Success Outcomes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Ukuran Keberhasilan (Success Outcomes)
            </label>
            <button
              type="button"
              onClick={handleOpenAddSuccess}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              + Tambah
            </button>
          </div>
          {overview.successOutcomes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada target keberhasilan.</p>
          ) : (
            <div className="space-y-2">
              {overview.successOutcomes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{item.label}</div>
                    <div className="text-slate-600 mt-0.5">{item.value}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSuccess(idx)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSuccess(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Definitions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Glosarium & Definisi Istilah
            </label>
            <button
              type="button"
              onClick={handleOpenAddDef}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              + Tambah
            </button>
          </div>
          {overview.definitions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada definisi istilah.</p>
          ) : (
            <div className="space-y-2">
              {overview.definitions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between gap-2"
                >
                  <div>
                    <div className="font-mono font-semibold text-slate-800">{item.label}</div>
                    <div className="text-slate-600 mt-0.5">{item.value}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditDef(idx)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDef(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Success Outcomes */}
      <KeyValueModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Ukuran Keberhasilan"
        labelTitle="Nama / Target"
        labelPlaceholder="Contoh: Conversion Rate, SLA Response"
        initialItem={editingSuccessIndex !== null ? overview.successOutcomes[editingSuccessIndex] : null}
        onSave={handleSaveSuccess}
      />

      {/* Modal: Definitions */}
      <KeyValueModal
        isOpen={isDefModalOpen}
        onClose={() => setIsDefModalOpen(false)}
        title="Definisi Istilah"
        labelTitle="Istilah / Akronim"
        labelPlaceholder="Contoh: OTP, KYC, SLA"
        initialItem={editingDefIndex !== null ? overview.definitions[editingDefIndex] : null}
        onSave={handleSaveDef}
      />
    </div>
  );
}

