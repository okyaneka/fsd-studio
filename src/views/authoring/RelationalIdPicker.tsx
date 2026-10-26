export interface RelationalOption {
  id: string;
  label: string;
  badge?: string;
}

interface RelationalIdPickerProps {
  title: string;
  description?: string;
  options: RelationalOption[];
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
  emptyMessage?: string;
}

export function RelationalIdPicker({
  title,
  description,
  options,
  selectedIds,
  onChange,
  emptyMessage = 'Belum ada artefak yang tersedia untuk ditautkan.',
}: RelationalIdPickerProps) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {title}{' '}
          {selectedIds.length > 0 && (
            <span className="text-blue-600 font-bold">({selectedIds.length} dipilih)</span>
          )}
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Hapus Semua Pilihan
          </button>
        )}
      </div>

      {description && <p className="text-[11px] text-slate-500">{description}</p>}

      {options.length === 0 ? (
        <div className="p-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400 italic">
          {emptyMessage}
        </div>
      ) : (
        <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
          {options.map((opt) => {
            const isChecked = selectedIds.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer select-none ${
                  isChecked ? 'bg-blue-50/60 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(opt.id)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-mono text-[11px] font-bold text-slate-700 shrink-0">
                  {opt.id}
                </span>
                <span className="truncate flex-1">{opt.label}</span>
                {opt.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                    {opt.badge}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

