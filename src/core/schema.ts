import { APPROVAL_STATUSES, BACKUP_FORMAT, BACKUP_VERSION, DOCUMENT_STATUSES, MODULE_SECTIONS, OPEN_ITEM_STATUSES, REQUIREMENT_STATUSES } from './constants';
import type { AssetRecord, BackupAsset, BackupPayload, FsdDocument, FsdModule, IdConvention, ModuleSection, Project, Screen } from './types';

const now = () => new Date().toISOString();
const token = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Internal record IDs are opaque and immutable. User-visible IDs are generated with createArtifactId. */
export function createId(prefix: 'project' | 'fsd' | 'module' | 'asset'): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export type ArtifactKind = 'flow' | 'screen' | 'requirement' | 'businessRule' | 'validation' | 'integration' | 'acceptanceCriterion' | 'openItem';
const artifactPrefix: Record<ArtifactKind, string> = { flow: 'FLOW', screen: 'SCR', requirement: 'FR', businessRule: 'BR', validation: 'VAL', integration: 'INT', acceptanceCriterion: 'AC', openItem: 'OI' };
export const DEFAULT_ID_CONVENTION: IdConvention = Object.freeze({ prefix: '', sequenceDigits: 2 });

/** Persist this generated ID; it is never recalculated when a title or project changes. */
export function createArtifactId(kind: ArtifactKind, moduleCode: string, sequence: number, qualifier?: string, convention: IdConvention = DEFAULT_ID_CONVENTION): string {
  const code = normalizeModuleCode(moduleCode);
  const documentPrefix = normalizeIdPrefix(convention.prefix);
  if (!code) throw new Error('A module code is required for an artefact ID.');
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('Artefact ID sequence must be a positive integer.');
  if (convention.sequenceDigits !== 2) throw new Error('Visible artefact IDs use a fixed two-digit sequence.');
  const namespace = [documentPrefix, code].filter(Boolean).join('-');
  const ordinal = String(sequence).padStart(convention.sequenceDigits, '0');
  if (kind === 'flow' || kind === 'screen' || kind === 'integration') return `${artifactPrefix[kind]}-${namespace}-${token(qualifier || String(sequence))}`;
  if ((kind === 'requirement' || kind === 'acceptanceCriterion' || kind === 'validation') && qualifier) return `${artifactPrefix[kind]}-${namespace}-${token(qualifier)}-${ordinal}`;
  return `${artifactPrefix[kind]}-${namespace}-${ordinal}`;
}
export function normalizeModuleCode(value: unknown): string { return token(String(value ?? '')).slice(0, 24); }
/** Prefix is optional, uppercase, and reserved for an FSD-wide user-visible namespace. */
export function normalizeIdPrefix(value: unknown): string { return token(String(value ?? '')).slice(0, 24); }

export function createEmptyModule({ name = 'Untitled module', code = 'MODULE', description = '' }: Partial<Pick<FsdModule, 'name' | 'code' | 'description'>> = {}): FsdModule {
  return {
    id: createId('module'), code: normalizeModuleCode(code) || 'MODULE', name: name.trim() || 'Untitled module', description,
    features: [],
    sectionStates: Object.fromEntries(MODULE_SECTIONS.map((section) => [section, 'empty'])) as Record<ModuleSection, FsdModule['sectionStates'][ModuleSection]>,
    flows: [], screens: [], requirements: [], businessRules: [], validations: [], integrations: [], errorStates: [], nfrs: [], acceptanceCriteria: [],
  };
}
export function createAuthenticationStarterModule(convention: IdConvention = DEFAULT_ID_CONVENTION): FsdModule {
  const module = createEmptyModule({ name: 'Authentication', code: 'AUTH', description: 'Starter module covering login, registration, email verification, and password reset.' });
  const names = ['Login', 'Registration', 'Email verification', 'Password reset'];
  module.features = [...names];
  module.flows = names.map((name, index) => ({ id: createArtifactId('flow', module.code, index + 1, name, convention), name, description: '', steps: [], alternativePaths: [], notes: '', feature: name }));
  module.screens = names.map((name, index) => createStarterScreen(createArtifactId('screen', module.code, index + 1, name, convention), name));
  module.sectionStates.flows = 'in-progress'; module.sectionStates.screens = 'in-progress';
  return module;
}
function createStarterScreen(id: string, name: string): Screen { return { id, name, description: '', wireframeAssetId: null, imageCaption: '', imageAlt: '', orientation: 'auto', annotations: [] }; }

