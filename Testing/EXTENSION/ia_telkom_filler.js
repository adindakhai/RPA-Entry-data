// Content script for IA Telkom.mhtml page (ia_telkom_filler.js)
console.log("[ia_telkom_filler.js] Loaded.");

// Function to verify if this is the correct IA Telkom page
function isCorrectPage() {
    // Check for a unique element or title.
    // For example, the presence of the "Input Data dengan SPK Baru" button
    // or a specific title.
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
    console.log("[ia_telkom_filler.js] Received data to fill:", data);
    let allFieldsFound = true; // Keep track if all *expected* fields are found
    let errors = [];

    // Helper to set value using querySelector and log
    // Type can be 'input', 'textarea', 'select', or 'date'
    function setFieldValue(selector, value, fieldName, type = 'input') {
        if (value === undefined || value === null || value === "Data belum ditemukan") {
            if (value !== "") { // Allow intentional clearing with an empty string
                console.log(`[ia_telkom_filler.js] No valid data for "${fieldName}" (selector: ${selector}). Skipping.`);
                return;
            }
        }

        const element = document.querySelector(selector);
        if (element) {
            // JULES: Log element visibility (basic check)
            const isVisible = !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
            console.log(`[ia_telkom_filler.js] Element for "${fieldName}" (selector: ${selector}) found. Visible (approx): ${isVisible}`);

            let processedValue = value;
            // Check if the field is a 'Temuan' or 'Rekomendasi' field and if the value is an array
            if ((fieldName.toLowerCase().includes('temuan') || fieldName.toLowerCase().includes('rekomendasi')) && Array.isArray(value)) {
                processedValue = value.map(item => `- ${item}`).join('\n');
                console.log(`[ia_telkom_filler.js] Formatted array for "${fieldName}" to bulleted list.`);
            }

            // JULES: Handle potential checkboxes by ID
            const checkboxIds = ["#closeinput", "#rescheduleinput", "#overdueinput", "#onscheduleinput"];
            if (checkboxIds.includes(selector.toLowerCase()) && (element.type === 'checkbox' || element.type === 'radio')) { // Added radio just in case
                const checkedValue = String(processedValue).toLowerCase();
                element.checked = checkedValue === "1" || checkedValue === "true";
                console.log(`[ia_telkom_filler.js] Set checkbox/radio "${fieldName}" (selector: ${selector}) to checked: ${element.checked} (based on value: "${processedValue}")`);
            } else if (element.type === 'date') {
                if (processedValue === '' || /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
                    element.value = processedValue;
                } else {
                    console.warn(`[ia_telkom_filler.js] Invalid date format "${processedValue}" for "${fieldName}" (selector: ${selector}). Expected YYYY-MM-DD. Skipping.`);
                    errors.push(`Invalid date format for ${fieldName}: ${processedValue}`);
                    allFieldsFound = false;
                    return;
                }
            } else if (type === 'select' || element.nodeName.toLowerCase() === 'select') { // Check nodeName as well for select
                let optionFound = false;
                for (let i = 0; i < element.options.length; i++) {
                    if (element.options[i].value === String(processedValue) || element.options[i].text === String(processedValue)) {
                        element.selectedIndex = i;
                        optionFound = true;
                        break;
                    }
                }
                if (!optionFound && processedValue !== "") { // Don't warn if intentionally clearing
                     console.warn(`[ia_telkom_filler.js] Option "${processedValue}" not found for select "${fieldName}" (selector: ${selector}).`);
                }
            } else { // input, textarea
                element.value = processedValue;
            }

            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            // JULES: For non-checkboxes, the log message is slightly different now due to checkbox handling above
            if (!(checkboxIds.includes(selector.toLowerCase()) && (element.type === 'checkbox' || element.type === 'radio'))) {
                 console.log(`[ia_telkom_filler.js] Set "${fieldName}" (selector: ${selector}) to (processed): "${processedValue}"`);
            }
        } else {
            console.warn(`[ia_telkom_filler.js] Element with selector "${selector}" for field "${fieldName}" not found.`);
            if (value !== "" && value !== undefined && value !== null && value !== "Data belum ditemukan") {
                errors.push(`Field "${fieldName}" (selector: ${selector}) not found on page.`);
                allFieldsFound = false;
            }
        }
    }

    // --- Fill fields based on user's provided list and data object ---
    // Selectors are taken from the user's table.
    // data keys match those in dataForMTL from popup.js

    // Label Dokumen                   | Selector HTML                                                    | data key from popup.js
    // ------------------------------- | ---------------------------------------------------------------- | --------------------------
    setFieldValue('#kelompok', data.kelompok, 'Kelompok', 'select');
    setFieldValue('input[name="no_spk"]', data.no_spk, 'No SPK'); // Also .inputno_spk - prefer name attribute selector
    setFieldValue('input[name="CODE"]', data.CODE, 'CODE'); // Also .inputCODE

    // Masa Penyelesaian Pekerjaan - User said #Masa_Penyelesaian_Pekerjaan1_Entry_form is disabled.
    // We'll still try to set it if the element exists and is not strictly read-only by HTML attribute.
    // JavaScript might enable it or read its value.
    const masaPekerjaanField = document.querySelector('#Masa_Penyelesaian_Pekerjaan1_Entry_form');
    if (masaPekerjaanField && data.masaPenyelesaianPekerjaan) {
        masaPekerjaanField.value = data.masaPenyelesaianPekerjaan;
        masaPekerjaanField.dispatchEvent(new Event('input', { bubbles: true }));
        masaPekerjaanField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`[ia_telkom_filler.js] Set "Masa Penyelesaian Pekerjaan" to "${data.masaPenyelesaianPekerjaan}" (field might be disabled)`);
    } else if (data.masaPenyelesaianPekerjaan) {
        console.warn(`[ia_telkom_filler.js] Field #Masa_Penyelesaian_Pekerjaan1_Entry_form for "Masa Penyelesaian" not found, or no data.`);
    }

    setFieldValue('input[name="Matriks_Program"]', data.Matriks_Program, 'Matriks Program'); // Also .inputMatriks_Program
    setFieldValue('#Matriks_Tgl_Entry', data.Matriks_Tgl, 'Tanggal Matriks', 'date');

    // --- ND SVP IA Fields ---
    // USER: Please verify these selectors if fields are not filling. Check console for "Element ... not found" errors.
    setFieldValue('input[name="ND_SVP_IA_Nomor"]', data.ND_SVP_IA_Nomor, 'Nomor ND SVP IA'); // Also .inputND_SVP_IA_Nomor. Assumed to be an input field.

    // Changed selector to be more general for Desc_ND_SVP_IA (input or textarea) and specified type as textarea.
    setFieldValue('[name="Desc_ND_SVP_IA"]', data.Desc_ND_SVP_IA, 'Deskripsi ND SVP IA', 'textarea'); // Also .inputDesc_ND_SVP_IA.

    setFieldValue('#ND_SVP_IA_Tanggal_Entry', data.ND_SVP_IA_Tanggal, 'Tanggal ND SVP IA', 'date');

    // USER: Verify ID #inputND_SVP_IA_Temuan is correct for Temuan ND SVP IA textarea.
    setFieldValue('#inputND_SVP_IA_Temuan', data.ND_SVP_IA_Temuan, 'Temuan ND SVP IA', 'textarea');

    // USER: Verify ID #inputND_SVP_IA_Rekomendasi is correct for Rekomendasi ND SVP IA textarea.
    // Previous notes indicated potential issues with this selector.
    if (data.ND_SVP_IA_Rekomendasi && data.ND_SVP_IA_Rekomendasi !== "Data belum ditemukan") {
        setFieldValue('#inputND_SVP_IA_Rekomendasi', data.ND_SVP_IA_Rekomendasi, 'Rekomendasi ND SVP IA', 'textarea');
    } else if (data.ND_SVP_IA_Rekomendasi === "") { // Handle intentional clearing
        setFieldValue('#inputND_SVP_IA_Rekomendasi', "", 'Rekomendasi ND SVP IA', 'textarea');
    }
    // --- End ND SVP IA Fields ---


    setFieldValue('input[name="ND_Dirut_Nomor"]', data.ND_Dirut_Nomor, 'Nomor ND Dirut'); // Also .inputND_Dirut_Nomor
    // User table: input[name="Desc_ND_Dirut"] atau .inputDesc_ND_Dirut_Nomor (assuming typo, should be Desc_ND_Dirut)
    setFieldValue('input[name="Desc_ND_Dirut"]', data.Desc_ND_Dirut, 'Deskripsi ND Dirut');
    setFieldValue('input[name="ND_Dirut_Tgl"]', data.ND_Dirut_Tgl, 'Tanggal ND Dirut', 'date'); // Assumed ID inputND_Dirut_Tgl, using name attr
    setFieldValue('#inputND_Dirut_Temuan', data.ND_Dirut_Temuan, 'Temuan ND Dirut', 'textarea');
    setFieldValue('#inputND_Dirut_Rekomendasi', data.ND_Dirut_Rekomendasi, 'Rekomendasi ND Dirut', 'textarea');

    setFieldValue('#ND_Dirut_Duedate1', data.ND_Dirut_Duedate1, 'Duedate ND Dirut 1', 'select'); // User table says two selects
    setFieldValue('#ND_Dirut_Duedate2', data.ND_Dirut_Duedate2, 'Duedate ND Dirut 2', 'select');

    setFieldValue('input[name="ND_Dirut_PIC"]', data.ND_Dirut_PIC, 'PIC ND Dirut');
    setFieldValue('input[name="ND_Dirut_UIC"]', data.ND_Dirut_UIC, 'UIC ND Dirut');

    setFieldValue('#closeinput', data.MTL_Closed, 'MTL Closed'); // Also input[name="MTL_Closed"]
    setFieldValue('#rescheduleinput', data.Reschedule, 'Reschedule'); // Also input[name="Reschedule"]
    setFieldValue('#overdueinput', data.Overdue, 'Overdue');   // Also input[name="Overdue"]
    setFieldValue('#onscheduleinput', data.OnSchedule, 'OnSchedule'); // Also input[name="On Schedule"]
    setFieldValue('#statusinput', data.Status, 'Status');       // Also input[name="Status"]


    if (errors.length > 0) {
        return { success: false, message: `Some fields could not be filled or had issues: ${errors.join('; ')}` };
    }
    return { success: true, message: "Form fields populated." };
}


