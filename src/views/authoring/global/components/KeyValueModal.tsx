import { useState, useEffect } from 'react';
import type { ReferenceItem } from '../../../../core/types';
import { Modal } from '../../../../components/Modal';

interface KeyValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  labelTitle: string;
  labelPlaceholder: string;
  valueTitle?: string;
  valuePlaceholder?: string;
  initialItem?: ReferenceItem | null;
  onSave: (item: ReferenceItem) => void;
}

export function KeyValueModal({
  isOpen,
  onClose,
  title,
  labelTitle,
  labelPlaceholder,
  valueTitle = 'Nilai / Penjelasan / Target',
  valuePlaceholder = 'Deskripsi atau parameter...',
  initialItem = null,
  onSave,
}: KeyValueModalProps) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (initialItem) {
      setLabel(initialItem.label || '');
      setValue(initialItem.value || '');
    } else {
      setLabel('');
      setValue('');
    }
  }, [initialItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      value: value.trim(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {labelTitle} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={labelPlaceholder}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {valueTitle} <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder={valuePlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}