interface CreateFsdOptions { projectId: string; title?: string; code?: string; idPrefix?: string; withAuthenticationStarter?: boolean; }
export function createFsdDocument({ projectId, title = 'Untitled FSD', code = 'FSD-001', idPrefix = '', withAuthenticationStarter = false }: CreateFsdOptions): FsdDocument {
  if (!projectId) throw new Error('projectId is required to create an FSD document.');
  const timestamp = now();
  const idConvention: IdConvention = { prefix: normalizeIdPrefix(idPrefix), sequenceDigits: 2 };
  return { id: createId('fsd'), projectId, metadata: { title: title.trim() || 'Untitled FSD', code: code.trim() || 'FSD-001', version: '0.1', status: 'Draft', author: '', reviewers: [], targetRelease: '', createdAt: timestamp, updatedAt: timestamp }, idConvention, documentControl: { revisionHistory: [], relatedDocuments: [] }, overview: { objective: '', inScope: [], outOfScope: [], successOutcomes: [], definitions: [] }, businessContext: { summary: '', assumptions: [], dependencies: [] }, actors: [], preconditions: [], postconditions: [], modules: withAuthenticationStarter ? [createAuthenticationStarterModule(idConvention)] : [], openItems: [], approvals: [], traceabilityLinks: [], apiHandoffChecklist: [] };
}
export function createProject({ name = 'Untitled project', code = '', description = '', clientName = '' }: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> = {}): Project { const timestamp = now(); return { id: createId('project'), name: name.trim() || 'Untitled project', code: code.trim(), description, clientName, createdAt: timestamp, updatedAt: timestamp }; }
export function createStarterWorkspace(input: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> = {}): { project: Project; fsd: FsdDocument } { const project = createProject(input); return { project, fsd: createFsdDocument({ projectId: project.id, title: 'Authentication', code: project.code ? `FSD-${token(project.code)}-001` : 'FSD-001', withAuthenticationStarter: true }) }; }
export function createBackupPayload({ projects, fsdDocuments, assets }: { projects: Project[]; fsdDocuments: FsdDocument[]; assets: BackupAsset[] }): BackupPayload { return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now(), projects, fsdDocuments, assets }; }

