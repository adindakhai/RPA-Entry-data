// Content script for IA Telkom.mhtml page (ia_telkom_filler.js)
// VERSI DIPERBAIKI
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

// Polling function to wait for an element to exist in the DOM
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const interval = 100; // Check every 100ms
        let elapsed = 0;

        const checkExist = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(checkExist);
                resolve(el);
            } else if (elapsed >= timeout) {
                clearInterval(checkExist);
                reject(new Error(`Timeout: Element "${selector}" not found within ${timeout}ms.`));
            }
            elapsed += interval;
        }, interval);
    });
}

// Function to fill form fields
function fillFormFields(data) {
    console.log("[ia_telkom_filler.js] Received data to fill:", JSON.stringify(data, null, 2));
    let allFieldsFound = true;
    let errors = [];

    // Helper to set value using querySelector and log
    function setFieldValue(selector, value, fieldName, type = 'input') {
        console.log(`[ia_telkom_filler.js] Attempting to fill field: "${fieldName}" with selector: "${selector}"`);

        if (value === undefined || value === null || value === "Data belum ditemukan") {
            if (value !== "") {
                console.log(`[ia_telkom_filler.js] No valid data for "${fieldName}". Skipping.`);
                return;
            }
        }

        const element = document.querySelector(selector);
        if (element) {
            console.log(`[ia_telkom_filler.js] SUCCESS: Found element for "${fieldName}"`, element);

            let processedValue = value;
            if ((fieldName.toLowerCase().includes('temuan') || fieldName.toLowerCase().includes('rekomendasi')) && Array.isArray(value)) {
                processedValue = value.map(item => `- ${item}`).join('\n');
                console.log(`[ia_telkom_filler.js] Formatted array for "${fieldName}" to bulleted list.`);
            }

            const isCheckboxOrRadio = element.type === 'checkbox' || element.type === 'radio';

            if (typeof element.focus === 'function') {
                try { element.focus(); } catch (e) { console.warn(`[ia_telkom_filler.js] Error focusing element ${fieldName}: ${e.message}`); }
            }

            if (isCheckboxOrRadio) {
                const checkedValue = String(processedValue).toLowerCase();
                element.checked = checkedValue === "1" || checkedValue === "true";
            } else if (element.type === 'date') {
                if (processedValue === '' || /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
                    element.value = processedValue;
                } else {
                    console.warn(`[ia_telkom_filler.js] Invalid date format "${processedValue}" for "${fieldName}". Expected YYYY-MM-DD. Skipping.`);
                    errors.push(`Invalid date format for ${fieldName}: ${processedValue}`);
                    allFieldsFound = false;
                    return;
                }
            } else if (type === 'select' || element.nodeName.toLowerCase() === 'select') {
                let optionFound = false;
                for (let i = 0; i < element.options.length; i++) {
                    if (element.options[i].value === String(processedValue) || element.options[i].text === String(processedValue)) {
                        element.selectedIndex = i;
                        optionFound = true;
                        break;
                    }
                }
                if (!optionFound && processedValue !== "") {
                    console.warn(`[ia_telkom_filler.js] Option "${processedValue}" not found for select "${fieldName}".`);
                }
            } else {
                element.value = processedValue;
            }
            
            // Dispatch events to ensure frameworks like React/Angular detect the change
            const commonEvents = [
                new Event('input', { bubbles: true, cancelable: true }),
                new Event('change', { bubbles: true, cancelable: true })
            ];
            commonEvents.forEach(ev => element.dispatchEvent(ev));

            if (typeof element.blur === 'function') {
                try { element.blur(); } catch (e) { console.warn(`[ia_telkom_filler.js] Error blurring element ${fieldName}: ${e.message}`); }
            }

        } else {
            console.error(`[ia_telkom_filler.js] ERROR: Element with selector "${selector}" for field "${fieldName}" not found.`);
            if (value !== "" && value !== undefined && value !== null && value !== "Data belum ditemukan") {
                errors.push(`Field "${fieldName}" (selector: ${selector}) not found on page.`);
                allFieldsFound = false;
            }
        }
    }

    // --- Mengisi field ---
    // Field di Tab 1 (Default)
    setFieldValue('#kelompok', data.kelompok, 'Kelompok', 'select');
    setFieldValue('input[name="no_spk"]', data.no_spk, 'No SPK');
    setFieldValue('input[name="CODE"]', data.CODE, 'CODE');
    setFieldValue('input[name="Matriks_Program"]', data.Matriks_Program, 'Matriks Program');
    setFieldValue('#Matriks_Tgl_Entry', data.Matriks_Tgl, 'Tanggal Matriks', 'date');

    // Field di Tab 2 (Detail ND SVP IA) - INI YANG SEBELUMNYA GAGAL
    setFieldValue('input[name="ND_SVP_IA_Nomor"]', data.ND_SVP_IA_Nomor, 'Nomor ND SVP IA'); // Menggunakan name selector untuk konsistensi
    // PERBAIKAN: Menggunakan selector name yang lebih mungkin benar, daripada ID yang salah.
    setFieldValue('textarea[name="ND_SVP_IA_Deskripsi"]', data.Desc_ND_SVP_IA, 'Deskripsi ND SVP IA', 'textarea');
    setFieldValue('#ND_SVP_IA_Tanggal_Entry', data.ND_SVP_IA_Tanggal, 'Tanggal ND SVP IA', 'date');
    setFieldValue('#inputND_SVP_IA_Temuan', data.ND_SVP_IA_Temuan, 'Temuan ND SVP IA', 'textarea');
    setFieldValue('#inputND_SVP_IA_Rekomendasi', data.ND_SVP_IA_Rekomendasi, 'Rekomendasi ND SVP IA', 'textarea');

    // Field di Tab 3 (Detail ND Dirut)
    setFieldValue('input[name="ND_Dirut_Nomor"]', data.ND_Dirut_Nomor, 'Nomor ND Dirut');
    setFieldValue('input[name="Desc_ND_Dirut"]', data.Desc_ND_Dirut, 'Deskripsi ND Dirut');
    setFieldValue('input[name="ND_Dirut_Tgl"]', data.ND_Dirut_Tgl, 'Tanggal ND Dirut', 'date');
    setFieldValue('#inputND_Dirut_Temuan', data.ND_Dirut_Temuan, 'Temuan ND Dirut', 'textarea');
    setFieldValue('#inputND_Dirut_Rekomendasi', data.ND_Dirut_Rekomendasi, 'Rekomendasi ND Dirut', 'textarea');
    setFieldValue('#ND_Dirut_Duedate1', data.ND_Dirut_Duedate1, 'Duedate ND Dirut 1', 'select');
    setFieldValue('#ND_Dirut_Duedate2', data.ND_Dirut_Duedate2, 'Duedate ND Dirut 2', 'select');
    setFieldValue('input[name="ND_Dirut_PIC"]', data.ND_Dirut_PIC, 'PIC ND Dirut');
    setFieldValue('input[name="ND_Dirut_UIC"]', data.ND_Dirut_UIC, 'UIC ND Dirut');

    // Field di Tab 4 (Status MTL)
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
                console.log("[ia_telkom_filler.js] Clicked 'Input Data dengan SPK Baru' button.");
            } else {
                console.log("[ia_telkom_filler.js] #ModalAddSPK appears to be already open or visible.");
            }

            // PERBAIKAN: Selector diubah menjadi lebih spesifik menargetkan link ke tab ND SVP IA.
            // Ganti '#tabDetailNDIA' jika ID panel tab-nya berbeda. Anda bisa cek dengan Inspect Element.
            const tabTriggerSelector = 'a[href="#tabDetailNDIA"]'; 
            
            console.log(`[ia_telkom_filler.js] Waiting for tab trigger "${tabTriggerSelector}" to appear in DOM (max 5s)...`);

            waitForElement(tabTriggerSelector, 5000)
                .then(tabTrigger => {
                    console.log(`[ia_telkom_filler.js] Found tab trigger: ${tabTriggerSelector}. Clicking it.`);
                    tabTrigger.click();

                    // Beri jeda singkat agar konten tab sempat dirender oleh browser
                    setTimeout(() => {
                        console.log("[ia_telkom_filler.js] Proceeding to fill form after tab activation and 500ms delay.");
                        const result = fillFormFields(request.data);
                        sendResponse(result);
                    }, 500); 
                })
                .catch(error => {
                    console.warn(`[ia_telkom_filler.js] ${error.message}. Could not switch tabs. Attempting to fill form anyway.`);
                    // Fallback: Coba isi form meskipun tab gagal di-klik (untuk field di tab pertama)
                    const result = fillFormFields(request.data);
                    sendResponse(result);
                });

        } else {
            console.error("[ia_telkom_filler.js] 'Input Data dengan SPK Baru' button not found.");
            sendResponse({ success: false, message: "'Input Data dengan SPK Baru' button not found on the page." });
        }
        return true; // Indicates that the response will be sent asynchronously
    }
});

// Initial check when script loads
if (isCorrectPage()) {
    console.log("[ia_telkom_filler.js] Content script active on IA Telkom MTL page.");
}
