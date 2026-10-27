export type SectionState = 'empty' | 'in-progress' | 'not-applicable' | 'tbd' | 'complete';
export type DocumentStatus = 'Draft' | 'In Review' | 'Baseline' | 'Superseded';
export type RequirementStatus = 'Draft' | 'Proposed' | 'Approved' | 'Changed' | 'Deprecated';
export type OpenItemStatus = 'Open' | 'Pending' | 'Resolved' | 'Accepted risk';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Not applicable';
export type ModuleSection = 'flows' | 'screens' | 'requirements' | 'businessRules' | 'validations' | 'integrations' | 'errorStates' | 'nfrs' | 'acceptanceCriteria';

export interface Project { id: string; name: string; code: string; description: string; clientName: string; createdAt: string; updatedAt: string; }
export interface IdentifiedItem { id: string; name: string; description: string; }
export interface ReferenceItem { label: string; value: string; }
export interface RevisionHistoryEntry { version: string; date: string; author: string; changeSummary: string; }
export interface RelatedDocument { name: string; reference: string; description: string; }
export interface Actor { id: string; name: string; description: string; permissionsOrNeeds: string; }
export interface FlowStep { order: number; actor: string; action: string; systemResponse: string; requirementIds: string[]; }
export interface Flow extends IdentifiedItem { steps: FlowStep[]; alternativePaths: FlowStep[]; notes: string; feature?: string; }
export interface ScreenAnnotation { number: number; text: string; requirementIds: string[]; validationIds: string[]; }
export interface Screen extends IdentifiedItem { wireframeAssetId: string | null; imageCaption: string; imageAlt: string; orientation: 'auto' | 'portrait' | 'landscape'; annotations: ScreenAnnotation[]; }
export interface FunctionalRequirement extends IdentifiedItem { status: RequirementStatus; priority: 'Must' | 'Should' | 'Could' | 'Won\'t'; flowIds: string[]; screenIds: string[]; acceptanceCriteriaIds: string[]; }
export interface BusinessRule extends IdentifiedItem { rationale: string; relatedRequirementIds: string[]; }
export interface ValidationRuleItem {
  rule: string;
  value?: string;
  errorMessage: string;
}

export interface ValidationRule extends IdentifiedItem {
  field: string;
  condition: string;
  message: string;
  rules?: ValidationRuleItem[];
  relatedRequirementIds: string[];
}
export interface IntegrationRequirement extends IdentifiedItem { owner: string; input: string; outcome: string; relatedRequirementIds: string[]; }
export interface ErrorState extends IdentifiedItem { trigger: string; userMessage: string; recovery: string; relatedRequirementIds: string[]; }
export interface NonFunctionalRequirement extends IdentifiedItem { category: string; measure: string; }
export interface GivenWhenThenScenario { title?: string; given: string[]; when: string; then: string[]; }
export interface AcceptanceCriterion extends IdentifiedItem {
  requirementIds: string[];
  given?: string;
  when?: string;
  then?: string;
  scenarios?: GivenWhenThenScenario[];
}
export interface ModuleSections { flows: Flow[]; screens: Screen[]; requirements: FunctionalRequirement[]; businessRules: BusinessRule[]; validations: ValidationRule[]; integrations: IntegrationRequirement[]; errorStates: ErrorState[]; nfrs: NonFunctionalRequirement[]; acceptanceCriteria: AcceptanceCriterion[]; }
export interface FsdModule extends ModuleSections { id: string; code: string; name: string; description: string; sectionStates: Record<ModuleSection, SectionState>; features?: string[]; }
export interface DocumentMetadata { title: string; code: string; version: string; status: DocumentStatus; author: string; reviewers: string[]; targetRelease: string; createdAt: string; updatedAt: string; }
export interface DocumentControl { revisionHistory: RevisionHistoryEntry[]; relatedDocuments: RelatedDocument[]; }
export interface DocumentOverview { objective: string; inScope: string[]; outOfScope: string[]; successOutcomes: ReferenceItem[]; definitions: ReferenceItem[]; }
export interface BusinessContext { summary: string; assumptions: string[]; dependencies: ReferenceItem[]; }
export interface OpenItem extends IdentifiedItem { status: OpenItemStatus; owner: string; dueDate: string | null; }
export interface Approval { id: string; role: string; responsibility: string; person: string; status: ApprovalStatus; }
export interface TraceabilityLink { requirementId: string; flowIds: string[]; screenIds: string[]; validationIds: string[]; acceptanceCriteriaIds: string[]; }
export interface ApiHandoffChecklistItem { id: string; item: string; owner: string; complete: boolean; notes: string; }
/** User-defined document namespace plus fixed two-digit sequence rule for visible artefact IDs. */
export interface IdConvention { prefix: string; sequenceDigits: 2; }
export interface FsdDocument { id: string; projectId: string; metadata: DocumentMetadata; idConvention: IdConvention; documentControl: DocumentControl; overview: DocumentOverview; businessContext: BusinessContext; actors: Actor[]; preconditions: string[]; postconditions: string[]; modules: FsdModule[]; openItems: OpenItem[]; approvals: Approval[]; traceabilityLinks: TraceabilityLink[]; apiHandoffChecklist: ApiHandoffChecklistItem[]; }
export interface AssetRecord { id: string; projectId: string; fsdId: string; moduleId: string; screenId: string; name: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp'; size: number; blob: Blob; createdAt: string; }
export interface BackupAsset extends Omit<AssetRecord, 'blob'> { dataUrl: string; }
export interface WorkspaceRecords { projects: Project[]; fsdDocuments: FsdDocument[]; assets: AssetRecord[]; }
export interface BackupPayload extends Omit<WorkspaceRecords, 'assets'> { format: string; version: number; exportedAt: string; assets: BackupAsset[]; }
