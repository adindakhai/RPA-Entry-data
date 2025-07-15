/**
 * @file Content script for automating form filling on the IA Telkom MTL page.
 * @version 2.0 (Refactored)
 */

console.log("[ia_telkom_filler.js] Loaded.");

/**
 * Checks if the current page is the correct IA Telkom MTL page by verifying the title or a key button.
 * @returns {boolean} True if the page is identified as correct, otherwise false.
 */
function isCorrectPage() {
    const pageTitle = document.title;
    const addButton = document.querySelector('button[data-target="#ModalAddSPK"]');

    if ((pageTitle && pageTitle.includes("IA Telkom")) || addButton) {
        console.log("[ia_telkom_filler.js] Correct page identified.");
        return true;
    }

    console.warn("[ia_telkom_filler.js] Not the IA Telkom MTL page, or key elements are missing.");
    return false;
}

/**
 * Fills form fields based on the provided data object.
 * @param {object} data - An object containing the data to fill, where keys are field identifiers.
 * @returns {{success: boolean, message: string}} An object indicating the result of the operation.
 */
function fillFormFields(data) {
    console.log("[ia_telkom_filler.js] Received data to fill:", JSON.stringify(data, null, 2));
    const errors = [];

    /**
     * Helper function to find an element and set its value.
     * Handles various input types like text, date, select, and textarea.
     * @param {string} selector - The CSS selector for the form element.
     * @param {*} value - The value to set.
     * @param {string} fieldName - A descriptive name for the field (for logging).
     * @param {string} [type='input'] - The type of the field ('input', 'select', 'textarea', 'date').
     */
    function setFieldValue(selector, value, fieldName, type = 'input') {
        console.log(`[ia_telkom_filler.js] Attempting to fill field: "${fieldName}" with selector: "${selector}"`);

        // Skip if the value is null, undefined, or a specific "not found" string, but allow empty strings.
        if (value === undefined || value === null || value === "Data belum ditemukan") {
            if (value !== "") {
                console.log(`[ia_telkom_filler.js] No valid data for "${fieldName}". Skipping.`);
                return;
            }
        }

        const element = document.querySelector(selector);
        if (!element) {
            console.error(`[ia_telkom_filler.js] ERROR: Element with selector "${selector}" for field "${fieldName}" not found.`);
            // Only report an error if there was actual data to be filled.
            if (value !== "" && value !== undefined && value !== null && value !== "Data belum ditemukan") {
                errors.push(`Field "${fieldName}" (selector: ${selector}) not found on page.`);
            }
            return;
        }

        console.log(`[ia_telkom_filler.js] SUCCESS: Found element for "${fieldName}"`, element);
        
        // Pre-process value if needed (e.g., formatting arrays into bullet points for textareas)
        let processedValue = value;
        if ((fieldName.toLowerCase().includes('temuan') || fieldName.toLowerCase().includes('rekomendasi')) && Array.isArray(value)) {
            const filteredValue = value.filter(item => !item.toLowerCase().includes("yang perlu mendapat perhatian manajemen") && !item.toLowerCase().includes("kepada manajemen dt agar"));
            processedValue = filteredValue.map(item => `- ${item}`).join('\n');
            console.log(`[ia_telkom_filler.js] Formatted array for "${fieldName}" to bulleted list.`);
        }

        // Focus and blur for better event handling
        try { element.focus(); } catch (e) { console.warn(`[ia_telkom_filler.js] Error focusing on ${fieldName}: ${e.message}`); }
        
        // Set value based on element type
        if (element.type === 'checkbox' || element.type === 'radio') {
            const checkedValue = String(processedValue).toLowerCase();
            element.checked = checkedValue === "1" || checkedValue === "true";
        } else if (element.type === 'date') {
            if (processedValue === '' || /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
                element.value = processedValue;
            } else {
                const errorMessage = `Invalid date format "${processedValue}" for "${fieldName}". Expected YYYY-MM-DD.`;
                console.warn(`[ia_telkom_filler.js] ${errorMessage}`);
                errors.push(errorMessage);
            }
        } else if (element.nodeName.toLowerCase() === 'select') {
            let optionFound = false;
            for (const option of element.options) {
                if (option.value === String(processedValue) || option.text === String(processedValue)) {
                    option.selected = true;
                    optionFound = true;
                    break;
                }
            }
            if (!optionFound && processedValue) {
                console.warn(`[ia_telkom_filler.js] Option "${processedValue}" not found for select "${fieldName}".`);
            }
        } else {
            element.value = processedValue;
        }

        // Dispatch events to ensure frameworks like React/Angular detect the change
        ['input', 'change'].forEach(eventName => {
            element.dispatchEvent(new Event(eventName, { bubbles: true, cancelable: true }));
        });
        
        try { element.blur(); } catch (e) { console.warn(`[ia_telkom_filler.js] Error blurring ${fieldName}: ${e.message}`); }
    }

    // --- Form Field Definitions ---
    // Tab 1: Default
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(1) > div > input', data.no_spk, 'No SPK');
    setFieldValue('#kelompok', data.kelompok, 'Kelompok', 'select');
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(3) > div > input', data.CODE, 'CODE');
    setFieldValue('#Masa_Penyelesaian_Pekerjaan1_Entry_form', data.Masa_Penyelesaian_Pekerjaan1_Entry_form, 'Masa Penyelesaian Pekerjaan');
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(5) > div > input', data.Matriks_Program, 'Matriks Program');
    setFieldValue('#Matriks_Tgl_Entry', data.Matriks_Tgl, 'Tanggal Matriks', 'date');

    // Tab 2: Detail ND SVP IA
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(7) > div > input', data.ND_SVP_IA_Nomor, 'Nomor ND SVP IA');
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(8) > div > input', data.Desc_ND_SVP_IA, 'Deskripsi ND SVP IA');
    setFieldValue('#ND_SVP_IA_Tanggal_Entry', data.ND_SVP_IA_Tanggal, 'Tanggal ND SVP IA', 'date');
    setFieldValue('#inputND_SVP_IA_Temuan', data.ND_SVP_IA_Temuan, 'Temuan ND SVP IA', 'textarea');
    setFieldValue('#inputND_SVP_IA_Rekomendasi', data.ND_SVP_IA_Rekomendasi, 'Rekomendasi ND SVP IA', 'textarea');

    // Tab 3: Detail ND Dirut
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(12) > div > input', data.ND_Dirut_Nomor, 'Nomor ND Dirut');
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(13) > div > input', data.Desc_ND_Dirut, 'Deskripsi ND Dirut');
    setFieldValue('#ModalAddSPK > div > div > form > div > div.container > div:nth-child(14) > div > input', data.ND_Dirut_Tgl, 'Tanggal ND Dirut', 'date');
    setFieldValue('#inputND_Dirut_Temuan', data.ND_Dirut_Temuan, 'Temuan ND Dirut', 'textarea');
    setFieldValue('#inputND_Dirut_Rekomendasi', data.ND_Dirut_Rekomendasi, 'Rekomendasi ND Dirut', 'textarea');
    setFieldValue('#ND_Dirut_Duedate1', data.ND_Dirut_Duedate1, 'Duedate ND Dirut 1', 'select');
    setFieldValue('input[name="ND_Dirut_PIC"]', data.ND_Dirut_PIC, 'PIC ND Dirut');
    setFieldValue('input[name="ND_Dirut_UIC"]', data.ND_Dirut_UIC, 'UIC ND Dirut');

    // Tab 4: Status MTL
    setFieldValue('#closeinput', data.MTL_Closed, 'MTL Closed');
    setFieldValue('#rescheduleinput', data.Reschedule, 'Reschedule');
    setFieldValue('#overdueinput', data.Overdue, 'Overdue');
    setFieldValue('#onscheduleinput', data.OnSchedule, 'OnSchedule');
    setFieldValue('#statusinput', data.Status, 'Status');

    if (errors.length > 0) {
        return { success: false, message: `Some fields could not be filled: ${errors.join('; ')}` };
    }
    
    return { success: true, message: "All form fields populated successfully." };
}