/** Validates record shape and every stored parent/child relation before restore replaces data. */
export function validateBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!isRecord(payload) || payload.format !== BACKUP_FORMAT || payload.version !== BACKUP_VERSION) throw new Error('Backup format or version is not supported.');
  if (!Array.isArray(payload.projects) || !Array.isArray(payload.fsdDocuments) || !Array.isArray(payload.assets)) throw new Error('Backup collections must be arrays.');
  const projectIds = collectIds(payload.projects, isProject, 'project');
  const documentIds = collectIds(payload.fsdDocuments, (x): x is FsdDocument => isDocument(x) && projectIds.has(x.projectId), 'FSD document');
  const moduleIds = new Set<string>(); const screenIds = new Set<string>();
  for (const document of payload.fsdDocuments) for (const module of document.modules) { if (moduleIds.has(module.id)) throw new Error('Backup contains duplicate module IDs.'); moduleIds.add(module.id); for (const screen of module.screens) { if (screenIds.has(screen.id)) throw new Error('Backup contains duplicate screen IDs.'); screenIds.add(screen.id); } }
  collectIds(payload.assets, (x): x is BackupAsset => isBackupAsset(x) && projectIds.has(x.projectId) && documentIds.has(x.fsdId) && moduleIds.has(x.moduleId) && screenIds.has(x.screenId), 'asset');
}
function collectIds<T extends { id: string }>(items: unknown[], valid: (value: unknown) => value is T, label: string): Set<string> { const ids = new Set<string>(); for (const item of items) { if (!valid(item) || ids.has(item.id)) throw new Error(`Backup contains an invalid or duplicate ${label}.`); ids.add(item.id); } return ids; }
function isProject(value: unknown): value is Project { return isRecord(value) && nonEmpty(value.id) && nonEmpty(value.name) && nonEmpty(value.createdAt) && nonEmpty(value.updatedAt); }
function isDocument(value: unknown): value is FsdDocument { return isRecord(value) && nonEmpty(value.id) && nonEmpty(value.projectId) && isRecord(value.metadata) && nonEmpty(value.metadata.title) && isDocumentStatus(value.metadata.status) && isIdConvention(value.idConvention) && Array.isArray(value.modules) && value.modules.every(isModule); }
function isModule(value: unknown): value is FsdModule { return isRecord(value) && nonEmpty(value.id) && nonEmpty(value.code) && nonEmpty(value.name) && isSectionStates(value.sectionStates) && Array.isArray(value.flows) && Array.isArray(value.screens) && value.screens.every(isScreen) && Array.isArray(value.requirements) && Array.isArray(value.businessRules) && Array.isArray(value.validations) && Array.isArray(value.integrations) && Array.isArray(value.errorStates) && Array.isArray(value.nfrs) && Array.isArray(value.acceptanceCriteria); }
function isScreen(value: unknown): value is Screen { return isRecord(value) && nonEmpty(value.id) && nonEmpty(value.name) && (value.wireframeAssetId === null || typeof value.wireframeAssetId === 'string') && Array.isArray(value.annotations); }
function isBackupAsset(value: unknown): value is BackupAsset { return isRecord(value) && nonEmpty(value.id) && nonEmpty(value.projectId) && nonEmpty(value.fsdId) && nonEmpty(value.moduleId) && nonEmpty(value.screenId) && nonEmpty(value.name) && isImageMimeType(value.mimeType) && typeof value.size === 'number' && value.size >= 0 && nonEmpty(value.dataUrl) && /^data:image\/(png|jpeg|webp);base64,/.test(value.dataUrl); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function nonEmpty(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function isIdConvention(value: unknown): value is IdConvention { return isRecord(value) && typeof value.prefix === 'string' && value.prefix === normalizeIdPrefix(value.prefix) && value.sequenceDigits === 2; }
function isSectionStates(value: unknown): value is Record<ModuleSection, FsdModule['sectionStates'][ModuleSection]> { return isRecord(value) && MODULE_SECTIONS.every((section) => isSectionState(value[section])); }
function isSectionState(value: unknown): boolean { return value === 'empty' || value === 'in-progress' || value === 'not-applicable' || value === 'tbd' || value === 'complete'; }
function isImageMimeType(value: unknown): value is AssetRecord['mimeType'] { return value === 'image/png' || value === 'image/jpeg' || value === 'image/webp'; }
export function isDocumentStatus(value: unknown): boolean { return typeof value === 'string' && DOCUMENT_STATUSES.includes(value as FsdDocument['metadata']['status']); }
export function isRequirementStatus(value: unknown): boolean { return typeof value === 'string' && REQUIREMENT_STATUSES.includes(value as FsdModule['requirements'][number]['status']); }
export function isOpenItemStatus(value: unknown): boolean { return typeof value === 'string' && OPEN_ITEM_STATUSES.includes(value as FsdDocument['openItems'][number]['status']); }
export function isApprovalStatus(value: unknown): boolean { return typeof value === 'string' && APPROVAL_STATUSES.includes(value as FsdDocument['approvals'][number]['status']); }
