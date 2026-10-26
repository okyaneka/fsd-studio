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

const { validateImageFile, MAX_ASSET_SIZE_BYTES } = await jiti.import('../src/core/assets.ts');

console.log('Testing Milestone 2 FSD Authoring data integrity and validation...');

// 1. Inisialisasi Starter FSD
const { project, fsd } = createStarterWorkspace({
  name: 'Core Banking Modernization',
  code: 'CBM',
  clientName: 'Bank Nasional',
  description: 'Digital transformation of core retail banking',
});

// 2. Editor Metadata & Document Control
fsd.metadata.author = 'Jane Doe (Lead BA)';
fsd.metadata.targetRelease = 'Sprint 42';
fsd.metadata.status = 'In Review';
fsd.metadata.reviewers = ['Budi (Lead Architect)', 'Siti (Product Manager)'];

fsd.documentControl.revisionHistory.push({
  version: '0.2',
  date: '2026-10-24',
  author: 'Jane Doe',
  changeSummary: 'Menambahkan modul transfer dan validasi limit harian',
});

fsd.documentControl.relatedDocuments.push({
  name: 'Business Architecture Blueprint',
  reference: 'BAB-2026-v2',
  description: 'Dokumen arsitektur acuan alur dana',
});

if (fsd.documentControl.revisionHistory.length !== 1 || fsd.metadata.reviewers.length !== 2) {
  throw new Error('Document control & metadata update failed.');
}

// 3. Editor Global Scope & Context
fsd.overview.objective = 'Menyediakan kapabilitas otentikasi biometrik dan transfer dana real-time.';
fsd.overview.inScope.push('Login Biometrik & Password', 'Transfer Antar Bank BI-FAST');
fsd.overview.outOfScope.push('Pinjaman Online / P2P Lending', 'Crypto Wallet');
fsd.overview.definitions.push({ label: 'BI-FAST', value: 'Infrastruktur sistem pembayaran ritel nasional' });
fsd.overview.successOutcomes.push({ label: 'Waktu Transaksi', value: '< 2.5 detik SLA per transaksi' });

fsd.businessContext.summary = 'Nasabah membutuhkan layanan transaksi instan 24/7.';
fsd.businessContext.assumptions.push('Koneksi jaringan internet nasabah stabil saat melakukan transaksi.');
fsd.businessContext.dependencies.push({ label: 'Core Banking API Gateway', value: 'Ketersediaan layanan 99.99%' });

fsd.actors.push({
  id: 'ACT-01',
  name: 'Nasabah Terdaftar',
  description: 'Pengguna akhir aplikasi mobile banking',
  permissionsOrNeeds: 'Memiliki rekening tabungan aktif dan kartu debit',
});

fsd.preconditions.push('Nasabah telah mengaktifkan aplikasi pada perangkat terdaftar.');
fsd.postconditions.push('Saldo rekening nasabah terpotong dan notifikasi berhasil terkirim.');

if (fsd.overview.inScope.length !== 2 || fsd.actors.length !== 1) {
  throw new Error('Global context update failed.');
}

// 4. Editor 9 Subbagian Wajib Modul
const module = fsd.modules[0]; // Starter AUTH module

// 4.1 Process Flows
module.flows.push({
  id: createArtifactId('flow', module.code, 5, 'biometric-login', fsd.idConvention),
  name: 'Login Biometrik',
  description: 'Otentikasi menggunakan FaceID atau Fingerprint',
  notes: 'Hanya aktif jika perangkat mendukung biometrik hardware',
  steps: [
    { order: 1, actor: 'Nasabah', action: 'Membuka aplikasi dan memindai sidik jari', systemResponse: 'Sistem memverifikasi biometrik ke hardware OS', requirementIds: [] },
    { order: 2, actor: 'Sistem', action: 'Mengirim challenge token ke server', systemResponse: 'Server mengembalikan JWT session', requirementIds: [] },
  ],
  alternativePaths: [],
});

// 4.2 Screens & Annotations
module.screens.push({
  id: createArtifactId('screen', module.code, 5, 'biometric-prompt', fsd.idConvention),
  name: 'Layar Dialog Biometrik',
  description: 'Tampilan overlay prompt sensor biometrik',
  wireframeAssetId: null,
  imageCaption: 'Gambar 2: Dialog Biometrik Mobile',
  imageAlt: 'Prompt biometrik sidik jari pada layar smartphone',
  orientation: 'portrait',
  annotations: [
    { number: 1, text: 'Ikon fingerprint sensor status', requirementIds: [], validationIds: [] },
    { number: 2, text: 'Tombol Gunakan PIN sebagai opsi alternatif', requirementIds: [], validationIds: [] },
  ],
});

// 4.3 Functional Requirements
module.requirements.push({
  id: createArtifactId('requirement', module.code, 1, 'biometric', fsd.idConvention),
  name: 'Dukungan Login Biometrik',
  description: 'Sistem harus mendukung autentikasi lokal perangkat (TouchID / FaceID) untuk login cepat.',
  priority: 'Must',
  status: 'Proposed',
  flowIds: [],
  screenIds: [],
  acceptanceCriteriaIds: [],
});

// 4.4 Business Rules
module.businessRules.push({
  id: createArtifactId('businessRule', module.code, 1, undefined, fsd.idConvention),
  name: 'Batas Kegagalan Biometrik',
  description: 'Setelah 3 kali gagal sensor biometrik, aplikasi wajib meminta PIN/Password.',
  rationale: 'Mencegah percobaan akses fisik tanpa izin',
  relatedRequirementIds: [],
});

