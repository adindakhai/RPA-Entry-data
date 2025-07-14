// Content script for IA Telkom.mhtml page (ia_telkom_filler.js)
// VERSI FINAL DENGAN METODE OVERWRITE PAKSA
console.log("[ia_telkom_filler.js] Loaded.");

// Function to verify if this is the correct IA Telkom page
function isCorrectPage() {
    const pageTitle = document.title;
    const addButton = document.querySelector('button[data-target="#ModalAddSPK"]');
    if ((pageTitle && pageTitle.includes("IA Telkom")) || addButton) {
        console.log("[ia_telkom_filler.js] Correct page identified.");
        return true;
    }
    console.warn("[ia_telkom_filler.js] Not the IA Telkom MTL page, or key elements missing.");
    return false;
}

// Function to fill form fields
function fillFormFields(data) {
    console.log("[ia_telkom_filler.js] Received data to fill:", JSON.stringify(data, null, 2));
    let errors = [];

    // =================================================================================
    // ### FUNGSI INI TELAH DIMODIFIKASI (METODE FINAL) ###
    function setFieldValue(selector, value, fieldName, type = 'input') {
        console.log(`[ia_telkom_filler.js] Attempting to fill field: "${fieldName}" with selector: "${selector}"`);

        if (value === undefined || value === null || value === "" || (typeof value === 'string' && value.toLowerCase() === 'data belum ditemukan')) {
            console.log(`[ia_telkom_filler.js] No valid data for "${fieldName}". Skipping.`);
            return;
        }

        const element = document.querySelector(selector);
        if (element) {
            console.log(`[ia_telkom_filler.js] SUCCESS: Found element for "${fieldName}"`, element);

            let processedValue = value;
            if ((fieldName.toLowerCase().includes('temuan') || fieldName.toLowerCase().includes('rekomendasi')) && Array.isArray(value)) {
                processedValue = value.map(item => `- ${item}`).join('\n');
            }

            // --- INTI PERBAIKAN FINAL ---
            element.focus();

            // 1. KOSONGKAN NILAI SECARA PAKSA
            element.value = "";
            
            // 2. KIRIM EVENT BAHWA NILAI SUDAH KOSONG
            ['input', 'change'].forEach(eventName => {
                const event = new Event(eventName, { bubbles: true });
                element.dispatchEvent(event);
            });
            
            // 3. SET NILAI BARU
            element.value = processedValue;

            // 4. PICU SERANGKAIAN EVENT LENGKAP UNTUK NILAI BARU
            ['keydown', 'keypress', 'keyup', 'input', 'change'].forEach(eventName => {
                const event = new Event(eventName, { bubbles: true, cancelable: true });
                element.dispatchEvent(event);
            });

            element.blur();
            console.log(`[ia_telkom_filler.js] Force-overwrite attempted for "${fieldName}".`);

        } else {
            console.error(`[ia_telkom_filler.js] ERROR: Element with selector "${selector}" for field "${fieldName}" not found.`);
            errors.push(`Field "${fieldName}" (selector: ${selector}) not found on page.`);
        }
    }
    // ### AKHIR DARI FUNGSI YANG DIMODIFIKASI ###
    // =================================================================================

    // --- Mengisi field ---
    setFieldValue('#kelompok', data.kelompok, 'Kelompok', 'select');
    setFieldValue('input[name="no_spk"]', data.no_spk, 'No SPK');
    setFieldValue('input[name="CODE"]', data.CODE, 'CODE');
    setFieldValue('input[name="Matriks_Program"]', data.Matriks_Program, 'Matriks Program');
    setFieldValue('#Matriks_Tgl_Entry', data.Matriks_Tgl, 'Tanggal Matriks', 'date');
    setFieldValue('input[name="ND_SVP_IA_Nomor"]', data.ND_SVP_IA_Nomor, 'Nomor ND SVP IA');
    setFieldValue('input.inputDesc_ND_SVP_IA', data.Desc_ND_SVP_IA, 'Deskripsi ND SVP IA'); // Menggunakan class selector
    setFieldValue('#ND_SVP_IA_Tanggal_Entry', data.ND_SVP_IA_Tanggal, 'Tanggal ND SVP IA', 'date');
    setFieldValue('#inputND_SVP_IA_Temuan', data.ND_SVP_IA_Temuan, 'Temuan ND SVP IA', 'textarea');
    setFieldValue('#inputND_SVP_IA_Rekomendasi', data.ND_SVP_IA_Rekomendasi, 'Rekomendasi ND SVP IA', 'textarea');
    setFieldValue('input[name="ND_Dirut_Nomor"]', data.ND_Dirut_Nomor, 'Nomor ND Dirut');
    setFieldValue('input[name="Desc_ND_Dirut"]', data.Desc_ND_Dirut, 'Deskripsi ND Dirut');
    setFieldValue('input[name="ND_Dirut_Tgl"]', data.ND_Dirut_Tgl, 'Tanggal ND Dirut', 'date');
    setFieldValue('#inputND_Dirut_Temuan', data.ND_Dirut_Temuan, 'Temuan ND Dirut', 'textarea');
    setFieldValue('#inputND_Dirut_Rekomendasi', data.ND_Dirut_Rekomendasi, 'Rekomendasi ND Dirut', 'textarea');
    setFieldValue('#ND_Dirut_Duedate1', data.ND_Dirut_Duedate1, 'Duedate ND Dirut 1', 'select');
    setFieldValue('#ND_Dirut_Duedate2', data.ND_Dirut_Duedate2, 'Duedate ND Dirut 2', 'select');
    setFieldValue('input[name="ND_Dirut_PIC"]', data.ND_Dirut_PIC, 'PIC ND Dirut');
    setFieldValue('input[name="ND_Dirut_UIC"]', data.ND_Dirut_UIC, 'UIC ND Dirut');
    setFieldValue('#closeinput', data.MTL_Closed, 'MTL Closed');
    setFieldValue('#rescheduleinput', data.Reschedule, 'Reschedule');
    setFieldValue('#overdueinput', data.Overdue, 'Overdue');
    setFieldValue('#onscheduleinput', data.OnSchedule, 'OnSchedule');
    setFieldValue('#statusinput', data.Status, 'Status');

    if (errors.length > 0) {
        return { success: false, message: `Some fields could not be filled or had issues: ${errors.join('; ')}` };
    }
    return { success: true, message: "Form fields populated." };
}

// Main listener for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isCorrectPage()) {
        sendResponse({ success: false, message: "Not the target IA Telkom MTL page." });
        return true;
    }

    if (request.action === "fillMTLForm") {
        console.log("[ia_telkom_filler.js] Received fillMTLForm action.");

        const openModalButton = document.querySelector('button[data-target="#ModalAddSPK"]');
        if (openModalButton) {
            const modalElement = document.getElementById('ModalAddSPK');
            let modalAlreadyOpen = modalElement && (modalElement.classList.contains('in') || modalElement.style.display === 'block');

            if (!modalAlreadyOpen) {
                openModalButton.click();
            } else {
                console.log("[ia_telkom_filler.js] #ModalAddSPK appears to be already open or visible.");
            }

            setTimeout(() => {
                fillFormFields(request.data);
                sendResponse({ success: true, message: "Fill process attempted." });
            }, 500);

        } else {
            console.error("[ia_telkom_filler.js] 'Input Data dengan SPK Baru' button not found.");
            sendResponse({ success: false, message: "'Input Data dengan SPK Baru' button not found on the page." });
        }
        return true;
    }
});

// Initial check when script loads
if (isCorrectPage()) {
    console.log("[ia_telkom_filler.js] Content script active on IA Telkom MTL page.");
}