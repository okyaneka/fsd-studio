export function SectionStateBadge({ state }: { state: string }) {
  if (state === 'complete') {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
        Lengkap
      </span>
    );
  }
  if (state === 'tbd') {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
        TBD
      </span>
    );
  }
  if (state === 'not-applicable') {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
        N/A
      </span>
    );
  }
  return null;
}

export function NotApplicableNotice({ sectionName }: { sectionName: string }) {
  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 my-2">
      <span className="font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded mr-2 text-[10px]">
        Not Applicable
      </span>
      Seksi <strong>{sectionName}</strong> telah ditandai sebagai tidak berlaku untuk modul ini.
    </div>
  );
}

export function TbdNotice({ sectionName }: { sectionName: string }) {
  return (
    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 my-2">
      <span className="font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded mr-2 text-[10px]">
        To Be Determined (TBD)
      </span>
      Seksi <strong>{sectionName}</strong> sedang dalam perumusan dan akan dilengkapi pada iterasi berikutnya.
    </div>
  );
}

export function EmptyNotice({ sectionName }: { sectionName: string }) {
  return (
    <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded text-xs text-slate-400 italic my-2">
      Belum ada konten yang didefinisikan untuk {sectionName}.
    </div>
  );
}

