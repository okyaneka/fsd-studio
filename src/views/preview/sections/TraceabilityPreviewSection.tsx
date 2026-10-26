import type { TraceabilitySummary } from '../../../core/traceability';

interface TraceabilityPreviewSectionProps {
  traceabilitySummary: TraceabilitySummary;
}

export function TraceabilityPreviewSection({
  traceabilitySummary,
}: TraceabilityPreviewSectionProps) {
  return (
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
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    row.coverage.isFullyCovered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
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
  );
}

