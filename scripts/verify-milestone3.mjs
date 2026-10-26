import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);
const {
  createArtifactId,
  createStarterWorkspace,
} = await jiti.import('../src/core/schema.ts');

const {
  buildTraceabilityMatrix,
  syncDocumentRelations,
} = await jiti.import('../src/core/traceability.ts');

const {
  checkFsdCompleteness,
} = await jiti.import('../src/core/integrity.ts');

console.log('Testing Milestone 3 Traceability Matrix & Document Integrity Engine...');

// 1. Initial starter workspace test
const { fsd } = createStarterWorkspace({
  name: 'Digital Banking System',
  code: 'DBS',
  clientName: 'Bank Megantara',
  description: 'Corporate Internet & Mobile Banking',
});

if (!fsd || fsd.modules.length === 0) {
  throw new Error('Failed to initialize starter workspace.');
}

const authMod = fsd.modules[0];
console.log('✓ Starter workspace initialized with Authentication module.');

// 2. Populate realistic requirements and artefacts for testing
const req1Id = createArtifactId('requirement', authMod.code, 1, 'user-login', fsd.idConvention);
const req2Id = createArtifactId('requirement', authMod.code, 2, 'mfa-otp', fsd.idConvention);
const req3Id = createArtifactId('requirement', authMod.code, 3, 'forgot-password', fsd.idConvention);

const flow1Id = authMod.flows[0]?.id || 'FLOW-AUTH-01';
const flow2Id = authMod.flows[1]?.id || 'FLOW-AUTH-02';
const screen1Id = authMod.screens[0]?.id || 'SCR-AUTH-01';
const screen2Id = authMod.screens[1]?.id || 'SCR-AUTH-02';

const br1Id = createArtifactId('businessRule', authMod.code, 1, undefined, fsd.idConvention);
const val1Id = createArtifactId('validation', authMod.code, 1, 'password-policy', fsd.idConvention);
const int1Id = createArtifactId('integration', authMod.code, 1, 'sms-otp-gateway', fsd.idConvention);
const ac1Id = createArtifactId('acceptanceCriterion', authMod.code, 1, undefined, fsd.idConvention);
const ac2Id = createArtifactId('acceptanceCriterion', authMod.code, 2, undefined, fsd.idConvention);

// Setup Artefacts
authMod.businessRules.push({
  id: br1Id,
  name: 'Lockout Setelah 3 Kali Gagal',
  description: 'Akun dikunci 15 menit jika 3x gagal berturut-turut.',
  rationale: 'Mitigasi brute force attack',
  relatedRequirementIds: [req1Id],
});

authMod.validations.push({
  id: val1Id,
  name: 'Format Password Kuat',
  field: 'password',
  description: 'Standar kata sandi',
  condition: 'Minimal 8 karakter, 1 huruf besar, 1 angka, 1 simbol',
  message: 'Kata sandi belum memenuhi kriteria keamanan.',
  relatedRequirementIds: [req1Id, req3Id],
});

authMod.integrations.push({
  id: int1Id,
  name: 'SMS OTP Provider Gateway',
  description: 'Pengiriman token verifikasi OTP melalui SMS',
  owner: 'Telco Aggregator SA',
  input: 'phone_number, session_id',
  outcome: 'http_200, message_id',
  relatedRequirementIds: [req2Id],
});

authMod.acceptanceCriteria.push(
  {
    id: ac1Id,
    name: 'Login Berhasil dengan Kredensial Valid',
    description: 'Happy path otentikasi pengguna',
    requirementIds: [req1Id],
    scenarios: [
      {
        title: 'Happy Path',
        given: ['Pengguna berada di layar login', 'Memiliki akun aktif'],
        when: 'Pengguna menginput username dan password yang benar',
        then: ['Sistem memberikan token sesi', 'Sistem mengarahkan ke Dashboard'],
      },
    ],
  },
  {
    id: ac2Id,
    name: 'Verifikasi OTP MFA Berhasil',
    description: 'Pengecekan kode 6-digit',
    requirementIds: [req2Id],
    scenarios: [
      {
        title: 'OTP Valid',
        given: ['Pengguna telah melewati tahap pertama otentikasi'],
        when: 'Pengguna memasukkan 6 digit kode OTP yang aktif',
        then: ['Sistem menyetujui login'],
      },
    ],
  }
);

