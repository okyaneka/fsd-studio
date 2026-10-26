import type { FsdDocument } from './types';
import { buildTraceabilityMatrix } from './traceability';

export interface IntegrityIssue {
  id: string;
  category:
    | 'requirement_without_ac'
    | 'ui_without_flow_or_screen'
    | 'incomplete_integration'
    | 'unresolved_open_item'
    | 'duplicate_id';
  severity: 'error' | 'warning' | 'notice';
  title: string;
  description: string;
  moduleCode?: string;
  itemId?: string;
}

export interface IntegrityReport {
  isBaselineReady: boolean;
  totalIssues: number;
  errorsCount: number;
  warningsCount: number;
  noticesCount: number;
  issues: IntegrityIssue[];
}

/**
 * Menjalankan pemeriksaan integritas dan kelengkapan dokumen FSD
 * sesuai 5 aturan baseline di development-workflow.md:
 * 1. Setiap Functional Requirement memiliki minimal 1 Acceptance Criterion.
 * 2. Kebutuhan UI memiliki Flow atau Screen yang terhubung.
 * 3. Kebutuhan Integrasi memiliki input, outcome, dan owner SA.
 * 4. Open Item yang masih terbuka terlihat jelas.
 * 5. Tidak ada duplikasi ID artefak di seluruh dokumen.
 */
export function checkFsdCompleteness(fsd: FsdDocument): IntegrityReport {
  const issues: IntegrityIssue[] = [];

  // 1. Pemeriksaan ID Duplikat
  const seenIds = new Map<string, string>(); // ID -> Label/Context

  function trackId(id: string, label: string, moduleCode?: string) {
    if (!id || !id.trim()) return;
    const cleanId = id.trim();
    if (seenIds.has(cleanId)) {
      issues.push({
        id: `dup-${cleanId}-${Date.now()}`,
        category: 'duplicate_id',
        severity: 'error',
        title: `Duplikasi ID Artefak: ${cleanId}`,
        description: `ID "${cleanId}" telah digunakan pada ${seenIds.get(cleanId)} dan terulang pada ${label}.`,
        moduleCode,
        itemId: cleanId,
      });
    } else {
      seenIds.set(cleanId, label);
    }
  }

  // Lacak seluruh ID artefak
  for (const mod of fsd.modules) {
    trackId(mod.id, `Modul "${mod.name}"`, mod.code);
    mod.flows.forEach((f) => trackId(f.id, `Flow "${f.name}"`, mod.code));
    mod.screens.forEach((s) => trackId(s.id, `Screen "${s.name}"`, mod.code));
    mod.requirements.forEach((r) => trackId(r.id, `Requirement "${r.name}"`, mod.code));
    mod.businessRules.forEach((b) => trackId(b.id, `Business Rule "${b.name}"`, mod.code));
    mod.validations.forEach((v) => trackId(v.id, `Validation Rule "${v.field}"`, mod.code));
    mod.integrations.forEach((i) => trackId(i.id, `Integration "${i.name}"`, mod.code));
    mod.errorStates.forEach((e) => trackId(e.id, `Error State "${e.name}"`, mod.code));
    mod.nfrs.forEach((n) => trackId(n.id, `NFR "${n.name}"`, mod.code));
    mod.acceptanceCriteria.forEach((a) => trackId(a.id, `Acceptance Criterion "${a.name}"`, mod.code));
  }
  fsd.openItems.forEach((o) => trackId(o.id, `Open Item "${o.name}"`));
  fsd.approvals.forEach((a) => trackId(a.id, `Approval "${a.role}"`));

  // 2. Pemeriksaan Relasi Traceability (FR ke AC & Flow/Screen)
  const matrix = buildTraceabilityMatrix(fsd);
  for (const row of matrix.rows) {
    // 2.1 FR tanpa AC
    if (!row.coverage.hasAcceptanceCriterion) {
      issues.push({
        id: `missing-ac-${row.requirementId}`,
        category: 'requirement_without_ac',
        severity: 'warning',
        title: `Belum Memiliki Acceptance Criteria: ${row.requirementId}`,
        description: `Functional Requirement "${row.requirementName}" belum memiliki skenario pengujian Acceptance Criterion yang ditautkan.`,
        moduleCode: row.moduleCode,
        itemId: row.requirementId,
      });
    }

    // 2.2 FR tanpa Flow atau Screen
    if (!row.coverage.hasFlowOrScreen) {
      issues.push({
        id: `missing-ui-${row.requirementId}`,
        category: 'ui_without_flow_or_screen',
        severity: 'warning',
        title: `Belum Terhubung ke Flow / Layar: ${row.requirementId}`,
        description: `Functional Requirement "${row.requirementName}" belum ditautkan ke alur proses (Flow) maupun layar wireframe (Screen).`,
        moduleCode: row.moduleCode,
        itemId: row.requirementId,
      });
    }
  }

  // 3. Pemeriksaan Kelengkapan Integrasi
  for (const mod of fsd.modules) {
    for (const it of mod.integrations) {
      const missingFields: string[] = [];
      if (!it.owner?.trim()) missingFields.push('Owner SA');
      if (!it.input?.trim()) missingFields.push('Input / Payload');
      if (!it.outcome?.trim()) missingFields.push('Outcome / Respon');

      if (missingFields.length > 0) {
        issues.push({
          id: `incomplete-int-${it.id}`,
          category: 'incomplete_integration',
          severity: 'warning',
          title: `Kebutuhan Integrasi Belum Lengkap: ${it.id}`,
          description: `Integrasi "${it.name}" belum memiliki: ${missingFields.join(', ')}.`,
          moduleCode: mod.code,
          itemId: it.id,
        });
      }
    }
  }

  // 4. Pemeriksaan Open Items yang Masih Terbuka
  for (const oi of fsd.openItems) {
    if (oi.status === 'Open' || oi.status === 'Pending') {
      issues.push({
        id: `open-item-${oi.id}`,
        category: 'unresolved_open_item',
        severity: 'notice',
        title: `Open Item Belum Selesai: ${oi.id}`,
        description: `Isu "${oi.name}" masih berstatus "${oi.status}". Pastikan telah diputuskan atau dicatat sebagai risiko yang diterima sebelum baseline.`,
        itemId: oi.id,
      });
    }
  }

  const errorsCount = issues.filter((i) => i.severity === 'error').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;
  const noticesCount = issues.filter((i) => i.severity === 'notice').length;
  const isBaselineReady = errorsCount === 0 && warningsCount === 0;

  return {
    isBaselineReady,
    totalIssues: issues.length,
    errorsCount,
    warningsCount,
    noticesCount,
    issues,
  };
}

