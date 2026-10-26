import { useMemo } from 'react';
import type { FsdDocument } from '../../core/types';
import { checkFsdCompleteness } from '../../core/integrity';
import { Modal } from '../../components/Modal';
import { CheckCircleIcon, ExclamationTriangleIcon } from '../../components/Icons';

interface BaselineCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  fsd: FsdDocument;
  onConfirmBaseline?: () => void;
  isStatusChangeAttempt?: boolean;
}

export function BaselineCheckModal({
  isOpen,
  onClose,
  fsd,
  onConfirmBaseline,
  isStatusChangeAttempt = false,
}: BaselineCheckModalProps) {
  const report = useMemo(() => checkFsdCompleteness(fsd), [fsd]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pemeriksaan Kelengkapan Dokumen Baseline"
      description="Evaluasi otomatis terhadap 5 aturan kelengkapan standar sebelum penetapan status Baseline."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Summary Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            report.isBaselineReady
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : report.errorsCount > 0
              ? 'bg-red-50 border-red-200 text-red-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          {report.isBaselineReady ? (
            <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ExclamationTriangleIcon
              className={`w-6 h-6 shrink-0 mt-0.5 ${
                report.errorsCount > 0 ? 'text-red-600' : 'text-amber-600'
              }`}
            />
          )}

          <div>
            <h4 className="text-sm font-bold">
              {report.isBaselineReady
                ? 'Dokumen Siap Menjadi Baseline'
                : report.errorsCount > 0
                ? 'Ditemukan Kesalahan Kritis Sebelum Baseline'
                : 'Perhatian: Ada Bagian Dokumen yang Belum Lengkap'}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {report.isBaselineReady
                ? 'Seluruh Functional Requirement telah memiliki Acceptance Criteria, alur proses/layar terhubung, dan kebutuhan integrasi telah terisi lengkap.'
                : `Ditemukan ${report.errorsCount} error, ${report.warningsCount} peringatan kelengkapan, dan ${report.noticesCount} open items aktif.`}
            </p>
          </div>
        </div>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-red-50/70 border border-red-100 rounded-lg p-2.5">
            <span className="text-[11px] font-semibold text-red-800 uppercase block">Error Kritis</span>
            <span className="text-lg font-bold text-red-700">{report.errorsCount}</span>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2.5">
            <span className="text-[11px] font-semibold text-amber-800 uppercase block">Peringatan Kelengkapan</span>
            <span className="text-lg font-bold text-amber-700">{report.warningsCount}</span>
          </div>
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5">
            <span className="text-[11px] font-semibold text-blue-800 uppercase block">Open Items Aktif</span>
            <span className="text-lg font-bold text-blue-700">{report.noticesCount}</span>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {report.issues.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-50 rounded-lg border border-slate-200">
              Tidak ada masalah atau peringatan yang ditemukan. Dokumen 100% konsisten.
            </div>
          ) : (
            report.issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  issue.severity === 'error'
                    ? 'bg-red-50/50 border-red-200 text-red-900'
                    : issue.severity === 'warning'
                    ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                    : 'bg-blue-50/50 border-blue-200 text-blue-900'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                    issue.severity === 'error'
                      ? 'bg-red-200 text-red-900'
                      : issue.severity === 'warning'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-blue-200 text-blue-900'
                  }`}
                >
                  {issue.severity}
                </span>

                <div className="space-y-0.5">
                  <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                    <span>{issue.title}</span>
                    {issue.moduleCode && (
                      <span className="font-mono text-[10px] bg-white/70 px-1.5 py-0.2 rounded border border-black/10">
                        MOD-{issue.moduleCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-85 leading-relaxed">{issue.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Standar: development-workflow.md &bull; Seksi 5
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {isStatusChangeAttempt && onConfirmBaseline && (
              <button
                type="button"
                onClick={onConfirmBaseline}
                disabled={report.errorsCount > 0}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Tetap Jadikan Baseline
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

