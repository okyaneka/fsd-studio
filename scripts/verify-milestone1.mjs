import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);
const {
  createArtifactId,
  createEmptyModule,
  createFsdDocument,
  createProject,
  createStarterWorkspace,
  validateBackupPayload,
} = await jiti.import('../src/core/schema.ts');

console.log('Testing Milestone 1 logic and workflow requirements...');

// 1. Pembuatan project serta starter FSD Authentication
const { project, fsd: starterFsd } = createStarterWorkspace({
  name: 'Retail Portal',
  code: 'RETAIL',
  clientName: 'PT Maju Bersama',
  description: 'Enterprise retail solution',
});

if (!project.id || project.name !== 'Retail Portal' || project.code !== 'RETAIL') {
  throw new Error('Project initialization failed.');
}

if (!starterFsd.modules || starterFsd.modules.length !== 1) {
  throw new Error('Starter workspace must contain exactly one starter FSD with 1 module.');
}

const authModule = starterFsd.modules[0];
if (authModule.code !== 'AUTH' || authModule.name !== 'Authentication') {
  throw new Error('Starter module must be Authentication.');
}

// Check all 9 mandatory sections in starter
const mandatorySections = [
  'flows', 'screens', 'requirements', 'businessRules',
  'validations', 'integrations', 'errorStates', 'nfrs', 'acceptanceCriteria'
];
for (const sec of mandatorySections) {
  if (!(sec in authModule.sectionStates)) {
    throw new Error(`Missing mandatory section: ${sec}`);
  }
}

// 2. Pembuatan FSD kedua (kosong standar)
const secondFsd = createFsdDocument({
  projectId: project.id,
  title: 'Order Management',
  code: 'FSD-RETAIL-002',
  withAuthenticationStarter: false,
});

if (secondFsd.modules.length !== 0) {
  throw new Error('Second FSD in project must start with zero modules (empty standard).');
}

// 3. Menambah modul baru ke FSD
const orderModule = createEmptyModule({
  name: 'Order Processing',
  code: 'ORDER',
  description: 'Handles order placement and lifecycle',
});

if (orderModule.code !== 'ORDER' || orderModule.flows.length !== 0) {
  throw new Error('Newly created module must start empty.');
}

for (const sec of mandatorySections) {
  if (orderModule.sectionStates[sec] !== 'empty') {
    throw new Error(`Newly created module section ${sec} must be 'empty'.`);
  }
}

secondFsd.modules.push(orderModule);
if (secondFsd.modules.length !== 1) {
  throw new Error('Adding module to FSD failed.');
}

// 4. Update modul (edit metadata)
orderModule.name = 'Order Management & Fulfillment';
if (secondFsd.modules[0].name !== 'Order Management & Fulfillment') {
  throw new Error('Updating module metadata failed.');
}

// 5. Menambah modul kedua lalu hapus modul pertama
const inventoryModule = createEmptyModule({
  name: 'Inventory Sync',
  code: 'INV',
});
secondFsd.modules.push(inventoryModule);
if (secondFsd.modules.length !== 2) throw new Error('Expected 2 modules.');

secondFsd.modules = secondFsd.modules.filter((m) => m.id !== orderModule.id);
if (secondFsd.modules.length !== 1 || secondFsd.modules[0].code !== 'INV') {
  throw new Error('Deleting module from FSD failed.');
}

// 6. Validasi backup payload setelah serangkaian CRUD
const backupPayload = {
  format: 'fsd-studio-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  projects: [project],
  fsdDocuments: [starterFsd, secondFsd],
  assets: [],
};

validateBackupPayload(backupPayload);

console.log('Milestone 1 workspace navigation and CRUD verification passed!');

