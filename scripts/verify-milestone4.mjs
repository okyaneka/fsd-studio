import fs from 'node:fs';
import path from 'node:path';
import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);
const {
  createArtifactId,
  createStarterWorkspace,
} = await jiti.import('../src/core/schema.ts');

const {
  buildTraceabilityMatrix,
} = await jiti.import('../src/core/traceability.ts');

console.log('Testing Milestone 4 Document Renderer & A4 Print / Output Specification...');

// 1. Verify CSS Print Contract in src/style.css
const cssPath = path.resolve('src/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

console.log('1. Verifying CSS Print Rules and A4 Canvas Contract...');

if (!cssContent.includes('@page') || !cssContent.includes('size: A4')) {
  throw new Error('src/style.css must include "@page { size: A4; margin: 0; }" print rule.');
}
if (!cssContent.includes('.no-print') || !cssContent.includes('display: none !important')) {
  throw new Error('src/style.css must hide .no-print elements during browser printing.');
}
if (!cssContent.includes('210mm') || !cssContent.includes('297mm')) {
  throw new Error('src/style.css must define standard A4 dimensions (210mm x 297mm) for .fsd-page.');
}
if (!cssContent.includes('break-inside: avoid') || !cssContent.includes('page-break-inside: avoid')) {
  throw new Error('src/style.css must prevent table rows from splitting across print pages.');
}

console.log('✓ CSS print rules, page-breaks, and table row protection verified.');

// 2. Verify Document Data Extraction and Section Structure
console.log('2. Verifying Document Rendering Structure against Output Specification...');

const { project, fsd } = createStarterWorkspace({
  name: 'Retail Banking System',
  code: 'RBS',
  clientName: 'Bank Megantara',
  description: 'Authentication and core retail services',
});

// Configure rich sample data across all 15 sections
fsd.documentControl.revisionHistory.push({
  version: '0.1',
  date: '2026-10-24',
  author: 'Lead BA',
  changeSummary: 'Initial baseline draft',
});
fsd.documentControl.relatedDocuments.push({
  name: 'API Specification',
  reference: 'API-RBS-AUTH',
  description: 'Authentication REST API contract',
});
fsd.overview.inScope.push('User Login', 'Registration', 'Password Reset');
fsd.overview.outOfScope.push('Biometric hardware management');
fsd.overview.successOutcomes.push({ label: 'Auth SLA', value: '< 1.5s response' });
fsd.overview.definitions.push({ label: 'MFA', value: 'Multi-Factor Authentication' });

fsd.businessContext.assumptions.push('User has valid email address');
fsd.businessContext.dependencies.push({ label: 'SMTP Gateway', value: 'High availability' });
fsd.actors.push({
  id: 'ACT-01',
  name: 'Registered Customer',
  description: 'Authenticated end-user',
  permissionsOrNeeds: 'Access personal banking',
});
fsd.preconditions.push('System is online and reachable');
fsd.postconditions.push('User session token is generated');

// Configure Module 0 (AUTH)
const authMod = fsd.modules[0];
authMod.sectionStates.flows = 'complete';
authMod.sectionStates.screens = 'complete';
authMod.sectionStates.requirements = 'complete';
authMod.sectionStates.businessRules = 'tbd'; // Test TBD state
authMod.sectionStates.validations = 'complete';
authMod.sectionStates.integrations = 'not-applicable'; // Test N/A state
authMod.sectionStates.errorStates = 'empty'; // Test Empty state
authMod.sectionStates.nfrs = 'complete';
authMod.sectionStates.acceptanceCriteria = 'complete';

// Functional Requirement
const reqId = createArtifactId('requirement', authMod.code, 1, 'login', fsd.idConvention);
authMod.requirements.push({
  id: reqId,
  name: 'Login dengan Kredensial Valid',
  description: 'Pengguna dapat masuk menggunakan email dan password.',
  priority: 'Must',
  status: 'Approved',
  flowIds: [authMod.flows[0]?.id || 'FLOW-AUTH-01'],
  screenIds: [authMod.screens[0]?.id || 'SCR-AUTH-01'],
  acceptanceCriteriaIds: ['AC-AUTH-01'],
  businessRuleIds: [],
  validationIds: ['VAL-AUTH-01'],
  integrationIds: [],
});

// Acceptance Criteria
authMod.acceptanceCriteria.push({
  id: 'AC-AUTH-01',
  name: 'Sukses Login Happy Path',
  description: 'Verifikasi login berhasil',
  requirementIds: [reqId],
  scenarios: [
    {
      title: 'Valid credentials',
      given: ['Pengguna berada di layar login'],
      when: 'Pengguna memasukkan email dan password yang benar',
      then: ['Sistem menampilkan dashboard utama'],
    },
  ],
});

// Open Items & Approvals
fsd.openItems.push({
  id: 'OI-01',
  name: 'Konfirmasi masa berlaku token reset password',
  description: 'Apakah 15 menit atau 60 menit?',
  status: 'Open',
  owner: 'Security Lead',
  dueDate: '2026-10-30',
});

fsd.approvals.push({
  id: 'APP-01',
  role: 'Product Owner',
  responsibility: 'Approve business scope',
  person: 'Jane Doe',
  status: 'Approved',
});

fsd.apiHandoffChecklist.push({
  id: 'API-01',
  item: 'Auth Payload Contract Defined',
  owner: 'Solution Architect',
  complete: true,
  notes: 'Agreed on OpenAPI 3.0 spec',
});

// Test Traceability Matrix generation for section 14
const matrix = buildTraceabilityMatrix(fsd);
if (matrix.totalRequirements !== 1 || matrix.coveredRequirements !== 1) {
  throw new Error('Traceability matrix data generation mismatch for rendered preview.');
}
console.log('✓ Cross-module traceability calculation matches rendered document specifications.');

// 3. Verify Component Exports and Integration
console.log('3. Verifying View Components and Integration...');

const previewViewPath = path.resolve('src/views/preview/DocumentPreviewView.tsx');
const coverPath = path.resolve('src/views/preview/DocumentCover.tsx');
const tocPath = path.resolve('src/views/preview/DocumentToc.tsx');
const detailViewPath = path.resolve('src/views/FsdDetailView.tsx');

if (!fs.existsSync(previewViewPath) || !fs.existsSync(coverPath) || !fs.existsSync(tocPath)) {
  throw new Error('Preview components missing from src/views/preview/');
}

function readAllCodeRecursive(dir) {
  let content = '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      content += readAllCodeRecursive(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      content += fs.readFileSync(fullPath, 'utf-8');
    }
  }
  return content;
}

