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

// ===== Modifications in ia_telkom_filler.js to ensure ND SVP IA fields & error messages =====

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isCorrectPage()) {
        sendResponse({ success: false, message: "Script is not running on the target IA Telkom MTL page." });
        return true;
    }

    if (request.action === "fillMTLForm") {
        console.log("[ia_telkom_filler.js] Received 'fillMTLForm' action.");

        const openModalButton = document.querySelector('button[data-target="#ModalAddSPK"]');
        const modalElement = document.getElementById('ModalAddSPK');
        const isModalOpen = modalElement && (modalElement.classList.contains('in') || modalElement.style.display === 'block');

        if (!isModalOpen) {
            openModalButton.click();
            console.log("[ia_telkom_filler.js] Clicked to open modal.");

            const ndSvpIaTab = document.querySelector('a[href="#pills-profile"], button[aria-controls="pills-profile"]');
            if (ndSvpIaTab) {
                ndSvpIaTab.click();
                console.log("[ia_telkom_filler.js] Switched to ND SVP IA tab.");
            } else {
                console.warn("[ia_telkom_filler.js] ND SVP IA tab button not found.");
            }
        } else {
            console.log("[ia_telkom_filler.js] Modal already open.");
        }

        setTimeout(() => {
            const data = request.data || {};
            const fields = {
                "no_spk": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(1) > div > input",
                "kelompok": "#kelompok",
                "CODE": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(3) > div > input",
                "Masa_Penyelesaian_Pekerjaan": "#Masa_Penyelesaian_Pekerjaan1_Entry_form",
                "Matriks_Program": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(5) > div > input",
                "Matriks_Tgl": "#Matriks_Tgl_Entry",
                "ND_SVP_IA_Nomor": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(7) > div > input",
                "Desc_ND_SVP_IA": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(8) > div > input",
                "ND_SVP_IA_Tanggal": "#ND_SVP_IA_Tanggal_Entry",
                "ND_SVP_IA_Temuan": "#inputND_SVP_IA_Temuan",
                "ND_SVP_IA_Rekomendasi": "#inputND_SVP_IA_Rekomendasi",
                "ND_Dirut_Nomor": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(12) > div > input",
                "Desc_ND_Dirut": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(13) > div > input",
                "ND_Dirut_Tgl": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(14) > div > input",
                "ND_Dirut_Temuan": "#inputND_Dirut_Temuan",
                "ND_Dirut_Rekomendasi": "#inputND_Dirut_Rekomendasi",
                "ND_Dirut_Duedate1": "#ND_Dirut_Duedate1",
                "ND_Dirut_PIC": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(18) > div > input",
                "ND_Dirut_UIC": "#ModalAddSPK > div > div > form > div > div.container > div:nth-child(19) > div > input",
                "MTL_Closed": "#closeinput",
                "Reschedule": "#rescheduleinput",
                "Overdue": "#overdueinput",
                "OnSchedule": "#onscheduleinput",
                "Status": "#statusinput"
            };

            Object.entries(fields).forEach(([key, selector]) => {
                const el = document.querySelector(selector);
                if (!el) {
                    console.warn(`[ia_telkom_filler.js] Element for ${key} not found.`);
                    return;
                }
                if (!(key in data)) {
                    el.value = "Data tidak sampai";
                } else if (data[key] === null || data[key] === "") {
                    el.value = "Data tidak ditemukan dalam notadinas";
                } else {
                    el.value = data[key];
                }
                console.log(`[ia_telkom_filler.js] Set ${key} =>`, el.value);
            });

            sendResponse({ success: true });
        }, 1000);

        return true;
    }
});

/**
 * Initial execution check when the script is injected into the page.
 */
if (isCorrectPage()) {
    console.log("[ia_telkom_filler.js] Content script is active on the correct page.");
}