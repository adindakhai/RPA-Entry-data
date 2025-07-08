# PEMETAAN FIELD INPUT - RPA Entry Data

## DAFTAR PEMETAAN ID/SELEKTOR FIELD INPUT YANG RELEVAN

### 1. MOCKUP MTL (mock_mtl.html)
**File:** `MOCKUP/mock_mtl.html`

| Field Name | ID/Selector | Type | Description |
|------------|-------------|------|-------------|
| Nomor Surat Referensi | `#nomor_surat` | input[type="text"] | Nomor surat referensi |
| Perihal | `#perihal_surat` | input[type="text"] | Perihal surat |
| Asal Surat | `#asal_surat` | input[type="text"] | Asal surat |

### 2. MOCKUP NDE (mock_nde.html)
**File:** `MOCKUP/mock_nde.html`

| Field Name | ID/Selector | Type | Description |
|------------|-------------|------|-------------|
| Nomor Surat | `#nomor-surat` | span | Nomor surat NDE |
| Tanggal Surat | `#tanggal-surat` | span | Tanggal surat |
| Perihal | `#perihal-surat` | span | Perihal surat |
| Pengirim | `#pengirim-surat` | span | Pengirim surat |
| Tujuan | `#tujuan-surat` | span | Tujuan surat |

### 3. POPUP EXTENSION (popup.html)
**File:** `Testing/EXTENSION/popup.html`

| Field Name | ID/Selector | Type | Description |
|------------|-------------|------|-------------|
| Document Number | `#popup-nomor-nota` | input[type="text"] | Nomor dokumen |
| Subject | `#popup-perihal` | input[type="text"] | Subjek/perihal |
| Sender | `#popup-pengirim` | input[type="text"] | Pengirim |
| Attachment ID | `#popup-id-lampiran` | input[type="text"] | ID lampiran dari iframe |
| SPK Number | `#popup-no-spk` | input[type="text"] | Nomor SPK |
| ND SVP IA Date | `#popup-tanggal-nd-svp-ia` | input[type="text"] | Tanggal ND SVP IA |
| ND SVP IA Findings | `#popup-temuan-nd-svp-ia` | textarea | Temuan ND SVP IA |
| ND SVP IA Recommendations | `#popup-rekomendasi-nd-svp-ia` | textarea | Rekomendasi ND SVP IA |

### 4. MTL MOCKUP EXTENSION (mtl_mockup.html)
**File:** `Testing/EXTENSION/MOCKUP/mtl_mockup.html`

| Field Name | ID/Selector | Type | Description |
|------------|-------------|------|-------------|
| No SPK | `#input-no-spk` | input[type="text"] | Nomor SPK |
| Kelompok | `#input-kelompok` | select | Kelompok |
| CODE | `#input-code` | input[type="text"] | Kode |
| Masa Penyelesaian Pekerjaan | `#input-masa-penyelesaian` | input[type="text"] | Masa penyelesaian pekerjaan |
| Matriks Program | `#input-matriks-program` | input[type="text"] | Matriks program |
| Tanggal Matriks | `#input-tanggal-matriks` | input[type="date"] | Tanggal matriks |
| Nomor ND SVP IA | `#input-nomor-nd-svp-ia` | input[type="text"] | Nomor ND SVP IA |
| Deskripsi ND SVP IA | `#input-deskripsi-nd-svp-ia` | input[type="text"] | Deskripsi ND SVP IA |
| Tanggal ND SVP IA | `#input-tanggal-nd-svp-ia` | input[type="date"] | Tanggal ND SVP IA |
| Temuan ND SVP IA | `#input-temuan-nd-svp-ia` | textarea | Temuan ND SVP IA |
| Rekomendasi ND SVP IA | `#input-rekomendasi-nd-svp-ia` | textarea | Rekomendasi ND SVP IA |
| Nomor ND Dirut | `#input-nomor-nd-dirut` | input[type="text"] | Nomor ND Dirut |
| Deskripsi ND Dirut | `#input-deskripsi-nd-dirut` | input[type="text"] | Deskripsi ND Dirut |
| Tanggal ND Dirut | `#input-tanggal-nd-dirut` | input[type="date"] | Tanggal ND Dirut |
| Temuan ND Dirut | `#input-temuan-nd-dirut` | textarea | Temuan ND Dirut |
| Rekomendasi ND Dirut | `#input-rekomendasi-nd-dirut` | textarea | Rekomendasi ND Dirut |
| Duedate ND Dirut | `#input-duedate-nd-dirut` | input[type="date"] | Duedate ND Dirut |
| PIC ND Dirut | `#input-pic-nd-dirut` | input[type="text"] | PIC ND Dirut |
| UIC ND Dirut | `#input-uic-nd-dirut` | input[type="text"] | UIC ND Dirut |
| MTL Closed | `#input-mtl-closed` | input[type="text"] | Status MTL Closed |
| Reschedule | `#input-reschedule` | input[type="text"] | Status Reschedule |
| Overdue | `#input-overdue` | input[type="text"] | Status Overdue |
| OnSchedule | `#input-onschedule` | input[type="text"] | Status OnSchedule |
| Status | `#input-status` | input[type="text"] | Status umum |
| ID Lampiran | `#input-id-lampiran` | input[type="hidden"] | ID lampiran (hidden) |

