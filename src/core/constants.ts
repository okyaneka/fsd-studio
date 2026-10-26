export const DATABASE_NAME = 'fsd-studio';
export const DATABASE_VERSION = 2;

export const STORES = Object.freeze({
  projects: 'projects',
  fsdDocuments: 'fsdDocuments',
  assets: 'assets',
});

export const DOCUMENT_STATUSES = ['Draft', 'In Review', 'Baseline', 'Superseded'] as const;
export const REQUIREMENT_STATUSES = ['Draft', 'Proposed', 'Approved', 'Changed', 'Deprecated'] as const;
export const OPEN_ITEM_STATUSES = ['Open', 'Pending', 'Resolved', 'Accepted risk'] as const;
export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected', 'Not applicable'] as const;

export const MODULE_SECTIONS = [
  'flows',
  'screens',
  'requirements',
  'businessRules',
  'validations',
  'integrations',
  'errorStates',
  'nfrs',
  'acceptanceCriteria',
] as const;

export const BACKUP_FORMAT = 'fsd-studio-backup';
export const BACKUP_VERSION = 1;
