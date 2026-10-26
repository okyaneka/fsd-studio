import fs from 'node:fs';
import path from 'node:path';
import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);

const {
  validateBackupDetailed,
  createBackupTemplate,
} = await jiti.import('../src/core/backupValidator.ts');

const {
  createArtifactId,
  createProject,
  createFsdDocument,
  createEmptyModule,
} = await jiti.import('../src/core/schema.ts');

console.log('Testing Milestone 5 Hardening, Schema Validation, Destructive Safeguards & Stress Test...');

// =========================================================================
// 1. Verify Schema Validation for Backup Import
// =========================================================================
console.log('1. Testing Backup Schema Validation Engine...');

// Test 1.1: Malformed input
const malformedReport = validateBackupDetailed(null);
if (malformedReport.isValid || malformedReport.errors.length === 0) {
  throw new Error('validateBackupDetailed should reject null input.');
}

// Test 1.2: Bad format or version
const badVersionReport = validateBackupDetailed({ format: 'unknown', version: '99', projects: [], fsdDocuments: [], assets: [] });
if (badVersionReport.isValid || !badVersionReport.errors.some((e) => e.includes('tidak didukung') || e.includes('tidak kompatibel'))) {
  throw new Error('validateBackupDetailed should reject unsupported format/version.');
}

// Test 1.3: Missing mandatory module sections
const invalidModPayload = {
  format: 'fsd-studio-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  projects: [{ id: 'PRJ-1', name: 'Project 1', code: 'P1', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
  fsdDocuments: [
    {
      id: 'FSD-1',
      projectId: 'PRJ-1',
      metadata: { title: 'FSD 1', code: 'FSD-01', status: 'Draft', version: '1.0' },
      modules: [
        {
          id: 'M-01',
          code: 'AUTH',
          name: 'Auth Module',
          // Missing flows, requirements, acceptanceCriteria, etc.
        },
      ],
    },
  ],
  assets: [],
};
const missingSectionReport = validateBackupDetailed(invalidModPayload);
if (missingSectionReport.isValid || !missingSectionReport.errors.some((e) => e.includes('subbagian wajib'))) {
  throw new Error('validateBackupDetailed should flag missing mandatory module sections.');
}

// Test 1.4: Template backup validation
const template = createBackupTemplate();
const templateReport = validateBackupDetailed(template);
if (!templateReport.isValid || templateReport.errors.length > 0) {
  throw new Error(`createBackupTemplate() generated an invalid payload: ${templateReport.errors.join(', ')}`);
}
console.log('✓ Backup Schema Validation Engine accurately validates payload integrity and reports field errors.');

// =========================================================================
// 2. Verify Destructive Action Safeguards & Backup Recommendations
// =========================================================================
console.log('2. Verifying Destructive Action Safeguards in Views...');

const dashboardCode = fs.readFileSync(path.resolve('src/views/ProjectDashboardView.tsx'), 'utf-8');
const projectDetailCode = fs.readFileSync(path.resolve('src/views/ProjectDetailView.tsx'), 'utf-8');
const fsdDetailCode = fs.readFileSync(path.resolve('src/views/FsdDetailView.tsx'), 'utf-8');

if (!dashboardCode.includes('Anjuran Pencadangan Data') || !dashboardCode.includes('downloadBackupFile')) {
  throw new Error('ProjectDashboardView must provide backup recommendation banner and action before deleting project.');
}
if (!projectDetailCode.includes('Anjuran Pencadangan Data') || !projectDetailCode.includes('downloadBackupFile')) {
  throw new Error('ProjectDetailView must provide backup recommendation banner and action before deleting FSD.');
}
if (!fsdDetailCode.includes('Anjuran Pencadangan Data') || !fsdDetailCode.includes('downloadBackupFile')) {
  throw new Error('FsdDetailView must provide backup recommendation banner and action before deleting Module.');
}
console.log('✓ Destructive safeguards and 1-click backup actions verified in Project, FSD, and Module views.');

// =========================================================================
// 3. Verify Empty States & Corrupted Asset Handling
// =========================================================================
console.log('3. Verifying Empty States and Asset Fallback...');

const wireframeViewerCode = fs.readFileSync(path.resolve('src/views/authoring/WireframeAssetViewer.tsx'), 'utf-8');
const modulePreviewCode = fs.readFileSync(path.resolve('src/views/preview/sections/ModulePreviewSection.tsx'), 'utf-8');

if (!wireframeViewerCode.includes('onError') || !wireframeViewerCode.includes('File gambar tidak ditemukan')) {
  throw new Error('WireframeAssetViewer must handle corrupted or missing image assets gracefully.');
}
if (!modulePreviewCode.includes('onError') || !modulePreviewCode.includes('wireframe max-w-md')) {
  throw new Error('ModulePreviewSection must provide onError protection and structured fallback mockup for missing assets.');
}
console.log('✓ Empty states and graceful asset error recovery verified.');

// =========================================================================
// 4. Large Data Stress Test (5 Projects, 10 FSDs, 25 Modules, 100+ items, 25 Assets)
// =========================================================================
console.log('4. Executing Large Data Scale Stress Test...');

const startTime = Date.now();

const projects = [];
const fsdDocuments = [];
const assets = [];

const mockBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

