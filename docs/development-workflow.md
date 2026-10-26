# FSD Studio — Development Workflow

## 1. Tujuan

FSD Studio adalah aplikasi frontend lokal berbasis React, TypeScript, dan Tailwind CSS untuk membantu Business Analyst membuat, mengelola, me-render, dan mencetak Functional Specification Document (FSD) yang konsisten.

Aplikasi memisahkan konten FSD dari presentation layer, sehingga satu sumber data dapat digunakan untuk editor, preview HTML berorientasi A4, dan Save as PDF melalui browser.

## 2. Batas Produk MVP

| Termasuk | Tidak termasuk |
| --- | --- |
| Multi-project dalam satu browser/perangkat | Login, akun pengguna, dan sinkronisasi cloud |
| Banyak FSD dalam satu project | Kolaborasi realtime |
| Banyak module tanpa batas dalam satu FSD | Approval digital/legal signature |
| Penyimpanan lokal di IndexedDB | Integrasi Jira, Confluence, Figma, atau API gateway |
| Gambar Lo-Fi yang diunggah pengguna | Editor wireframe/canvas bebas |
| Preview A4 dan Print / Save as PDF | Generator PDF server-side |
| Import/export backup | AI content generation |

> Risiko utama: data hanya tersimpan pada browser/perangkat. Backup dan restore merupakan fitur wajib, bukan fitur tambahan.

## 3. Prinsip Dokumen

1. Semua FSD memakai satu struktur standar perusahaan.
2. Semua module memakai sembilan subbagian wajib yang sama.
3. Authentication merupakan contoh konten bawaan saat project baru dibuat; bukan template struktur yang dapat dikustomisasi.
4. Owner, reviewer, status, revision history, dan approval berada pada tingkat FSD, bukan module.
5. FSD berisi kebutuhan dan perilaku fungsional. API Specification serta Technical Design merupakan artefak terpisah.
6. Requirement, acceptance criteria, flow, screen, dan validation ditautkan melalui ID stabil.

## 4. Hierarki Konten

```text
Workspace lokal
└── Project
    └── FSD
        ├── Metadata dan Document Control
        ├── Overview / Scope / Business Context
        ├── Actors / Assumptions / Dependencies
        ├── Module (tanpa batas)
        │   ├── Process Flows
        │   ├── UI / Lo-Fi Wireframes
        │   ├── Functional Requirements
        │   ├── Business Rules
        │   ├── Data & Validation
        │   ├── Integration Requirements
        │   ├── Error Handling & UI States
        │   ├── Security & NFR
        │   └── Acceptance Criteria
        ├── Cross-module Traceability Matrix
        ├── Open Items & Approval
        └── API Handoff Checklist
```

## 5. Status dan Kelengkapan

### Status dokumen

`Draft` → `In Review` → `Baseline` → `Superseded`

### Status item

- Requirement: `Draft`, `Proposed`, `Approved`, `Changed`, `Deprecated`
- Open item: `Open`, `Pending`, `Resolved`, `Accepted risk`
- Approval: `Pending`, `Approved`, `Rejected`, `Not applicable`

### Aturan section wajib

Setiap subbagian module tetap muncul pada hasil render. Nilai kondisi harus eksplisit:

| Kondisi | Tampilan di dokumen |
| --- | --- |
| Tidak relevan | `Not Applicable` |
| Keputusan belum selesai | `TBD` |
| Belum diisi | Warning di editor; kosong tidak dianggap selesai |

Saat status FSD berubah menjadi `Baseline`, aplikasi menjalankan pemeriksaan kelengkapan sebagai warning:

- Functional requirement memiliki setidaknya satu acceptance criterion.
- Requirement UI memiliki flow atau screen yang terhubung.
- Kebutuhan integrasi memiliki input, outcome, dan owner SA.
- Open item masih terbuka terlihat jelas.
- ID tidak duplikat.

## 6. Konvensi ID

Kode module unik dalam satu FSD dan dipakai sebagai namespace.

```text
MOD-AUTH
FLOW-AUTH-LOGIN
SCR-AUTH-LOGIN
FR-AUTH-LOGIN-01
BR-AUTH-01
VAL-AUTH-EMAIL-01
INT-AUTH-LOGIN
AC-AUTH-LOGIN-01
OI-AUTH-01
```