// Setup Requirements:
// REQ 1: Covered (has Flow, Screen, and AC)
// REQ 2: Missing UI (has AC, but no Flow/Screen)
// REQ 3: Missing AC (has Flow/Screen, but no AC)
authMod.requirements = [
  {
    id: req1Id,
    name: 'Autentikasi Username & Password',
    description: 'Pengguna dapat masuk menggunakan identifier dan password terdaftar.',
    priority: 'Must',
    status: 'Approved',
    flowIds: [flow1Id],
    screenIds: [screen1Id],
    acceptanceCriteriaIds: [ac1Id],
    businessRuleIds: [br1Id],
    validationIds: [val1Id],
    integrationIds: [],
  },
  {
    id: req2Id,
    name: 'Two-Factor Authentication (OTP)',
    description: 'Verifikasi layer kedua melalui kode OTP.',
    priority: 'Must',
    status: 'In Review',
    flowIds: [], // Missing UI/Flow
    screenIds: [],
    acceptanceCriteriaIds: [ac2Id],
    businessRuleIds: [],
    validationIds: [],
    integrationIds: [int1Id],
  },
  {
    id: req3Id,
    name: 'Lupa Kata Sandi',
    description: 'Reset password via tautan email atau SMS.',
    priority: 'Should',
    status: 'Draft',
    flowIds: [flow2Id],
    screenIds: [screen2Id],
    acceptanceCriteriaIds: [], // Missing AC
    businessRuleIds: [],
    validationIds: [val1Id],
    integrationIds: [],
  },
];

// 3. Test Traceability Matrix Generation
let summary = buildTraceabilityMatrix(fsd);

console.log(`Traceability Summary:`, {
  totalReqs: summary.totalRequirements,
  covered: summary.coveredRequirements,
  missingAc: summary.missingAcCount,
  missingUi: summary.missingUiCount,
  pct: `${summary.coveragePercentage}%`,
});

if (summary.totalRequirements !== 3) {
  throw new Error(`Expected 3 total requirements, got ${summary.totalRequirements}`);
}
if (summary.coveredRequirements !== 1) {
  throw new Error(`Expected 1 fully covered requirement, got ${summary.coveredRequirements}`);
}
if (summary.missingAcCount !== 1) {
  throw new Error(`Expected 1 requirement missing AC, got ${summary.missingAcCount}`);
}
if (summary.missingUiCount !== 1) {
  throw new Error(`Expected 1 requirement missing UI, got ${summary.missingUiCount}`);
}
if (Math.round(summary.coveragePercentage) !== 33) {
  throw new Error(`Expected ~33% coverage percentage, got ${summary.coveragePercentage}%`);
}

// Check row details
const row1 = summary.rows.find((r) => r.requirementId === req1Id);
if (!row1 || !row1.coverage.isFullyCovered || row1.flowIds.length === 0 || row1.screenIds.length === 0) {
  throw new Error('Row 1 (REQ-AUTH-01) resolution mismatch.');
}
const row2 = summary.rows.find((r) => r.requirementId === req2Id);
if (!row2 || row2.coverage.hasFlowOrScreen || row2.coverage.isFullyCovered) {
  throw new Error('Row 2 (REQ-AUTH-02) should be flagged with missing UI.');
}
const row3 = summary.rows.find((r) => r.requirementId === req3Id);
if (!row3 || row3.coverage.hasAcceptanceCriterion || row3.coverage.isFullyCovered) {
  throw new Error('Row 3 (REQ-AUTH-03) should be flagged with missing AC.');
}

console.log('✓ Traceability Matrix accurately calculates rows, links, and coverage metrics.');

// 4. Test Bi-directional Document Relation Sync
// Give REQ-03 an Acceptance Criterion via AC requirementIds
const ac3Id = createArtifactId('acceptanceCriterion', authMod.code, 3, undefined, fsd.idConvention);
authMod.acceptanceCriteria.push({
  id: ac3Id,
  name: 'Kirim Tautan Reset Password',
  description: 'Validasi pengiriman instruksi reset kata sandi',
  requirementIds: [req3Id],
  scenarios: [
    {
      title: 'Reset link sent',
      given: ['Pengguna memasukkan email terdaftar'],
      when: 'Pengguna menekan tombol kirim tautan reset',
      then: ['Sistem mengirim email instruksi reset'],
    },
  ],
});

// Run sync
const syncedFsd = syncDocumentRelations(fsd);
const syncedMod = syncedFsd.modules[0];
const syncedReq3 = syncedMod.requirements.find((r) => r.id === req3Id);