// 4.5 Data & Validation Rules
module.validations.push({
  id: createArtifactId('validation', module.code, 1, 'pin', fsd.idConvention),
  field: 'user_pin',
  name: 'Validasi Format PIN',
  description: '',
  condition: '6 digit numerik, tidak boleh angka berurutan atau tanggal lahir',
  message: 'PIN harus 6 angka dan tidak mudah ditebak',
  relatedRequirementIds: [],
});

// 4.6 Integration Requirements
module.integrations.push({
  id: createArtifactId('integration', module.code, 1, 'biometric-token', fsd.idConvention),
  name: 'Verifikasi Token Biometrik',
  description: 'Pertukaran signature biometrik dengan backend auth service',
  owner: 'Security & Auth Service SA',
  input: '{ device_signature, challenge_nonce, public_key_id }',
  outcome: '{ auth_token, expires_in, refresh_token }',
  relatedRequirementIds: [],
});

// 4.7 Error Handling & UI States
module.errorStates.push({
  id: `ERR-${module.code}-01`,
  name: 'Sensor Biometrik Tidak Tersedia',
  description: 'Hardware sensor biometrik sedang digunakan aplikasi lain atau kotor',
  trigger: 'OS mengembalikan error BIOMETRIC_NOT_AVAILABLE',
  userMessage: 'Sensor biometrik tidak dapat membaca. Gunakan password Anda.',
  recovery: 'Alihkan layar otomatis ke form password reguler',
  relatedRequirementIds: [],
});

// 4.8 Security & NFR
module.nfrs.push({
  id: `NFR-${module.code}-01`,
  name: 'Enkripsi Kunci Biometrik',
  category: 'Security',
  measure: 'Kunci privat disimpan dalam Secure Enclave / Android Keystore hardware',
  description: 'Private key tidak pernah keluar dari hardware enkripsi perangkat',
});

// 4.9 Acceptance Criteria (Given-When-Then)
module.acceptanceCriteria.push({
  id: createArtifactId('acceptanceCriterion', module.code, 1, 'biometric', fsd.idConvention),
  name: 'Sukses Login Biometrik',
  description: 'Verifikasi alur login ketika biometrik valid',
  requirementIds: [],
  scenarios: [
    {
      title: 'Login Sukses dengan Sidik Jari Terdaftar',
      given: [
        'nasabah memiliki aplikasi yang teraktivasi',
        'fitur biometrik telah diaktifkan pada pengaturan profil',
      ],
      when: 'nasabah memindai sidik jari yang terdaftar pada prompt login',
      then: [
        'sistem mengenali identitas nasabah',
        'sesi autentikasi dibuat',
        'nasabah langsung diarahkan ke halaman Dashboard Saldo',
      ],
    },
  ],
});

// Update status subbagian
module.sectionStates.flows = 'complete';
module.sectionStates.screens = 'complete';
module.sectionStates.requirements = 'complete';
module.sectionStates.businessRules = 'complete';
module.sectionStates.validations = 'complete';
module.sectionStates.integrations = 'complete';
module.sectionStates.errorStates = 'complete';
module.sectionStates.nfrs = 'complete';
module.sectionStates.acceptanceCriteria = 'complete';

// 5. Open Items, Approvals & Checklist
fsd.openItems.push({
  id: 'OI-01',
  name: 'Persetujuan Regulasi BI untuk Biometrik',
  description: 'Konfirmasi pemenuhan standar regulasi perlindungan data pribadi dan biometrik nasabah',
  status: 'Pending',
  owner: 'Compliance Officer',
  dueDate: '2026-11-15',
});

fsd.approvals.push({
  id: 'APPR-01',
  role: 'Chief Information Security Officer (CISO)',
  person: 'Dr. Agus Wibowo',
  responsibility: 'Menyetujui arsitektur penyimpanan kunci dan skema enkripsi biometrik',
  status: 'Approved',
});

fsd.apiHandoffChecklist.push({
  id: 'CHK-01',
  item: 'Dokumentasi OpenAPI / Swagger Endpoint Auth Biometrik',
  owner: 'Backend Lead',
  complete: true,
  notes: 'Tersedia di portal developer internal',
});

// 6. Test Validasi File Aset Lo-Fi
const validFilePng = { name: 'wireframe.png', type: 'image/png', size: 1024 * 1024 }; // 1 MB
const validFileJpg = { name: 'wireframe.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 }; // 2 MB
const validFileWebp = { name: 'wireframe.webp', type: 'image/webp', size: 500 * 1024 }; // 500 KB
const invalidFileType = { name: 'doc.pdf', type: 'application/pdf', size: 1024 * 1024 };
const oversizedFile = { name: 'huge.png', type: 'image/png', size: MAX_ASSET_SIZE_BYTES + 100 };

if (!validateImageFile(validFilePng).valid) throw new Error('PNG file validation failed.');
if (!validateImageFile(validFileJpg).valid) throw new Error('JPG file validation failed.');
if (!validateImageFile(validFileWebp).valid) throw new Error('WebP file validation failed.');
if (validateImageFile(invalidFileType).valid) throw new Error('Invalid file type was incorrectly accepted.');
if (validateImageFile(oversizedFile).valid) throw new Error('Oversized file (>5MB) was incorrectly accepted.');

// 7. Validasi Backup Payload untuk seluruh konten Milestone 2 yang telah di-author
const backupPayload = {
  format: 'fsd-studio-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  projects: [project],
  fsdDocuments: [fsd],
  assets: [],
};

validateBackupPayload(backupPayload);

console.log('Milestone 2 FSD Authoring data integrity and validation checks PASSED successfully!');

