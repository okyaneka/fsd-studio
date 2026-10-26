import { useState } from 'react';
import type { FsdDocument, ReferenceItem } from '../../../../core/types';
import { EditIcon, TrashIcon } from '../../../../components/Icons';
import { TagListEditor } from '../components/TagListEditor';
import { KeyValueModal } from '../components/KeyValueModal';

interface BusinessContextEditorProps {
  businessContext: FsdDocument['businessContext'];
  onChange: (updated: Partial<FsdDocument['businessContext']>) => void;
}

export function BusinessContextEditor({
  businessContext,
  onChange,
}: BusinessContextEditorProps) {
  // Dependencies Modal State
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  const [editingDepIndex, setEditingDepIndex] = useState<number | null>(null);

  // Assumptions handlers
  const handleAddAssumption = (item: string) => {
    onChange({ assumptions: [...businessContext.assumptions, item] });
  };
  const handleRemoveAssumption = (index: number) => {
    const list = [...businessContext.assumptions];
    list.splice(index, 1);
    onChange({ assumptions: list });
  };

  // Dependencies handlers
  const handleOpenAddDep = () => {
    setEditingDepIndex(null);
    setIsDepModalOpen(true);
  };
  const handleOpenEditDep = (index: number) => {
    setEditingDepIndex(index);
    setIsDepModalOpen(true);
  };
  const handleSaveDep = (item: ReferenceItem) => {
    const list = [...businessContext.dependencies];
    if (editingDepIndex !== null) {
      list[editingDepIndex] = item;
    } else {
      list.push(item);
    }
    onChange({ dependencies: list });
    setIsDepModalOpen(false);
  };
  const handleDeleteDep = (index: number) => {
    const list = [...businessContext.dependencies];
    list.splice(index, 1);
    onChange({ dependencies: list });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
        2. Konteks Bisnis & Asumsi (Business Context)
      </h3>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Ringkasan Konteks Bisnis (Summary)
        </label>
        <textarea
          rows={3}
          placeholder="Jelaskan latar belakang bisnis, kondisi eksisting sistem, atau proses bisnis yang memicu kebutuhan ini..."
          value={businessContext.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagListEditor
          title="Asumsi Teknis & Bisnis (Assumptions)"
          placeholder="Tambah asumsi..."
          items={businessContext.assumptions}
          onAdd={handleAddAssumption}
          onRemove={handleRemoveAssumption}
          theme="slate"
        />

        {/* Dependencies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Ketergantungan Eksternal (Dependencies)
            </label>
            <button
              type="button"
              onClick={handleOpenAddDep}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              + Tambah
            </button>
          </div>
          {businessContext.dependencies.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada dependensi eksternal.</p>
          ) : (
            <div className="space-y-2">
              {businessContext.dependencies.map((item, idx) => (
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
                      onClick={() => handleOpenEditDep(idx)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDep(idx)}
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

      {/* Modal: Dependencies */}
      <KeyValueModal
        isOpen={isDepModalOpen}
        onClose={() => setIsDepModalOpen(false)}
        title="Dependensi Eksternal"
        labelTitle="Nama Sistem / Pihak Ketiga"
        labelPlaceholder="Contoh: Core Banking API, Payment Gateway"
        initialItem={editingDepIndex !== null ? businessContext.dependencies[editingDepIndex] : null}
        onSave={handleSaveDep}
      />
    </div>
  );
}