if (!syncedReq3 || !syncedReq3.acceptanceCriteriaIds.includes(ac3Id)) {
  throw new Error('syncDocumentRelations failed to sync AC ID back to Requirement.');
}
console.log('✓ syncDocumentRelations successfully synchronizes bi-directional relationships.');

// 5. Test Integrity Engine (checkFsdCompleteness)
// 5.1 Test Missing UI Check
let integrityReport = checkFsdCompleteness(syncedFsd);
console.log('Integrity check report:', {
  isBaselineReady: integrityReport.isBaselineReady,
  errorsCount: integrityReport.errorsCount,
  warningsCount: integrityReport.warningsCount,
  noticesCount: integrityReport.noticesCount,
});

if (integrityReport.isBaselineReady) {
  throw new Error('FSD should NOT be baseline-ready when REQ-02 is missing UI.');
}
const missingUiIssue = integrityReport.issues.find(
  (i) => i.category === 'ui_without_flow_or_screen' && i.itemId === req2Id
);
if (!missingUiIssue) {
  throw new Error('Integrity engine failed to report missing UI for REQ-02.');
}
console.log('✓ Integrity engine accurately flags missing UI/process flow.');

// 5.2 Test ID Uniqueness Check (Rule 1)
syncedMod.requirements.push({
  id: req1Id, // Duplicate ID intentional!
  name: 'Duplicate Requirement ID Test',
  description: 'Duplikasi ID yang sengaja dibuat',
  priority: 'Low',
  status: 'Draft',
  flowIds: [],
  screenIds: [],
  acceptanceCriteriaIds: [],
});

integrityReport = checkFsdCompleteness(syncedFsd);
const duplicateIssue = integrityReport.issues.find(
  (i) => i.category === 'duplicate_id' && i.itemId === req1Id
);
if (!duplicateIssue || duplicateIssue.severity !== 'error') {
  throw new Error('Integrity engine failed to detect duplicate ID as an ERROR.');
}
console.log('✓ Integrity engine strictly blocks duplicate artifact IDs with Error severity.');

// 5.3 Test Incomplete Integration Rule (Rule 4)
syncedMod.requirements.pop(); // Remove duplicate
syncedMod.integrations.push({
  id: 'INT-AUTH-99',
  name: 'Incomplete Mock Integration',
  description: 'Mock integration without input/outcome',
  owner: 'Third Party API',
  input: '', // Empty input
  outcome: '', // Empty outcome
  relatedRequirementIds: [],
});

integrityReport = checkFsdCompleteness(syncedFsd);
const intIssue = integrityReport.issues.find(
  (i) => i.category === 'incomplete_integration' && i.itemId === 'INT-AUTH-99'
);
if (!intIssue) {
  throw new Error('Integrity engine failed to detect incomplete integration specification.');
}
console.log('✓ Integrity engine detects incomplete integration contract specification.');

// 5.4 Test Clean Baseline Verification
// Now fix REQ-02 (give it Flow & Screen) and remove incomplete integration
syncedMod.integrations.pop(); // remove INT-AUTH-99
const req2 = syncedMod.requirements.find((r) => r.id === req2Id);
if (req2) {
  req2.flowIds = [flow1Id];
  req2.screenIds = [screen1Id];
}

// Starter FSD may have open items. Ensure all open items are closed for clean baseline.
syncedFsd.openItems = (syncedFsd.openItems || []).map((item) => ({
  ...item,
  status: 'Closed',
}));

const cleanReport = checkFsdCompleteness(syncedFsd);
console.log('Fully resolved FSD report:', {
  isBaselineReady: cleanReport.isBaselineReady,
  errorsCount: cleanReport.errorsCount,
  warningsCount: cleanReport.warningsCount,
  noticesCount: cleanReport.noticesCount,
});

if (!cleanReport.isBaselineReady || cleanReport.errorsCount > 0 || cleanReport.warningsCount > 0) {
  throw new Error(`Resolved FSD should be Baseline Ready! Issues: ${JSON.stringify(cleanReport.issues)}`);
}
console.log('✓ Resolved FSD passes all baseline rules and is certified Baseline Ready.');

console.log('\n===============================================================');
console.log('🎉 ALL MILESTONE 3 TRACEABILITY & INTEGRITY TESTS PASSED!');
console.log('===============================================================\n');
