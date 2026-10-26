import { useState } from 'react';
import { TrashIcon } from '../../../../components/Icons';

interface TagListEditorProps {
  title: string;
  placeholder: string;
  items: string[];
  colorTheme?: 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
  theme?: 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
  emptyText?: string;
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}

const themeStyles = {
  emerald: {
    label: 'text-emerald-800',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    item: 'bg-emerald-50/60 border-emerald-100 text-emerald-950',
  },
  rose: {
    label: 'text-rose-800',
    btn: 'bg-rose-600 hover:bg-rose-700',
    item: 'bg-rose-50/60 border-rose-100 text-rose-950',
  },
  amber: {
    label: 'text-amber-800',
    btn: 'bg-amber-600 hover:bg-amber-700',
    item: 'bg-amber-50/60 border-amber-100 text-amber-950',
  },
  blue: {
    label: 'text-blue-800',
    btn: 'bg-blue-600 hover:bg-blue-700',
    item: 'bg-blue-50/60 border-blue-100 text-blue-950',
  },
  slate: {
    label: 'text-slate-700',
    btn: 'bg-slate-700 hover:bg-slate-800',
    item: 'bg-slate-50 border-slate-200 text-slate-800',
  },
};

export function TagListEditor({
  title,
  placeholder,
  items,
  colorTheme,
  theme,
  emptyText = 'Belum ada item yang dicatat.',
  onAdd,
  onRemove,
}: TagListEditorProps) {
  const [inputVal, setInputVal] = useState('');
  const activeTheme = colorTheme || theme || 'slate';
  const style = themeStyles[activeTheme];

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputVal('');
  };

  return (
    <div className="space-y-2">
      <label className={`block text-xs font-semibold ${style.label}`}>
        {title}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className={`px-3 py-1.5 text-xs font-semibold text-white ${style.btn} rounded-lg transition-colors cursor-pointer`}
        >
          Tambah
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-center justify-between p-2 rounded border text-xs ${style.item}`}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                title="Hapus item"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
