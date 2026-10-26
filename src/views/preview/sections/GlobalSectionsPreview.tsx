import type { FsdDocument } from '../../../core/types';

interface GlobalSectionsPreviewProps {
  fsd: FsdDocument;
}

export function GlobalSectionsPreview({ fsd }: GlobalSectionsPreviewProps) {
  return (
    <>
      {/* 1. DOCUMENT CONTROL */}
      <section className="fsd-page section toc-target" id="control">
        <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-4 border-b-2 border-[#dceaf5]">
          1. Document Control
        </h2>

        <h3 className="text-sm font-bold text-[#244b69] mt-4 mb-2">1.1 Revision History</h3>
        {fsd.documentControl.revisionHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada riwayat revisi yang dicatat.</p>
        ) : (
          <table className="fsd-table">
            <thead>
              <tr>
                <th className="w-16">Versi</th>
                <th className="w-24">Tanggal</th>
                <th className="w-32">Penulis</th>
                <th>Ringkasan Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {fsd.documentControl.revisionHistory.map((rev, idx) => (
                <tr key={idx}>
                  <td className="font-mono font-bold text-[#2e648e]">v{rev.version}</td>
                  <td>{rev.date}</td>
                  <td>{rev.author}</td>
                  <td>{rev.changeSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="text-sm font-bold text-[#244b69] mt-6 mb-2">1.2 Review and Approval</h3>
        <table className="fsd-table">
          <thead>
            <tr>
              <th className="w-44">Peran</th>
              <th>Tanggung Jawab</th>
              <th className="w-40">Nama / Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold">Business Analyst</td>
              <td>Pemilik spesifikasi fungsional, aturan bisnis, dan matriks ketertelusuran.</td>
              <td className="font-medium text-[#202a36]">{fsd.metadata.author || 'Author'}</td>
            </tr>
            {fsd.approvals.map((app) => (
              <tr key={app.id}>
                <td className="font-semibold">{app.role}</td>
                <td>{app.responsibility || 'Persetujuan lingkup bisnis dan kesiapan serah terima.'}</td>
                <td>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {app.person ? `${app.person} (${app.status})` : app.status}
                  </span>
                </td>
              </tr>
            ))}
            {fsd.approvals.length === 0 && (
              <tr>
                <td className="font-semibold">Solution Architect / PO</td>
                <td>Validasi kelayakan teknis, arsitektur, dan keamanan.</td>
                <td className="text-slate-400 italic">Pending review</td>
              </tr>
            )}
          </tbody>
        </table>

        <h3 className="text-sm font-bold text-[#244b69] mt-6 mb-2">1.3 Related Documents</h3>
        {fsd.documentControl.relatedDocuments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Tidak ada dokumen terkait yang ditautkan.</p>
        ) : (
          <ul className="list-disc pl-5 text-xs space-y-1.5 my-2">
            {fsd.documentControl.relatedDocuments.map((doc, idx) => (
              <li key={idx}>
                <strong className="text-[#17324d]">{doc.name}</strong>
                {doc.reference && <span className="font-mono text-slate-500 ml-1">({doc.reference})</span>}
                {doc.description && <span className="text-slate-600 block text-[11px] mt-0.5">{doc.description}</span>}
              </li>
            ))}
          </ul>
        )}

        <div className="p-3 bg-[#f0f6fb] border border-[#c7dbe9] rounded text-xs text-[#202a36] mt-6 leading-relaxed">
          <strong className="text-[#174d76] block mb-1">Batasan Dokumen (Document Boundary):</strong>
          FSD ini mendefinisikan <em>apa yang harus dilakukan oleh sistem</em> dari perspektif fungsional dan perilaku pengguna. Dokumen Spesifikasi API mengatur kontrak pertukaran data teknis, dan Technical Design mengatur implementasi arsitektur internal.
        </div>

        <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">Halaman 2</div>
      </section>

      {/* 2. OVERVIEW & SCOPE */}
      <section className="fsd-page section toc-target" id="overview">
        <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-4 border-b-2 border-[#dceaf5]">
          2. Overview & Scope
        </h2>

        <h3 className="text-sm font-bold text-[#244b69] mt-4 mb-2">2.1 Objective</h3>
        <p className="text-xs leading-relaxed text-[#202a36]">
          {fsd.overview.objective || 'Tujuan dokumen ini adalah memberikan spesifikasi menyeluruh atas kebutuhan fungsional perangkat lunak.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="p-3.5 bg-[#f4f7fa] border border-[#d7dee7] rounded">
            <h4 className="text-xs font-bold text-[#17324d] uppercase tracking-wider mb-2">
              2.2 In Scope
            </h4>
            {fsd.overview.inScope.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada item cakupan in-scope.</p>
            ) : (
              <ul className="list-disc pl-4 text-xs space-y-1 text-[#202a36]">
                {fsd.overview.inScope.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3.5 bg-[#f4f7fa] border border-[#d7dee7] rounded">
            <h4 className="text-xs font-bold text-[#17324d] uppercase tracking-wider mb-2">
              2.3 Out of Scope
            </h4>
            {fsd.overview.outOfScope.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada item batasan out-of-scope.</p>
            ) : (
              <ul className="list-disc pl-4 text-xs space-y-1 text-slate-600">
                {fsd.overview.outOfScope.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-[#244b69] mt-6 mb-2">2.4 Success Outcomes</h3>
        {fsd.overview.successOutcomes.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada hasil keberhasilan yang didefinisikan.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            {fsd.overview.successOutcomes.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#f4f7fa] border border-[#d7dee7] rounded">
                <span className="block text-[10px] font-bold text-[#617083] uppercase tracking-wider mb-1">
                  {item.label}
                </span>
                <strong className="text-xs text-[#17324d] font-semibold block leading-snug">
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-sm font-bold text-[#244b69] mt-6 mb-2">2.5 Definitions & Acronyms</h3>
        {fsd.overview.definitions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Tidak ada glosarium istilah khusus.</p>
        ) : (
          <table className="fsd-table">
            <thead>
              <tr>
                <th className="w-1/3">Istilah / Istilah Singkatan</th>
                <th>Definisi & Penjelasan</th>
              </tr>
            </thead>
            <tbody>
              {fsd.overview.definitions.map((def, idx) => (
                <tr key={idx}>
                  <td className="font-bold text-[#17324d]">{def.label}</td>
                  <td>{def.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">Halaman 3</div>
      </section>

      {/* 3. BUSINESS CONTEXT & 4. ACTORS */}
      <section className="fsd-page section toc-target" id="context">
        <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-4 border-b-2 border-[#dceaf5]">
          3. Business Context
        </h2>

        <p className="text-xs leading-relaxed text-[#202a36] mb-4">
          {fsd.businessContext.summary || 'Konteks bisnis menggambarkan latar belakang operasional dan nilai strategis yang melandasi implementasi sistem ini.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-3.5 bg-[#f4f7fa] border border-[#d7dee7] rounded">
            <h4 className="text-xs font-bold text-[#17324d] uppercase tracking-wider mb-2">
              3.1 Assumptions (Asumsi)
            </h4>
            {fsd.businessContext.assumptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada asumsi yang dicatat.</p>
            ) : (
              <ul className="list-disc pl-4 text-xs space-y-1 text-[#202a36]">
                {fsd.businessContext.assumptions.map((ass, idx) => (
                  <li key={idx}>{ass}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3.5 bg-[#f4f7fa] border border-[#d7dee7] rounded">
            <h4 className="text-xs font-bold text-[#17324d] uppercase tracking-wider mb-2">
              3.2 Dependencies (Ketergantungan Sistem)
            </h4>
            {fsd.businessContext.dependencies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tidak ada ketergantungan yang dicatat.</p>
            ) : (
              <ul className="list-disc pl-4 text-xs space-y-1 text-[#202a36]">
                {fsd.businessContext.dependencies.map((dep, idx) => (
                  <li key={idx}>
                    <strong>{dep.label}:</strong> {dep.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 4. ACTORS & ASSUMPTIONS */}
        <div className="pt-4 border-t border-slate-200 toc-target" id="roles">
          <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-4 border-b-2 border-[#dceaf5]">
            4. Actors & Assumptions
          </h2>

          <h3 className="text-sm font-bold text-[#244b69] mb-2">4.1 User Roles & Actors</h3>
          {fsd.actors.length === 0 ? (
            <p className="text-xs text-slate-400 italic mb-4">Belum ada aktor pengguna yang didefinisikan.</p>
          ) : (
            <table className="fsd-table mb-4">
              <thead>
                <tr>
                  <th className="w-24">ID Aktor</th>
                  <th className="w-36">Nama Peran</th>
                  <th>Deskripsi</th>
                  <th>Hak Akses / Kebutuhan</th>
                </tr>
              </thead>
              <tbody>
                {fsd.actors.map((actor) => (
                  <tr key={actor.id}>
                    <td className="font-mono font-bold text-[#2e648e]">{actor.id}</td>
                    <td className="font-semibold">{actor.name}</td>
                    <td>{actor.description}</td>
                    <td>{actor.permissionsOrNeeds || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-white border border-[#d7dee7] rounded">
              <h4 className="text-xs font-bold text-[#17324d] mb-1">Preconditions (Prasyarat Awal)</h4>
              {fsd.preconditions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada prasyarat khusus.</p>
              ) : (
                <ul className="list-disc pl-4 text-xs space-y-1 text-slate-700">
                  {fsd.preconditions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 bg-white border border-[#d7dee7] rounded">
              <h4 className="text-xs font-bold text-[#17324d] mb-1">Postconditions (Kondisi Akhir)</h4>
              {fsd.postconditions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada kondisi akhir khusus.</p>
              ) : (
                <ul className="list-disc pl-4 text-xs space-y-1 text-slate-700">
                  {fsd.postconditions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">Halaman 4</div>
      </section>
    </>
  );
}