// Main listener for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isCorrectPage()) {
        sendResponse({ success: false, message: "Not the target IA Telkom MTL page." });
        return true; // Keep channel open for async response if needed elsewhere
    }

    if (request.action === "fillMTLForm") {
        console.log("[ia_telkom_filler.js] Received fillMTLForm action.");

        // Find and click the "Input Data dengan SPK Baru" button to open the modal
        const openModalButton = document.querySelector('button[data-target="#ModalAddSPK"]');
        if (openModalButton) {
            // Check if modal is already open (Bootstrap adds 'in' class and 'display: block')
            const modalElement = document.getElementById('ModalAddSPK');
            let modalAlreadyOpen = false;
            if (modalElement) {
                modalAlreadyOpen = (modalElement.classList.contains('in') || modalElement.style.display === 'block');
            }

            if (!modalAlreadyOpen && typeof $ === 'function' && typeof $.fn.modal === 'function') {
                // If jQuery and Bootstrap's modal plugin are available, use them to open
                $('#ModalAddSPK').modal('show');
                console.log("[ia_telkom_filler.js] Attempting to show #ModalAddSPK via jQuery.");
            } else if (!modalAlreadyOpen) {
                 openModalButton.click(); // Fallback to direct click
                 console.log("[ia_telkom_filler.js] Clicked 'Input Data dengan SPK Baru' button.");
            } else {
                console.log("[ia_telkom_filler.js] #ModalAddSPK appears to be already open or visible.");
            }

            // Wait a short moment for the modal to potentially open/render if it wasn't already.
            // This is a common requirement for SPAs or pages with dynamic content.
            setTimeout(() => {
                const modalForm = document.getElementById('ModalAddSPK');
                if (!modalForm || (modalForm.style.display !== 'block' && !modalForm.classList.contains('in'))) {
                    console.error("[ia_telkom_filler.js] #ModalAddSPK is not visible after attempting to open.");
                    sendResponse({ success: false, message: "Could not open or find the new entry modal (#ModalAddSPK)." });
                    return;
                }
                const result = fillFormFields(request.data);
                sendResponse(result);
            }, 2500); // Increased timeout from 1000ms to 2500ms for modal content rendering

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
