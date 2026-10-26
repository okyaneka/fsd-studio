import type { FsdDocument } from './types';

export interface TraceabilityRow {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  requirementId: string;
  requirementName: string;
  requirementPriority: string;
  requirementStatus: string;
  flowIds: string[];
  screenIds: string[];
  validationIds: string[];
  integrationIds: string[];
  acceptanceCriteriaIds: string[];
  coverage: {
    hasFlowOrScreen: boolean;
    hasAcceptanceCriterion: boolean;
    isFullyCovered: boolean;
  };
}

export interface TraceabilitySummary {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
  missingAcCount: number;
  missingUiCount: number;
  rows: TraceabilityRow[];
}

/**
 * Membangun matriks ketertelusuran (Traceability Matrix) lintas modul
 * berdasarkan relasi Functional Requirement dengan Flow, Layar, Validasi, Integrasi, dan AC.
 */
export function buildTraceabilityMatrix(fsd: FsdDocument): TraceabilitySummary {
  const rows: TraceabilityRow[] = [];

  for (const module of fsd.modules) {
    for (const req of module.requirements) {
      // 1. Kumpulkan Flow IDs (dari req.flowIds dan FlowStep.requirementIds)
      const flowIdSet = new Set<string>(req.flowIds || []);
      for (const flow of module.flows) {
        const matchesStep = flow.steps?.some((st) => st.requirementIds?.includes(req.id));
        const matchesAlt = flow.alternativePaths?.some((st) => st.requirementIds?.includes(req.id));
        if (matchesStep || matchesAlt) {
          flowIdSet.add(flow.id);
        }
      }

      // 2. Kumpulkan Screen IDs (dari req.screenIds dan ScreenAnnotation.requirementIds)
      const screenIdSet = new Set<string>(req.screenIds || []);
      for (const screen of module.screens) {
        const matchesAnn = screen.annotations?.some((ann) => ann.requirementIds?.includes(req.id));
        if (matchesAnn) {
          screenIdSet.add(screen.id);
        }
      }

      // 3. Kumpulkan Validation IDs
      const validationIdSet = new Set<string>();
      for (const val of module.validations) {
        if (val.relatedRequirementIds?.includes(req.id)) {
          validationIdSet.add(val.id);
        }
      }

      // 4. Kumpulkan Integration IDs
      const integrationIdSet = new Set<string>();
      for (const int of module.integrations) {
        if (int.relatedRequirementIds?.includes(req.id)) {
          integrationIdSet.add(int.id);
        }
      }

      // 5. Kumpulkan Acceptance Criteria IDs (dari req.acceptanceCriteriaIds dan AC.requirementIds)
      const acIdSet = new Set<string>(req.acceptanceCriteriaIds || []);
      for (const ac of module.acceptanceCriteria) {
        if (ac.requirementIds?.includes(req.id)) {
          acIdSet.add(ac.id);
        }
      }

      const hasFlowOrScreen = flowIdSet.size > 0 || screenIdSet.size > 0;
      const hasAcceptanceCriterion = acIdSet.size > 0;
      const isFullyCovered = hasFlowOrScreen && hasAcceptanceCriterion;

      rows.push({
        moduleId: module.id,
        moduleCode: module.code,
        moduleName: module.name,
        requirementId: req.id,
        requirementName: req.name,
        requirementPriority: req.priority,
        requirementStatus: req.status,
        flowIds: Array.from(flowIdSet),
        screenIds: Array.from(screenIdSet),
        validationIds: Array.from(validationIdSet),
        integrationIds: Array.from(integrationIdSet),
        acceptanceCriteriaIds: Array.from(acIdSet),
        coverage: {
          hasFlowOrScreen,
          hasAcceptanceCriterion,
          isFullyCovered,
        },
      });
    }
  }

  const totalRequirements = rows.length;
  const coveredRequirements = rows.filter((r) => r.coverage.isFullyCovered).length;
  const missingAcCount = rows.filter((r) => !r.coverage.hasAcceptanceCriterion).length;
  const missingUiCount = rows.filter((r) => !r.coverage.hasFlowOrScreen).length;
  const coveragePercentage = totalRequirements > 0 ? Math.round((coveredRequirements / totalRequirements) * 100) : 100;

  return {
    totalRequirements,
    coveredRequirements,
    coveragePercentage,
    missingAcCount,
    missingUiCount,
    rows,
  };
}

/**
 * Melakukan sinkronisasi dua arah untuk seluruh relasi FSD
 * agar ID yang tertaut di satu sisi otomatis tercatat di sisi pasangannya.
 */
export function syncDocumentRelations(fsd: FsdDocument): FsdDocument {
  const updatedModules = fsd.modules.map((mod) => {
    const requirements = [...mod.requirements];
    const acceptanceCriteria = [...mod.acceptanceCriteria];
    const validations = [...mod.validations];
    const integrations = [...mod.integrations];

    // Sinkronkan FR <-> AC
    for (const req of requirements) {
      if (!req.acceptanceCriteriaIds) req.acceptanceCriteriaIds = [];
      for (const ac of acceptanceCriteria) {
        if (!ac.requirementIds) ac.requirementIds = [];
        if (req.acceptanceCriteriaIds.includes(ac.id) && !ac.requirementIds.includes(req.id)) {
          ac.requirementIds.push(req.id);
        }
        if (ac.requirementIds.includes(req.id) && !req.acceptanceCriteriaIds.includes(ac.id)) {
          req.acceptanceCriteriaIds.push(ac.id);
        }
      }
    }

    return {
      ...mod,
      requirements,
      acceptanceCriteria,
      validations,
      integrations,
    };
  });

  return {
    ...fsd,
    modules: updatedModules,
  };
}

