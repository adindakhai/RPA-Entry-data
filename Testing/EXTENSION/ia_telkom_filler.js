// Testing/EXTENSION/ia_telkom_filler.js
console.log("IA Telkom Filler Script Loaded. Waiting for data...");

function fillIAForm(data) {
    console.log("Received data for IA Telkom form:", data);

    const getValue = (value) => (value && value !== "Data belum ditemukan" ? value : "");

    // Helper to fill field, trying various selectors
    function fillField(selectors, value) {
        if (value === "") return; // Don't fill if data is empty/not found

        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    element.value = value;
                    element.dispatchEvent(new Event('input', { bubbles: true })); // Trigger input event
                    element.dispatchEvent(new Event('change', { bubbles: true })); // Trigger change event
                    console.log(`Filled field ${selector} with: ${value}`);
                    // Optional: Add a class to indicate autofill
                    // element.classList.add('autofilled-by-extension');
                    return true; // Stop if successful
                }
            } catch (e) {
                console.warn(`Error accessing selector ${selector}:`, e);
            }
        }
        console.warn(`Element not found for data key corresponding to value: ${value} with selectors:`, selectors.join(', '));
        return false;
    }

    // Mapping from data keys (from content.js/popup.js) to IA Telkom form field selectors
    // Prioritizing more specific IDs (ending with _form, _Entry)
    // Note: MHTML uses '=3D' for '=' in quoted-printable. Selectors need to handle this.
    // We'll use attribute selectors like '[id="3D..."]'

    fillField(['[id="3Dno_spk_form"]', '[name="3Dno_spk"]'], getValue(data.noSPK)); // select and input
    fillField(['[id="3Dkelompok_form"]', '[name="3Dkelompok"]'], getValue(data.kelompok)); // input and select
    fillField(['[id="3Dcode_form"]', '[name="3DCODE"]'], getValue(data.code)); // input
    fillField(['[id="3Dmasa_penyelesaian_pekerjaan_form"]', '[name="3DMasa_Penyelesaian_Pekerjaan1_Entry_form"]'], getValue(data.masaPenyelesaianPekerjaan));
    fillField(['[id="3Dmatriks_program_form"]', '[name="3DMatriks_Program"]'], getValue(data.matriksProgram));
    fillField(['[id="3Dmatriks_tanggal_form"]', '[id="3DMatriks_Tgl_Entry"]', '[name="3DMatriks_Tgl"]'], getValue(data.tanggalMatriks));

    fillField(['[id="3DND_SVP_IA_Nomor_form"]', '[name="3DND_SVP_IA_Nomor"]'], getValue(data.nomorNdSvpIa));
    fillField(['[id="3DDesc_ND_SVP_IA_form"]', '[name="3DDesc_ND_SVP_IA"]'], getValue(data.deskripsiNdSvpIa));
    fillField(['[id="3DND_SVP_IA_Tanggal_form"]', '[id="3DND_SVP_IA_Tanggal_Entry"]', '[name="3DND_SVP_IA_Tanggal"]'], getValue(data.tanggalNdSvpIa));

    // For textareas, it's common they might not have specific IDs but rather names.
    // The user provided list shows multiple textareas with same name attribute for temuan/rekomendasi.
    // This attempts to fill the first one. More specific selectors might be needed if this is not the correct one.
    // Example: document.querySelectorAll('[name="3DND_SVP_IA_Temuan"]')[0]
    // However, querySelector will get the first one by default.
    fillField(['textarea[name="3DND_SVP_IA_Temuan"]', 'textarea[id="3DinputND_SVP_IA_Temuan"]'], getValue(data.temuanNdSvpIa));
    fillField(['textarea[name="3DND_SVP_IA_Rekomendasi"]', 'textarea[id="3DinputND_SVP_IA_Rekomendasi"]'], getValue(data.rekomendasiNdSvpIa));

    fillField(['[name="3DND_Dirut_Nomor"]'], getValue(data.nomorNdDirut)); // This name is duplicated, might need more context
    fillField(['[name="3DDesc_ND_Dirut"]'], getValue(data.deskripsiNdDirut)); // This name is duplicated
    fillField(['[id="3DND_Dirut_Tgl_form"]', '[name="3DND_Dirut_Tgl"]'], getValue(data.tanggalNdDirut));

    fillField(['textarea[name="3DND_Dirut_Temuan"]', 'textarea[id="3DinputND_Dirut_Temuan"]'], getValue(data.temuanNdDirut));
    fillField(['textarea[id="3DinputND_Dirut_Rekomendasi"]', 'textarea[name="3DND_Dirut_Rekomendasi"]'], getValue(data.rekomendasiNdDirut));

    fillField(['[id="3Dnd_dirut_duedate_form"]', '[name="3DND_Dirut_Duedate1"]'], getValue(data.duedateNdDirut)); // Also ND_Dirut_Duedate2 (select)
    fillField(['[name="3DND_Dirut_PIC"]'], getValue(data.picNdDirut));
    fillField(['[name="3DND_Dirut_UIC"]'], getValue(data.uicNdDirut));

    // Status fields - assuming these are numeric 0 or 1, or text
    fillField(['[id="3Dcloseinput2"]', '[id="3Dcloseinput"]'], getValue(data.mtlClosed?.toString()));
    fillField(['[id="3Drescheduleinput2"]', '[id="3Drescheduleinput"]'], getValue(data.reschedule?.toString()));
    fillField(['[id="3Doverdueinput2"]', '[id="3Doverdueinput"]'], getValue(data.overdue?.toString()));
    fillField(['[id="3Donscheduleinput2"]', '[id="3Donscheduleinput"]'], getValue(data.onSchedule?.toString()));
    fillField(['[id="3Dstatusinput2"]', '[id="3Dstatusinput"]', '[name="3Dstatus"]'], getValue(data.status));

    console.log("IA Telkom form filling attempt complete.");
}

// Listen for data from storage (set by popup.js)
chrome.storage.local.get('dataForIATelkom', (result) => {
    if (result && result.dataForIATelkom) {
        console.log("Data found in storage for IA Telkom, attempting to fill form.");
        fillIAForm(result.dataForIATelkom);
        // Optional: Clear the data from storage after use
        // chrome.storage.local.remove('dataForIATelkom', () => {
        //     console.log("Cleared dataForIATelkom from storage.");
        // });
    } else {
        console.log("No data found in storage for IA Telkom.");
    }
});

// Fallback: Listen for messages if direct message passing is implemented later.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillIAForm" && request.data) {
        console.log("Received fillIAForm message, attempting to fill form.");
        fillIAForm(request.data);
        sendResponse({ success: true, message: "IA Telkom form fill attempt started." });
        return true;
    }
});