for (let p = 1; p <= 5; p += 1) {
  const project = createProject({
    name: `Enterprise Project ${p}`,
    code: `PRJ0${p}`,
    description: `Large scale enterprise initiative #${p}`,
    clientName: `Corporate Client ${p}`,
  });
  projects.push(project);

  for (let d = 1; d <= 2; d += 1) {
    const fsd = createFsdDocument({
      projectId: project.id,
      title: `Subsystem FSD ${p}.${d}`,
      code: `FSD-P${p}-00${d}`,
      withAuthenticationStarter: false,
    });

    for (let m = 1; m <= 3; m += 1) {
      const module = createEmptyModule({
        name: `Service Module ${p}.${d}.${m}`,
        code: `MOD${p}${d}${m}`,
      });

      // Populate 9 sections with data
      const screenId = createArtifactId('screen', `UIP${p}D${d}`, m);
      const flowId = createArtifactId('flow', `FLOWP${p}D${d}`, m);
      const reqId = createArtifactId('requirement', `REQP${p}D${d}`, m);
      const acId = createArtifactId('acceptance-criterion', `ACP${p}D${d}`, m);
      const assetId = `AST-${project.id}-${fsd.id}-${module.id}-${screenId}`;

      module.flows.push({
        id: flowId,
        name: `High volume transaction flow ${m}`,
        feature: 'Core Service',
        precondition: 'System online',
        postcondition: 'Transaction completed',
        steps: [
          { stepNumber: 1, actor: 'Customer', action: 'Submit order', systemResponse: 'Acknowledge payload' },
          { stepNumber: 2, actor: 'System', action: 'Validate balance', systemResponse: 'Dispatch event' },
        ],
      });

      module.screens.push({
        id: screenId,
        name: `Transaction Screen ${m}`,
        wireframeAssetId: assetId,
        annotations: ['Input quantity', 'Payment trigger'],
      });

      module.requirements.push({
        id: reqId,
        title: `Process Transaction ${m}`,
        description: `Module must process concurrent transactions for channel ${m}`,
        priority: 'Must Have',
        status: 'Approved',
        screenId,
        flowId,
      });

      module.acceptanceCriteria.push({
        id: acId,
        requirementIds: [reqId],
        scenarios: [
          {
            title: `Successful Transaction ${m}`,
            given: ['Account has sufficient balance'],
            when: 'Transaction request is received',
            then: ['Balance is deducted and receipt issued'],
          },
        ],
      });

      module.businessRules.push({
        id: createArtifactId('business-rule', 'BR', m),
        rule: 'Daily transaction limit cannot exceed IDR 100,000,000 without 2FA.',
        relatedRequirementIds: [reqId],
      });

      module.validations.push({
        id: createArtifactId('validation', 'VAL', m),
        field: `tx_reference_${m}`,
        condition: 'Must conform to standard UUID v4 regex.',
        message: 'Invalid transaction reference format.',
        relatedRequirementIds: [reqId],
      });

      module.integrations.push({
        id: createArtifactId('integration', 'INT', m),
        owner: `Payment Switch API ${m}`,
        input: `/v1/gateway/switch-${m}`,
        outcome: 'ISO 8583 message envelope',
        relatedRequirementIds: [reqId],
      });

      module.errorStates.push({
        id: createArtifactId('error-state', 'ERR', m),
        trigger: 'Network timeout',
        userMessage: 'Transaction timed out. Please check your status.',
        recovery: 'Retry with idempotency key.',
        relatedRequirementIds: [reqId],
      });

      module.nfrs.push({
        id: createArtifactId('nfr', 'NFR', m),
        category: 'Scalability',
        measure: 'System must sustain 5,000 TPS with p99 latency under 200ms.',
      });

      fsd.modules.push(module);

      assets.push({
        id: assetId,
        projectId: project.id,
        fsdId: fsd.id,
        moduleId: module.id,
        screenId,
        name: `wireframe-${screenId}.png`,
        mimeType: 'image/png',
        size: 1024,
        dataUrl: mockBase64Image,
      });
    }

    fsdDocuments.push(fsd);
  }
}

const largePayload = {
  format: 'fsd-studio-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  projects,
  fsdDocuments,
  assets,
};

// 4.1 Test JSON Serialization
const serialized = JSON.stringify(largePayload);
const payloadSizeKb = Math.round(serialized.length / 1024);

// 4.2 Test JSON Deserialization
const deserialized = JSON.parse(serialized);

// 4.3 Validate Large Dataset with Validation Engine
const stressReport = validateBackupDetailed(deserialized);
const elapsedMs = Date.now() - startTime;

if (!stressReport.isValid) {
  throw new Error(`Large scale dataset failed validation: ${stressReport.errors.join('; ')}`);
}

console.log(`✓ Large scale dataset processed in ${elapsedMs}ms (${payloadSizeKb} KB):`);
console.log(`  - Projects: ${stressReport.summary.projectCount}`);
console.log(`  - FSD Documents: ${stressReport.summary.fsdCount}`);
console.log(`  - Modules: ${stressReport.summary.moduleCount}`);
console.log(`  - Assets: ${stressReport.summary.assetCount}`);

console.log('\n===============================================================');
console.log('🎉 ALL MILESTONE 5 HARDENING & QUALITY ASSURANCE TESTS PASSED!');
console.log('===============================================================\n');
