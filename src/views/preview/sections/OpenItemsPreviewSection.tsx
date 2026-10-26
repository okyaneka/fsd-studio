import type { FsdDocument } from '../../../core/types';

interface OpenItemsPreviewSectionProps {
  fsd: FsdDocument;
}

export function OpenItemsPreviewSection({ fsd }: OpenItemsPreviewSectionProps) {
  return (
    <section className="fsd-page section toc-target" id="open-items">
      <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-4 border-b-2 border-[#dceaf5]">
        15. Open Items & Approvals
      </h2>

      <h3 className="text-sm font-bold text-[#244b69] mt-4 mb-2">15.1 Open Items Register</h3>
      {fsd.openItems.length === 0 ? (
        <p className="text-xs text-slate-400 italic mb-6">Seluruh open items telah diselesaikan.</p>
      ) : (
        <table className="fsd-table mb-6">
          <thead>
            <tr>
              <th className="w-20">Item ID</th>
              <th>Deskripsi Isu / Pertanyaan</th>
              <th className="w-32">PIC / Owner</th>
              <th className="w-28">Target Selesai</th>
              <th className="w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {fsd.openItems.map((oi) => (
              <tr key={oi.id}>
                <td className="font-mono font-bold text-[#2e648e]">{oi.id}</td>
                <td>
                  <strong>{oi.name}</strong>
                  {oi.description && <p className="text-[11px] text-slate-600 mt-0.5">{oi.description}</p>}
                </td>
                <td>{oi.owner || '—'}</td>
                <td>{oi.dueDate || '—'}</td>
                <td>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      oi.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : oi.status === 'Accepted risk'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {oi.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="text-sm font-bold text-[#244b69] mt-6 mb-2">15.2 Formal Sign-Off Table</h3>
      <table className="fsd-table">
        <thead>
          <tr>
            <th className="w-36">Peran Sign-Off</th>
            <th>Tanggung Jawab</th>
            <th className="w-44">Nama Stakeholder</th>
            <th className="w-28">Status</th>
          </tr>
        </thead>
        <tbody>
          {fsd.approvals.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-slate-400 italic py-3">
                Belum ada peran sign-off approval yang dikonfigurasi.
              </td>
            </tr>
          ) : (
            fsd.approvals.map((app) => (
              <tr key={app.id}>
                <td className="font-semibold text-slate-800">{app.role}</td>
                <td>{app.responsibility || '—'}</td>
                <td>{app.person || '—'}</td>
                <td>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {app.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* APPENDIX A */}
      <div className="pt-6 border-t border-slate-200 mt-6 toc-target" id="appendix">
        <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-3 border-b-2 border-[#dceaf5]">
          Appendix A. API Handoff Checklist
        </h2>
        {fsd.apiHandoffChecklist.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Tidak ada item checklist serah terima API.</p>
        ) : (
          <table className="fsd-table">
            <thead>
              <tr>
                <th>Item Checklist Serah Terima</th>
                <th className="w-32">PIC / Owner</th>
                <th className="w-28">Status</th>
                <th>Catatan Kesepakatan</th>
              </tr>
            </thead>
            <tbody>
              {fsd.apiHandoffChecklist.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-slate-800">{item.item}</td>
                  <td>{item.owner || '—'}</td>
                  <td>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.complete ? 'Complete' : 'Pending'}
                    </span>
                  </td>
                  <td className="text-slate-600">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
        Halaman 7
      </div>
    </section>
  );
}