/**
 * Main listener for messages from the browser extension popup.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isCorrectPage()) {
        sendResponse({ success: false, message: "Script is not running on the target IA Telkom MTL page." });
        return true;
    }

    if (request.action === "fillMTLForm") {
        console.log("[ia_telkom_filler.js] Received 'fillMTLForm' action.");

        const openModalButton = document.querySelector('button[data-target="#ModalAddSPK"]');
        if (!openModalButton) {
            console.error("[ia_telkom_filler.js] 'Input Data dengan SPK Baru' button not found.");
            sendResponse({ success: false, message: "'Input Data dengan SPK Baru' button not found on the page." });
            return true;
        }

        const modalElement = document.getElementById('ModalAddSPK');
        const isModalOpen = modalElement && (modalElement.classList.contains('in') || modalElement.style.display === 'block');

        if (!isModalOpen) {
            openModalButton.click();
            console.log("[ia_telkom_filler.js] Clicked 'Input Data dengan SPK Baru' button to open modal.");
        } else {
            console.log("[ia_telkom_filler.js] Modal #ModalAddSPK is already open.");
        }
        
        // It's often better to wait a moment for modal animations to complete
        setTimeout(() => {
            const result = fillFormFields(request.data);
            sendResponse(result);
        }, 500); // Wait 500ms for modal to be ready

        return true; // Indicates an asynchronous response.
    }
});

/**
 * Initial execution check when the script is injected into the page.
 */
if (isCorrectPage()) {
    console.log("[ia_telkom_filler.js] Content script is active on the correct page.");
}