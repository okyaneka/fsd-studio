import { DownloadIcon, LayersIcon } from './Icons';

interface NavbarProps {
  onGoHome: () => void;
  onOpenBackup: () => void;
}

export function Navbar({ onGoHome, onOpenBackup }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition-colors">
            <LayersIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-200 transition-colors">
                FSD Studio
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Functional Specification Authoring</p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenBackup}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Backup & Restore</span>
            <span className="sm:hidden">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
}