Setiap FSD memiliki `ID prefix` opsional yang dapat diatur pengguna. Prefix ini berada setelah kode tipe dan sebelum kode module; misalnya prefix `CLIENT` menghasilkan `FR-CLIENT-AUTH-LOGIN-01`. Kode tipe (`FR`, `BR`, dan seterusnya) tetap ditetapkan sistem agar jenis artefak selalu terbaca, sedangkan kode module tetap unik dalam satu FSD. Nomor increment selalu dua digit dengan leading zero (`01`–`99`, lalu `100` bila melampaui 99) dan ID yang telah dibuat tidak berubah ketika judul, prefix, kode module, project, atau FSD diubah.

ID tidak berubah bila judul item, nama project, atau nama FSD berubah.

## 7. Acceptance Criteria

Acceptance criteria menggunakan Given–When–Then dan dapat berisi beberapa skenario.

```text
Given pengguna memiliki akun aktif dan terverifikasi
When pengguna memasukkan email dan password yang valid lalu memilih Sign In
Then sistem mengautentikasi pengguna
And pengguna diarahkan ke halaman tujuan yang sesuai
```

Satu acceptance criterion wajib memiliki minimal satu requirement terkait. Relasi inilah yang membentuk traceability matrix secara otomatis.

## 8. Wireframe Lo-Fi

Wireframe berupa gambar yang diunggah pengguna, bukan editor gambar bawaan.

- Format MVP: PNG, JPG/JPEG, dan WebP.
- Batas awal: 5 MB per gambar.
- Gambar disimpan sebagai Blob di IndexedDB.
- Setiap gambar memiliki caption dan alt text.
- Annotation menggunakan daftar bernomor yang ditautkan ke requirement atau validation; tidak ada canvas annotation pada MVP.

## 9. Penyimpanan Lokal

Gunakan IndexedDB, bukan localStorage.

| Store | Isi |
| --- | --- |
| `projects` | Metadata project |
| `fsdDocuments` | Data FSD terstruktur |
| `assets` | Blob gambar Lo-Fi dan metadata relasinya |

Relasi aset mencatat `projectId`, `fsdId`, `moduleId`, dan `screenId`. Import/export backup harus membawa dokumen beserta asetnya.

## 10. Workflow Pengguna

```text
Buat project
  → sistem membuat FSD awal dengan contoh module Authentication
  → BA melengkapi informasi FSD
  → BA menambah, mengubah, atau menghapus module
  → BA mengisi section standar setiap module
  → BA menghubungkan requirement, screen/flow, dan acceptance criteria
  → BA meninjau warning kelengkapan
  → BA membuka preview A4
  → Print / Save as PDF atau export backup
```

FSD kedua dan seterusnya dalam project dimulai dari struktur standar kosong.

## 11. Workflow Implementasi

### Milestone 0 — Fondasi

- Inisialisasi frontend dan struktur folder.
- Definisi schema data, factory default, dan konvensi ID.
- Abstraksi repository IndexedDB.
- Import/export backup minimal.

### Milestone 1 — Navigasi Workspace

- Project dashboard.
- Project detail dan daftar FSD.
- Pembuatan project serta starter FSD Authentication.
- Pembuatan FSD kosong standar.
- CRUD project, FSD, dan module.

### Milestone 2 — FSD Authoring

- Editor metadata dan document control.
- Editor konten global.
- Editor sembilan section wajib per module.
- Editor Given–When–Then.
- Upload, preview, dan pengelolaan aset Lo-Fi.

### Milestone 3 — Integritas Dokumen

- Pembuatan ID stabil.
- UI untuk membangun relasi antarantefak.
- Traceability matrix otomatis.
- Pemeriksaan kelengkapan dan warning baseline.

### Milestone 4 — Renderer

- Renderer HTML dari data terstruktur.
- Navigasi dokumen layar.
- Layout A4, CSS print, page-break, dan table headers.
- Preview per module atau seluruh FSD.
- Print / Save as PDF browser-native.

### Milestone 5 — Hardening

- Validasi schema ketika import.
- Konfirmasi penghapusan serta anjuran export backup.
- Empty, loading, dan error state.
- Uji data besar: banyak module, item, dan gambar.
- Uji print untuk Chrome/Edge/Safari yang ditargetkan.

## 12. Definition of Done MVP

MVP dianggap siap bila BA dapat membuat project, membuat dan mengedit beberapa FSD dengan beberapa module, memasukkan gambar Lo-Fi, membuat requirement dan Given–When–Then acceptance criteria yang tertaut, melihat traceability matrix, mencetak preview A4 ke PDF, serta memulihkan data dari backup tanpa kehilangan konten atau gambar.