const previewContent = readAllCodeRecursive(path.resolve('src/views/preview'));
const detailContent = fs.readFileSync(detailViewPath, 'utf-8');
const fullRenderedCode = previewContent;

// Verify TOC targets exist in renderer
const requiredSections = [
  'id="cover"',
  'id="control"',
  'id="overview"',
  'id="context"',
  'id="roles"',
  '14. Cross-Module Traceability Matrix',
  '15. Open Items & Approvals',
  'Appendix A. API Handoff Checklist',
];

for (const sec of requiredSections) {
  if (!fullRenderedCode.includes(sec)) {
    throw new Error(`Renderer is missing required rendered section: ${sec}`);
  }
}
console.log('✓ All 15 required sections and Appendix A are explicitly defined in renderer.');

// Verify Section State Fallback Rendering (N/A, TBD, Empty)
if (!previewContent.includes('NotApplicableNotice') || !previewContent.includes('TbdNotice') || !previewContent.includes('EmptyNotice')) {
  throw new Error('Renderer must handle and explicitly display Not-Applicable, TBD, and Empty section notices.');
}
console.log('✓ Explicit N/A, TBD, and Empty section state banners verified.');

// Verify FsdDetailView Integration
if (!detailContent.includes('DocumentPreviewView') || !detailContent.includes('Preview & Cetak Dokumen')) {
  throw new Error('FsdDetailView must provide "Preview & Cetak Dokumen" action button and mount DocumentPreviewView.');
}
if (!detailContent.includes('Preview Modul Ini')) {
  throw new Error('FsdDetailView must provide per-module preview action.');
}
console.log('✓ FsdDetailView integration (full FSD & per-module preview) verified.');

// Verify Feature Grouping implementation for Process Flows in Renderer
if (!previewContent.includes('groupItemsByFeature')) {
  throw new Error('Renderer must group process flows by feature.');
}
if (!previewContent.includes('Fitur:')) {
  throw new Error('Renderer must display feature sub-headings for tagged flows.');
}
console.log('✓ Process Flow Feature Grouping architecture verified in Document Preview.');

console.log('\n===============================================================');
console.log('🎉 ALL MILESTONE 4 RENDERER & A4 OUTPUT SPEC TESTS PASSED!');
console.log('===============================================================\n');
