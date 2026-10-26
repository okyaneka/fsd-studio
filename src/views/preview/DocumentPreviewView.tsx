import { useState, useEffect, useMemo } from 'react';
import type { Project, FsdDocument, FsdModule, Screen } from '../../core/types';
import { getAssetById } from '../../core/assets';
import { buildTraceabilityMatrix } from '../../core/traceability';
import { ArrowLeftIcon } from '../../components/Icons';
import { DocumentCover } from './DocumentCover';
import { DocumentToc } from './DocumentToc';

interface DocumentPreviewViewProps {
  project?: Project;
  fsd: FsdDocument;
  initialModuleId?: string | null;
  onBack: () => void;
}

export function DocumentPreviewView({
  project,
  fsd,
  initialModuleId = null,
  onBack,
}: DocumentPreviewViewProps) {
  const [selectedModuleScope, setSelectedModuleScope] = useState<string>(
    initialModuleId || 'all'
  );

  // Asset object URLs map: assetId -> objectUrl
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});

  // Traceability Summary
  const traceabilitySummary = useMemo(() => buildTraceabilityMatrix(fsd), [fsd]);

  // Load all wireframe assets from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const createdUrls: string[] = [];

    async function loadAssets() {
      const urlMap: Record<string, string> = {};
      const screensWithAssets: Screen[] = [];

      for (const mod of fsd.modules) {
        for (const scr of mod.screens) {
          if (scr.wireframeAssetId) {
            screensWithAssets.push(scr);
          }
        }
      }

      for (const scr of screensWithAssets) {
        if (!scr.wireframeAssetId) continue;
        try {
          const asset = await getAssetById(scr.wireframeAssetId);
          if (asset && asset.blob && isMounted) {
            const objUrl = URL.createObjectURL(asset.blob);
            createdUrls.push(objUrl);
            urlMap[scr.wireframeAssetId] = objUrl;
          }
        } catch (err) {
          console.error(`Gagal memuat aset wireframe ${scr.wireframeAssetId}:`, err);
        }
      }

      if (isMounted) {
        setAssetUrls(urlMap);
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [fsd]);

  const visibleModules = useMemo(() => {
    if (selectedModuleScope === 'all') return fsd.modules;
    return fsd.modules.filter((m) => m.id === selectedModuleScope);
  }, [fsd, selectedModuleScope]);

  const handlePrint = () => {
    window.print();
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fsd-canvas min-h-screen text-[#202a36]">
      {/* Top Application Bar (Hidden in Print) */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3 bg-[#142b40] text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Kembali ke Editor</span>
          </button>
          <div className="hidden sm:block text-xs font-semibold tracking-wider text-slate-300 border-l border-white/20 pl-3 uppercase">
            {metadataTitle(fsd.metadata.title)} · v{fsd.metadata.version}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scope Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden md:inline text-slate-300">Cakupan Tampilan:</span>
            <select
              value={selectedModuleScope}
              onChange={(e) => setSelectedModuleScope(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#1f3f5e] border border-white/20 rounded-md text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Seluruh Dokumen (Full FSD)</option>
              {fsd.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  Modul: {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#2e648e] hover:bg-[#3976a5] text-white rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print / Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={handleScrollTop}
            title="Kembali ke atas"
            className="hidden sm:flex items-center justify-center p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Document Shell */}
      <div className="fsd-shell grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] max-w-[1500px] mx-auto items-start gap-6 p-4 sm:p-6">
        {/* Navigation Sidebar (Desktop, hidden in Print) */}
        <DocumentToc fsd={fsd} activeModuleScope={selectedModuleScope} />

        {/* Center Document Canvas (White Pages on Neutral Canvas) */}
        <main className="min-w-0">
          {/* COVER PAGE */}
          <DocumentCover project={project} fsd={fsd} />

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
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
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

          {/* DYNAMIC MODULES SECTIONS */}
          {visibleModules.map((module) => (
            <div key={module.id} className="space-y-6">
              {/* Module Divider Page / Header */}
              <section className="fsd-page section toc-target" id={`mod-${module.code}`}>
                <div className="pb-3 border-b-2 border-[#17324d]">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2e648e]">
                    Spesifikasi Modul FSD
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#17324d] mt-1">
                    {module.name} ({module.code})
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {module.description || 'Modul ini mencakup 9 subbagian wajib spesifikasi fungsional.'}
                  </p>
                </div>

                {/* 5. PROCESS FLOWS */}
                <div className="mt-6 toc-target" id={`flows-${module.code}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-[#17324d]">
                      5. Process Flows ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.flows} />
                  </div>

                  {module.sectionStates.flows === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Process Flows" />
                  ) : module.sectionStates.flows === 'tbd' ? (
                    <TbdNotice sectionName="Process Flows" />
                  ) : module.flows.length === 0 ? (
                    <EmptyNotice sectionName="Process Flows" />
                  ) : (
                    <div className="space-y-6">
                      {groupItemsByFeature(module.flows, module.features).map((group, gIdx) => {
                        const showGroupHeader = group.feature !== '';
                        return (
                          <div key={group.feature || gIdx} className="space-y-3">
                            {showGroupHeader && (
                              <div className="flex items-center justify-between pt-2 border-b border-[#d7dee7] pb-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#17324d]">
                                  5.{gIdx + 1} Fitur: {group.feature}
                                </h4>
                                <span className="text-[10px] bg-[#eaf2f8] text-[#174d76] font-semibold px-2 py-0.5 rounded">
                                  {group.items.length} Alur
                                </span>
                              </div>
                            )}
                            <div className="space-y-4">
                              {group.items.map((flow, flowIdx) => (
                                <div key={flow.id} className="p-3.5 bg-[#f4f7fa] border border-[#d7dee7] rounded">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-[#2e648e]">
                                        {showGroupHeader
                                          ? `5.${gIdx + 1}.${flowIdx + 1} ${flow.name}`
                                          : `5.${flowIdx + 1} ${flow.name}`}
                                      </span>
                                      {flow.feature && (
                                        <span className="text-[10px] bg-sky-100 text-sky-800 font-medium px-1.5 py-0.5 rounded">
                                          {flow.feature}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                      {flow.id}
                                    </span>
                                  </div>
                                  {flow.description && (
                                    <p className="text-xs text-slate-600 mb-2">{flow.description}</p>
                                  )}

                                  {flow.steps.length > 0 && (
                                    <table className="fsd-table my-2 bg-white">
                                      <thead>
                                        <tr>
                                          <th className="w-12 text-center">Urutan</th>
                                          <th className="w-28">Aktor</th>
                                          <th>Aksi Pengguna</th>
                                          <th>Respon Sistem</th>
                                          <th className="w-24">Link Req</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {flow.steps.map((step) => (
                                          <tr key={step.order}>
                                            <td className="text-center font-mono font-bold text-slate-500">
                                              #{step.order}
                                            </td>
                                            <td className="font-semibold text-slate-800">{step.actor}</td>
                                            <td>{step.action}</td>
                                            <td>{step.systemResponse}</td>
                                            <td className="font-mono text-[10px] text-[#2e648e]">
                                              {step.requirementIds && step.requirementIds.length > 0
                                                ? step.requirementIds.join(', ')
                                                : '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}

                                  {flow.alternativePaths.length > 0 && (
                                    <div className="mt-2 text-xs">
                                      <strong className="text-amber-800 block text-[11px] mb-1">Jalur Alternatif:</strong>
                                      <ul className="list-disc pl-4 space-y-1 text-slate-700">
                                        {flow.alternativePaths.map((alt, aIdx) => (
                                          <li key={aIdx}>{alt.action} → {alt.systemResponse}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {flow.notes && (
                                    <div className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                                      <strong>Catatan:</strong> {flow.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
                  Modul {module.code} · Halaman 1
                </div>
              </section>

              {/* 6. UI / LO-FI SPECIFICATION */}
              <section className="fsd-page section toc-target" id={`ui-${module.code}`}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#dceaf5]">
                  <h3 className="text-xl font-bold text-[#17324d]">
                    6. UI / Lo-Fi Specification ({module.code})
                  </h3>
                  <SectionStateBadge state={module.sectionStates.screens} />
                </div>

                {module.sectionStates.screens === 'not-applicable' ? (
                  <NotApplicableNotice sectionName="UI / Lo-Fi Specification" />
                ) : module.sectionStates.screens === 'tbd' ? (
                  <TbdNotice sectionName="UI / Lo-Fi Specification" />
                ) : module.screens.length === 0 ? (
                  <EmptyNotice sectionName="UI / Lo-Fi Specification" />
                ) : (
                  <div className="space-y-6">
                    {module.screens.map((screen, sIdx) => (
                      <div key={screen.id} className="p-4 bg-white border border-[#d7dee7] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-[#17324d]">
                            6.{sIdx + 1} {screen.name}
                          </h4>
                          <span className="font-mono text-xs text-[#2e648e] bg-[#f0f6fb] px-2 py-0.5 rounded font-semibold">
                            {screen.id}
                          </span>
                        </div>
                        {screen.description && (
                          <p className="text-xs text-slate-600 mb-3">{screen.description}</p>
                        )}

                        {/* Wireframe Image / SVG Mockup */}
                        <div className="my-3 text-center">
                          {screen.wireframeAssetId && assetUrls[screen.wireframeAssetId] ? (
                            <img
                              src={assetUrls[screen.wireframeAssetId]}
                              alt={screen.imageAlt || screen.name}
                              className="max-h-[360px] mx-auto object-contain border border-slate-300 rounded shadow-xs"
                            />
                          ) : (
                            <div className="wireframe max-w-md mx-auto border border-[#aebbc8] bg-[#fafbfd] p-3 rounded text-left">
                              <div className="border border-[#d5dce4] bg-white p-4 min-h-[160px] rounded flex flex-col justify-between">
                                <div>
                                  <div className="text-center font-bold text-[#244b69] text-xs pb-1 border-b border-slate-100 mb-2">
                                    [Wireframe Preview: {screen.name}]
                                  </div>
                                  <div className="space-y-2 py-2">
                                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                    <div className="h-7 bg-slate-50 border border-slate-200 rounded w-full"></div>
                                    <div className="h-7 bg-slate-50 border border-slate-200 rounded w-full"></div>
                                  </div>
                                </div>
                                <div className="mt-3 py-1.5 bg-[#254f70] text-white text-[11px] font-bold text-center rounded">
                                  Submit / Konfirmasi
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 italic mt-1.5">
                            {screen.imageCaption || `Gambar: Wireframe ${screen.name}`}
                          </p>
                        </div>

                        {/* Annotations Table */}
                        {screen.annotations.length > 0 && (
                          <div className="mt-4">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                              Anotasi & Perilaku Elemen Layar:
                            </span>
                            <table className="fsd-table">
                              <thead>
                                <tr>
                                  <th className="w-10 text-center">No</th>
                                  <th>Elemen Layar / Interaksi</th>
                                  <th className="w-36">Link Requirement</th>
                                </tr>
                              </thead>
                              <tbody>
                                {screen.annotations.map((ann) => (
                                  <tr key={ann.number}>
                                    <td className="text-center font-bold text-blue-800">
                                      {ann.number}
                                    </td>
                                    <td>{ann.text}</td>
                                    <td className="font-mono text-[10px] text-[#2e648e]">
                                      {ann.requirementIds && ann.requirementIds.length > 0
                                        ? ann.requirementIds.join(', ')
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
                  Modul {module.code} · Halaman 2
                </div>
              </section>

              {/* 7. FUNCTIONAL REQUIREMENTS & 8. BUSINESS RULES */}
              <section className="fsd-page section toc-target" id={`req-${module.code}`}>
                {/* 7. REQUIREMENTS */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      7. Functional Requirements ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.requirements} />
                  </div>

                  {module.sectionStates.requirements === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Functional Requirements" />
                  ) : module.sectionStates.requirements === 'tbd' ? (
                    <TbdNotice sectionName="Functional Requirements" />
                  ) : module.requirements.length === 0 ? (
                    <EmptyNotice sectionName="Functional Requirements" />
                  ) : (
                  <table className="fsd-table">
                    <thead>
                      <tr>
                        <th className="w-28">Req ID</th>
                        <th className="w-40">Nama Kebutuhan</th>
                        <th className="w-16">Prioritas</th>
                        <th className="w-20">Status</th>
                        <th>Deskripsi Perilaku</th>
                        <th className="w-32">Acceptance Criteria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {module.requirements.map((req) => (
                        <tr key={req.id}>
                          <td className="font-mono font-bold text-[#2e648e]">{req.id}</td>
                          <td className="font-semibold text-slate-800">{req.name}</td>
                          <td>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              req.priority === 'Must' ? 'bg-red-100 text-red-800' :
                              req.priority === 'Should' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {req.priority}
                            </span>
                          </td>
                          <td>
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {req.status}
                            </span>
                          </td>
                          <td>{req.description}</td>
                          <td className="font-mono text-[10px] text-[#2e648e]">
                            {req.acceptanceCriteriaIds && req.acceptanceCriteriaIds.length > 0
                              ? req.acceptanceCriteriaIds.join(', ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>

                {/* 8. BUSINESS RULES */}
                <div className="pt-4 border-t border-slate-200 toc-target" id={`rules-${module.code}`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      8. Business Rules ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.businessRules} />
                  </div>

                  {module.sectionStates.businessRules === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Business Rules" />
                  ) : module.sectionStates.businessRules === 'tbd' ? (
                    <TbdNotice sectionName="Business Rules" />
                  ) : module.businessRules.length === 0 ? (
                    <EmptyNotice sectionName="Business Rules" />
                  ) : (
                    <table className="fsd-table">
                      <thead>
                        <tr>
                          <th className="w-28">Rule ID</th>
                          <th className="w-44">Nama Aturan Bisnis</th>
                          <th>Deskripsi Aturan</th>
                          <th>Alasan / Rationale</th>
                          <th className="w-28">Terkait FR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {module.businessRules.map((br) => (
                          <tr key={br.id}>
                            <td className="font-mono font-bold text-[#2e648e]">{br.id}</td>
                            <td className="font-semibold text-slate-800">{br.name}</td>
                            <td>{br.description}</td>
                            <td className="text-slate-600 italic">{br.rationale || '—'}</td>
                            <td className="font-mono text-[10px] text-[#2e648e]">
                              {br.relatedRequirementIds && br.relatedRequirementIds.length > 0
                                ? br.relatedRequirementIds.join(', ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
                  Modul {module.code} · Halaman 3
                </div>
              </section>

              {/* 9. DATA & VALIDATION & 10. INTEGRATIONS */}
              <section className="fsd-page section toc-target" id={`data-${module.code}`}>
                {/* 9. VALIDATION */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      9. Data & Field Validation ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.validations} />
                  </div>

                  {module.sectionStates.validations === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Data & Validation" />
                  ) : module.sectionStates.validations === 'tbd' ? (
                    <TbdNotice sectionName="Data & Validation" />
                  ) : module.validations.length === 0 ? (
                    <EmptyNotice sectionName="Data & Validation" />
                  ) : (
                    <table className="fsd-table">
                      <thead>
                        <tr>
                          <th className="w-24">Val ID</th>
                          <th className="w-32">Nama Field</th>
                          <th>Aturan Validasi / Kondisi</th>
                          <th>Pesan Kesalahan Pengguna</th>
                          <th className="w-28">Terkait FR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {module.validations.map((val) => (
                          <tr key={val.id}>
                            <td className="font-mono font-bold text-[#2e648e]">{val.id}</td>
                            <td className="font-mono font-bold text-slate-800">{val.field}</td>
                            <td>
                              {val.rules && val.rules.length > 0 ? (
                                <ul className="list-disc list-inside space-y-0.5">
                                  {val.rules.map((r, i) => (
                                    <li key={i}>
                                      <span className="font-mono font-semibold">{r.rule}</span>
                                      {r.value && <span className="text-slate-600 text-xs"> ({r.value})</span>}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                val.condition
                              )}
                            </td>
                            <td className="text-red-700 font-medium">
                              {val.rules && val.rules.length > 0 ? (
                                <ul className="list-disc list-inside space-y-0.5">
                                  {val.rules.map((r, i) => (
                                    <li key={i} className="font-mono text-xs">{r.errorMessage || '—'}</li>
                                  ))}
                                </ul>
                              ) : (
                                val.message
                              )}
                            </td>
                            <td className="font-mono text-[10px] text-[#2e648e]">
                              {val.relatedRequirementIds && val.relatedRequirementIds.length > 0
                                ? val.relatedRequirementIds.join(', ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 10. INTEGRATIONS */}
                <div className="pt-4 border-t border-slate-200 toc-target" id={`int-${module.code}`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      10. Integration Requirements ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.integrations} />
                  </div>

                  {module.sectionStates.integrations === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Integration Requirements" />
                  ) : module.sectionStates.integrations === 'tbd' ? (
                    <TbdNotice sectionName="Integration Requirements" />
                  ) : module.integrations.length === 0 ? (
                    <EmptyNotice sectionName="Integration Requirements" />
                  ) : (
                    <table className="fsd-table">
                      <thead>
                        <tr>
                          <th className="w-24">Int ID</th>
                          <th className="w-40">Antarmuka / Event</th>
                          <th className="w-32">Owner / SA Target</th>
                          <th>Input / Parameter</th>
                          <th>Expected Outcome</th>
                          <th className="w-24">Terkait FR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {module.integrations.map((it) => (
                          <tr key={it.id}>
                            <td className="font-mono font-bold text-[#2e648e]">{it.id}</td>
                            <td className="font-semibold text-slate-800">{it.name}</td>
                            <td>{it.owner || '—'}</td>
                            <td className="font-mono text-[10px]">{it.input || '—'}</td>
                            <td className="font-mono text-[10px]">{it.outcome || '—'}</td>
                            <td className="font-mono text-[10px] text-[#2e648e]">
                              {it.relatedRequirementIds && it.relatedRequirementIds.length > 0
                                ? it.relatedRequirementIds.join(', ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
                  Modul {module.code} · Halaman 4
                </div>
              </section>

              {/* 11. ERRORS, 12. SECURITY/NFR, & 13. ACCEPTANCE CRITERIA */}
              <section className="fsd-page section toc-target" id={`errors-${module.code}`}>
                {/* 11. ERROR STATES */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      11. Error Handling & State Behavior ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.errorStates} />
                  </div>

                  {module.sectionStates.errorStates === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Error Handling" />
                  ) : module.sectionStates.errorStates === 'tbd' ? (
                    <TbdNotice sectionName="Error Handling" />
                  ) : module.errorStates.length === 0 ? (
                    <EmptyNotice sectionName="Error Handling" />
                  ) : (
                    <table className="fsd-table">
                      <thead>
                        <tr>
                          <th className="w-24">Err ID</th>
                          <th className="w-36">Skenario Kesalahan</th>
                          <th>Kondisi Pemicu</th>
                          <th>Pesan Pengguna</th>
                          <th>Tindakan Pemulihan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {module.errorStates.map((err) => (
                          <tr key={err.id}>
                            <td className="font-mono font-bold text-[#2e648e]">{err.id}</td>
                            <td className="font-semibold text-slate-800">{err.name}</td>
                            <td>{err.trigger}</td>
                            <td className="text-amber-800 font-medium">{err.userMessage}</td>
                            <td>{err.recovery}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 12. SECURITY & NFR */}
                <div className="pt-4 border-t border-slate-200 toc-target" id={`nfr-${module.code}`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      12. Security & Non-Functional Requirements ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.nfrs} />
                  </div>

                  {module.sectionStates.nfrs === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Security & NFR" />
                  ) : module.sectionStates.nfrs === 'tbd' ? (
                    <TbdNotice sectionName="Security & NFR" />
                  ) : module.nfrs.length === 0 ? (
                    <EmptyNotice sectionName="Security & NFR" />
                  ) : (
                    <table className="fsd-table">
                      <thead>
                        <tr>
                          <th className="w-24">NFR ID</th>
                          <th className="w-28">Kategori</th>
                          <th>Kebutuhan Spesifikasi</th>
                          <th>Tolok Ukur / SLA Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {module.nfrs.map((nfr) => (
                          <tr key={nfr.id}>
                            <td className="font-mono font-bold text-[#2e648e]">{nfr.id}</td>
                            <td className="font-semibold text-slate-700">{nfr.category}</td>
                            <td>{nfr.name}: {nfr.description}</td>
                            <td className="font-bold text-[#17324d]">{nfr.measure}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 13. ACCEPTANCE CRITERIA */}
                <div className="pt-4 border-t border-slate-200 toc-target" id={`ac-${module.code}`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#dceaf5]">
                    <h3 className="text-xl font-bold text-[#17324d]">
                      13. Acceptance Criteria ({module.code})
                    </h3>
                    <SectionStateBadge state={module.sectionStates.acceptanceCriteria} />
                  </div>

                  {module.sectionStates.acceptanceCriteria === 'not-applicable' ? (
                    <NotApplicableNotice sectionName="Acceptance Criteria" />
                  ) : module.sectionStates.acceptanceCriteria === 'tbd' ? (
                    <TbdNotice sectionName="Acceptance Criteria" />
                  ) : module.acceptanceCriteria.length === 0 ? (
                    <EmptyNotice sectionName="Acceptance Criteria" />
                  ) : (
                  <div className="space-y-4">
                    {module.acceptanceCriteria.map((ac) => (
                      <div key={ac.id} className="p-3.5 bg-[#f4f7fa] border border-[#d7dee7] rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-[#17324d]">
                            {ac.name}
                          </h4>
                          <span className="font-mono text-[10px] font-bold text-[#2e648e] bg-white border border-[#d7dee7] px-2 py-0.5 rounded">
                            {ac.id}
                          </span>
                        </div>

                        {ac.scenarios && ac.scenarios.length > 0 ? (
                          <div className="space-y-2 mt-2">
                            {ac.scenarios.map((sc, scIdx) => (
                              <div key={scIdx} className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                                {sc.title && (
                                  <div className="font-bold text-slate-800 text-[11px] pb-1 border-b border-slate-100">
                                    Skenario #{scIdx + 1}: {sc.title}
                                  </div>
                                )}
                                <div>
                                  <strong className="text-blue-700 font-bold text-[11px]">GIVEN </strong>
                                  <span className="text-slate-700">{sc.given.join(' AND ')}</span>
                                </div>
                                <div>
                                  <strong className="text-amber-700 font-bold text-[11px]">WHEN </strong>
                                  <span className="text-slate-700">{sc.when}</span>
                                </div>
                                <div>
                                  <strong className="text-emerald-700 font-bold text-[11px]">THEN </strong>
                                  <span className="text-slate-700">{sc.then.join(' AND ')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Belum ada skenario yang disusun.</p>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
                  Modul {module.code} · Halaman 5
                </div>
              </section>
            </div>
          ))}

          {/* 14. TRACEABILITY MATRIX */}
          <section className="fsd-page section toc-target" id="traceability">
            <h2 className="text-xl font-bold text-[#17324d] pb-2 mb-4 border-b-2 border-[#dceaf5]">
              14. Cross-Module Traceability Matrix
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Matriks ketertelusuran memetakan korelasi langsung antara Functional Requirement (FR) dengan Alur Proses (Flow), Layar Wireframe (Screen), Validasi / Aturan Bisnis, Integrasi API, dan Kriteria Penerimaan (Acceptance Criteria).
            </p>

            <table className="fsd-table">
              <thead>
                <tr>
                  <th className="w-24">Req ID</th>
                  <th className="w-36">Nama Requirement</th>
                  <th className="w-20">Alur (Flow)</th>
                  <th className="w-20">Layar (UI)</th>
                  <th className="w-24">Aturan / Val</th>
                  <th className="w-24">Integrasi</th>
                  <th>Acceptance Criteria</th>
                  <th className="w-20">Status QA</th>
                </tr>
              </thead>
              <tbody>
                {traceabilitySummary.rows.map((row) => (
                  <tr key={row.requirementId}>
                    <td className="font-mono font-bold text-[#2e648e]">{row.requirementId}</td>
                    <td className="font-semibold text-slate-800">{row.requirementName}</td>
                    <td className="font-mono text-[10px]">
                      {row.flowIds.length > 0 ? row.flowIds.join(', ') : <span className="text-red-500">None</span>}
                    </td>
                    <td className="font-mono text-[10px]">
                      {row.screenIds.length > 0 ? row.screenIds.join(', ') : <span className="text-red-500">None</span>}
                    </td>
                    <td className="font-mono text-[10px]">
                      {row.validationIds.length > 0 ? row.validationIds.join(', ') : '—'}
                    </td>
                    <td className="font-mono text-[10px]">
                      {row.integrationIds.join(', ') || '—'}
                    </td>
                    <td className="font-mono text-[10px] text-[#2e648e]">
                      {row.acceptanceCriteriaIds.length > 0 ? (
                        row.acceptanceCriteriaIds.join(', ')
                      ) : (
                        <span className="text-red-500 font-bold">Belum Ada AC</span>
                      )}
                    </td>
                    <td>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        row.coverage.isFullyCovered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.coverage.isFullyCovered ? 'Covered' : 'Partial'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
              Halaman 6
            </div>
          </section>

          {/* 15. OPEN ITEMS & APPROVALS */}
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
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          oi.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          oi.status === 'Accepted risk' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
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
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
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
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
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
        </main>
      </div>
    </div>
  );
}

function SectionStateBadge({ state }: { state: string }) {
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

function NotApplicableNotice({ sectionName }: { sectionName: string }) {
  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 my-2">
      <span className="font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded mr-2 text-[10px]">
        Not Applicable
      </span>
      Seksi <strong>{sectionName}</strong> telah ditandai sebagai tidak berlaku untuk modul ini.
    </div>
  );
}

function TbdNotice({ sectionName }: { sectionName: string }) {
  return (
    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 my-2">
      <span className="font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded mr-2 text-[10px]">
        To Be Determined (TBD)
      </span>
      Seksi <strong>{sectionName}</strong> sedang dalam perumusan dan akan dilengkapi pada iterasi berikutnya.
    </div>
  );
}

function EmptyNotice({ sectionName }: { sectionName: string }) {
  return (
    <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded text-xs text-slate-400 italic my-2">
      Belum ada konten yang didefinisikan untuk {sectionName}.
    </div>
  );
}

function metadataTitle(title: string): string {
  return title.trim() || 'Untitled FSD';
}

function groupItemsByFeature<T extends { feature?: string }>(
  items: T[],
  moduleFeatures?: string[]
): { feature: string; items: T[] }[] {
  if (items.length === 0) return [];

  const hasTaggedFeature = items.some((item) => Boolean(item.feature && item.feature.trim().length > 0));
  const hasModuleFeatures = Boolean(moduleFeatures && moduleFeatures.length > 0);

  if (!hasTaggedFeature && !hasModuleFeatures) {
    return [{ feature: '', items }];
  }

  const map = new Map<string, T[]>();

  if (moduleFeatures) {
    for (const feat of moduleFeatures) {
      if (feat.trim()) {
        map.set(feat.trim(), []);
      }
    }
  }

  for (const item of items) {
    const f = item.feature?.trim() || 'Umum';
    if (!map.has(f)) {
      map.set(f, []);
    }
    map.get(f)!.push(item);
  }

  const result: { feature: string; items: T[] }[] = [];
  for (const [feature, groupItems] of map.entries()) {
    if (groupItems.length > 0) {
      result.push({ feature, items: groupItems });
    }
  }

  return result.length > 0 ? result : [{ feature: '', items }];
}