### 5. NDE IFRAME CONTENT (nde_iframe_content.html)
**File:** `Testing/EXTENSION/MOCKUP/nde_iframe_content.html`

| Field Name | ID/Selector | Type | Description |
|------------|-------------|------|-------------|
| ID Lampiran | `#id-lampiran` | span | ID lampiran |
| Tipe Dokumen | `#tipe-dokumen` | span | Tipe dokumen |

### 6. NDE MOCKUP (nde_mockup.html)
**File:** `Testing/EXTENSION/MOCKUP/nde_mockup.html`

| Field Name | ID/Selector | Type | Description |
|------------|-------------|------|-------------|
| Nomor | `#nomor-nota` | div | Nomor nota dinas |
| Pengirim | `#pengirim` | div | Pengirim nota |
| Perihal | `#perihal` | div | Perihal nota |

## PEMETAAN DATA FLOW

### Dari NDE ke Popup Extension:
- `nomorNdSvpIa` → `#popup-nomor-nota`
- `deskripsiNdSvpIa` → `#popup-perihal`
- `noSPK` → `#popup-no-spk`
- `tanggalNdSvpIa` → `#popup-tanggal-nd-svp-ia`
- `temuanNdSvpIa` → `#popup-temuan-nd-svp-ia`
- `rekomendasiNdSvpIa` → `#popup-rekomendasi-nd-svp-ia`

### Dari Popup ke MTL Form:
- `nomorNota` → `#input-nomor-nd-svp-ia`
- `perihal` → `#input-deskripsi-nd-svp-ia`
- `noSpk` → `#input-no-spk`
- `tanggalNdSvpIa` → `#input-tanggal-nd-svp-ia`
- `temuanNdSvpIa` → `#input-temuan-nd-svp-ia`
- `rekomendasiNdSvpIa` → `#input-rekomendasi-nd-svp-ia`
- `idLampiran` → `#input-id-lampiran`

### Mapping di mtl_filler.js:
- `nomorSurat` → `#nomor_surat`
- `perihal` → `#perihal_surat`
- `pengirim` → `#asal_surat`

## CATATAN PENTING

1. **Shadow DOM**: Content script menggunakan Shadow DOM untuk mengakses elemen dalam `app-virtualdom`
2. **Regex Extraction**: Beberapa field diekstrak menggunakan regex pattern dari teks dokumen
3. **Storage**: Data disimpan dalam `chrome.storage.local` dengan key `dataForMTL`
4. **Validation**: Field yang tidak ditemukan akan berisi "Data belum ditemukan"
5. **Auto-fill**: Field yang berhasil diisi akan mendapat class `autofilled` untuk highlight

## SELEKTOR KHUSUS

### Shadow DOM Selectors (content.js):
- `app-virtualdom` → Shadow root
- `.isisurat` → Content area dalam shadow DOM
- `table tbody tr td` → Table cells untuk ekstraksi data

### Button Selectors:
- Extract Data: `#get-data-btn`
- Send to MTL: `#send-data-btn`
- Submit: `form#mtl-form button[type="submit"]`
- Close: `form#mtl-form button[type="button"]`

### Status Elements:
- Error Display: `#status-error`
- Data Display: `#data-display`
- Status Message: `#status-message` 