import type { FsdModule } from '../../../core/types';
import { groupItemsByFeature } from '../previewHelpers';
import {
  SectionStateBadge,
  NotApplicableNotice,
  TbdNotice,
  EmptyNotice,
} from './PreviewNotices';

interface ModulePreviewSectionProps {
  module: FsdModule;
  assetUrls: Record<string, string>;
}

export function ModulePreviewSection({ module, assetUrls }: ModulePreviewSectionProps) {
  return (
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
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
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
  );
}

