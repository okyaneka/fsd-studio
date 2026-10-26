import { useState, useMemo } from 'react';
import type { FsdDocument } from '../../core/types';
import { buildTraceabilityMatrix, TraceabilityRow } from '../../core/traceability';
import { SearchIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../../components/Icons';

interface TraceabilityMatrixViewProps {
  fsd: FsdDocument;
  onOpenBaselineCheck: () => void;
}

export function TraceabilityMatrixView({ fsd, onOpenBaselineCheck }: TraceabilityMatrixViewProps) {
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'covered' | 'missing-ac' | 'missing-ui'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const summary = useMemo(() => buildTraceabilityMatrix(fsd), [fsd]);

  // Filter rows
  const filteredRows = useMemo(() => {
    let rows = summary.rows;

    if (selectedModule !== 'all') {
      rows = rows.filter((r) => r.moduleCode === selectedModule);
    }

    if (statusFilter === 'covered') {
      rows = rows.filter((r) => r.coverage.isFullyCovered);
    } else if (statusFilter === 'missing-ac') {
      rows = rows.filter((r) => !r.coverage.hasAcceptanceCriterion);
    } else if (statusFilter === 'missing-ui') {
      rows = rows.filter((r) => !r.coverage.hasFlowOrScreen);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.requirementId.toLowerCase().includes(q) ||
          r.requirementName.toLowerCase().includes(q) ||
          r.flowIds.some((f) => f.toLowerCase().includes(q)) ||
          r.screenIds.some((s) => s.toLowerCase().includes(q)) ||
          r.acceptanceCriteriaIds.some((a) => a.toLowerCase().includes(q))
      );
    }

    return rows;
  }, [summary.rows, selectedModule, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview & Stats Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Matriks Ketertelusuran (Cross-module Traceability Matrix)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menautkan Functional Requirement bisnis ke Layar, Alur Proses, Validasi, dan Kriteria Pengujian QA.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenBaselineCheck}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
            Cek Kelengkapan Baseline
          </button>
        </div>

        {/* Coverage Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
            <span className="text-slate-500 block font-medium">Total Requirements</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {summary.totalRequirements}
            </span>
          </div>

          <div className="bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-200">
            <span className="text-emerald-800 block font-medium">Cakupan Lengkap (Full)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-700">{summary.coveredRequirements}</span>
              <span className="text-xs font-semibold text-emerald-800">
                ({summary.coveragePercentage}%)
              </span>
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-lg p-3.5 border border-amber-200">
            <span className="text-amber-800 block font-medium">Belum Memiliki AC</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {summary.missingAcCount}
            </span>
          </div>

          <div className="bg-blue-50/60 rounded-lg p-3.5 border border-blue-200">
            <span className="text-blue-800 block font-medium">Belum Memiliki Flow/Screen</span>
            <span className="text-2xl font-bold text-blue-700 mt-1 block">
              {summary.missingUiCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Modul:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Modul ({fsd.modules.length})</option>
              {fsd.modules.map((m) => (
                <option key={m.code} value={m.code}>
                  MOD-{m.code} ({m.name})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Cakupan:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="covered">Lengkap (Covered)</option>
              <option value="missing-ac">Belum Ada AC</option>
              <option value="missing-ui">Belum Ada Flow/Layar</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID Requirement, Flow, AC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Traceability Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs italic">
            Tidak ada requirement yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-3 font-semibold w-28">Modul</th>
                  <th className="py-3 px-3 font-semibold w-52">Requirement (FR)</th>
                  <th className="py-3 px-3 font-semibold w-40">Alur Proses (Flow)</th>
                  <th className="py-3 px-3 font-semibold w-40">Layar / Wireframe</th>
                  <th className="py-3 px-3 font-semibold w-48">Validasi / Integrasi</th>
                  <th className="py-3 px-3 font-semibold w-48">Acceptance Criteria (AC)</th>
                  <th className="py-3 px-3 font-semibold w-32 text-center">Status Cakupan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRows.map((row) => (
                  <tr key={row.requirementId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Modul */}
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">
                      <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                        MOD-{row.moduleCode}
                      </span>
                    </td>

                    {/* Requirement */}
                    <td className="py-3 px-3 space-y-1">
                      <div className="font-mono font-bold text-blue-700">{row.requirementId}</div>
                      <div className="font-medium text-slate-900 leading-snug">{row.requirementName}</div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {row.requirementPriority}
                        </span>
                        <span className="text-[10px] text-slate-400">&bull; {row.requirementStatus}</span>
                      </div>
                    </td>

                    {/* Flows */}
                    <td className="py-3 px-3">
                      {row.flowIds.length > 0 ? (
                        <div className="space-y-1">
                          {row.flowIds.map((fId) => (
                            <span
                              key={fId}
                              className="inline-block font-mono text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded"
                            >
                              {fId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Tidak ada</span>
                      )}
                    </td>

                    {/* Screens */}
                    <td className="py-3 px-3">
                      {row.screenIds.length > 0 ? (
                        <div className="space-y-1">
                          {row.screenIds.map((sId) => (
                            <span
                              key={sId}
                              className="inline-block font-mono text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded"
                            >
                              {sId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Tidak ada</span>
                      )}
                    </td>

                    {/* Validasi & Integrasi */}
                    <td className="py-3 px-3 space-y-1">
                      {row.validationIds.length === 0 && row.integrationIds.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">N/A — client validation</span>
                      ) : (
                        <>
                          {row.validationIds.map((vId) => (
                            <span
                              key={vId}
                              className="inline-block font-mono text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded mr-1"
                            >
                              {vId}
                            </span>
                          ))}
                          {row.integrationIds.map((iId) => (
                            <span
                              key={iId}
                              className="inline-block font-mono text-[10px] bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.5 rounded mr-1"
                            >
                              {iId}
                            </span>
                          ))}
                        </>
                      )}
                    </td>

                    {/* Acceptance Criteria */}
                    <td className="py-3 px-3">
                      {row.acceptanceCriteriaIds.length > 0 ? (
                        <div className="space-y-1">
                          {row.acceptanceCriteriaIds.map((acId) => (
                            <span
                              key={acId}
                              className="inline-block font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium"
                            >
                              {acId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-medium italic text-[11px] flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                          Belum ada AC
                        </span>
                      )}
                    </td>

                    {/* Coverage Status */}
                    <td className="py-3 px-3 text-center">
                      {row.coverage.isFullyCovered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Lengkap
                        </span>
                      ) : !row.coverage.hasAcceptanceCriterion && !row.coverage.hasFlowOrScreen ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          Belum Ditautkan
                        </span>
                      ) : !row.coverage.hasAcceptanceCriterion ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Kurang AC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          Kurang UI
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Impact Rule Card (As defined in canonical standard) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 text-sm">Aturan Dampak Perubahan (Change Impact Rule):</h4>
        <p className="leading-relaxed">
          Setiap perubahan yang disetujui pada suatu Functional Requirement (FR) wajib dievaluasi dampaknya terhadap perilaku layar (Screen), kontrak antarmuka API (Integration), aturan bisnis (Business Rules), dan skenario pengujian (Acceptance Criteria). Matriks keterlacakan ini otomatis diperbarui sebagai bukti kepatuhan sebelum dokumen dinyatakan Baseline.
        </p>
      </div>
    </div>
  );
}

