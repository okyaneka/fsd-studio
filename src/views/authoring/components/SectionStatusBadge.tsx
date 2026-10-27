import type { SectionState } from '../../../core/types';
import { ChevronDownIcon } from '../../../components/Icons';

interface SectionStatusBadgeProps {
  status: SectionState;
  onChange: (newStatus: SectionState) => void;
}

const STATUS_CONFIG: Record<
  SectionState,
  { label: string; bg: string; text: string; border: string }
> = {
  empty: {
    label: 'Kosong (Empty)',
    bg: 'bg-slate-100 hover:bg-slate-200/80',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  'in-progress': {
    label: 'In-Progress',
    bg: 'bg-amber-100 hover:bg-amber-200/80',
    text: 'text-amber-900',
    border: 'border-amber-300',
  },
  complete: {
    label: 'Selesai (Complete)',
    bg: 'bg-emerald-100 hover:bg-emerald-200/80',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
  },
  tbd: {
    label: 'TBD (To Be Decided)',
    bg: 'bg-orange-100 hover:bg-orange-200/80',
    text: 'text-orange-900',
    border: 'border-orange-300',
  },
  'not-applicable': {
    label: 'Not Applicable (N/A)',
    bg: 'bg-rose-100 hover:bg-rose-200/80',
    text: 'text-rose-900',
    border: 'border-rose-300',
  },
};

export function SectionStatusBadge({ status, onChange }: SectionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;

  return (
    <div className="relative inline-flex items-center mt-2 group">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as SectionState)}
        className={`appearance-none cursor-pointer pl-3 pr-7 py-1 text-xs font-semibold rounded-full border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${config.bg} ${config.text} ${config.border}`}
        title="Klik untuk mengubah status subbagian"
      >
        <option value="empty" className="bg-white text-slate-700 font-medium">● Kosong (Empty)</option>
        <option value="in-progress" className="bg-white text-amber-800 font-medium">● In-Progress</option>
        <option value="complete" className="bg-white text-emerald-800 font-medium">● Selesai (Complete)</option>
        <option value="tbd" className="bg-white text-orange-800 font-medium">● TBD (To Be Decided)</option>
        <option value="not-applicable" className="bg-white text-rose-800 font-medium">● Not Applicable (N/A)</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
        <ChevronDownIcon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
