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
    let allFieldsFound = true;
    let errors = [];

    // Helper to set value and log
    function setFieldValue(id, value, type = 'input') {
        const element = document.getElementById(id);
        if (element) {
            if (type === 'select') {
                let optionFound = false;
                for (let i = 0; i < element.options.length; i++) {
                    if (element.options[i].value === value || element.options[i].text === value) {
                        element.selectedIndex = i;
                        optionFound = true;
                        break;
                    }
                }
                if (!optionFound && value) { // If a value was provided but not matched
                     console.warn(`[ia_telkom_filler.js] Option "${value}" not found for select ID "${id}". Setting to first option or leaving as is.`);
                     // element.selectedIndex = 0; // Optionally select the first one or leave as is
                } else if (!optionFound && !value) {
                    // If no value provided, do nothing or select default
                }
            } else if (type === 'textarea') {
                element.value = value;
            } else { // input
                element.value = value;
            }
            // Dispatch input and change events to ensure any JavaScript listening for changes is triggered
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`[ia_telkom_filler.js] Set ID "${id}" to "${value}"`);
        } else {
            console.warn(`[ia_telkom_filler.js] Element with ID "${id}" not found.`);
            // Only consider it a critical error if data was provided for this field
            if (value && value !== "" && value !== 0) {
                errors.push(`Field with ID "${id}" not found.`);
                allFieldsFound = false;
            }
        }
    }

    // --- Fill fields based on user's provided list and data object ---
    // Ensure field names in `data` object match what's sent from popup.js

    setFieldValue('inputno_spk', data.no_spk); // User-provided ID
    setFieldValue('kelompok', data.kelompok, 'select'); // User-provided ID, type select
    setFieldValue('inputCODE', data.CODE); // User-provided ID

    // Masa_Penyelesaian_Pekerjaan1_Entry_form is disabled, skip as per plan.
    // ID: Masa_Penyelesaian_Pekerjaan1_Entry_form (User-provided)
    // const masaPekerjaanField = document.getElementById('Masa_Penyelesaian_Pekerjaan1_Entry_form');
    // if (masaPekerjaanField) {
    //     masaPekerjaanField.value = data.masaPenyelesaianPekerjaan || '';
    //     console.log("[ia_telkom_filler.js] Set disabled field Masa_Penyelesaian_Pekerjaan1_Entry_form");
    // }

    setFieldValue('inputMatriks_Program', data.Matriks_Program); // User-provided ID
    setFieldValue('Matriks_Tgl_Entry', data.Matriks_Tgl); // User-provided ID, type date

    setFieldValue('inputND_SVP_IA_Nomor', data.ND_SVP_IA_Nomor); // User-provided ID
    setFieldValue('inputDesc_ND_SVP_IA', data.Desc_ND_SVP_IA); // User-provided ID
    setFieldValue('ND_SVP_IA_Tanggal_Entry', data.ND_SVP_IA_Tanggal); // User-provided ID, type date

    setFieldValue('inputND_SVP_IA_Temuan', data.ND_SVP_IA_Temuan, 'textarea'); // User-provided ID

    // Rekomendasi ND SVP IA - User reports ID is 'inputND_SVP_IA_Temuan' (same as Temuan ND SVP IA)
    // This is problematic if they are two distinct fields.
    // For now, we will only attempt to fill the 'Temuan' field with this ID.
    // If 'Rekomendasi ND SVP IA' is a separate field, it needs a unique ID in the HTML.
    if (data.ND_SVP_IA_Rekomendasi && data.ND_SVP_IA_Rekomendasi !== "Data belum ditemukan") {
        const temuanField = document.getElementById('inputND_SVP_IA_Temuan');
        if (temuanField && temuanField.value === data.ND_SVP_IA_Temuan) { // Check if Temuan was already filled
             console.warn(`[ia_telkom_filler.js] 'Rekomendasi ND SVP IA' has data ("${data.ND_SVP_IA_Rekomendasi}") but its specified ID 'inputND_SVP_IA_Temuan' is the same as 'Temuan ND SVP IA'. Cannot reliably fill 'Rekomendasi ND SVP IA' if it's a separate field. Please ensure it has a unique ID in the HTML. Data for Rekomendasi ND SVP IA was not filled to avoid overwriting Temuan.`);
             errors.push("'Rekomendasi ND SVP IA' field ID conflicts with 'Temuan ND SVP IA'. Rekomendasi data not filled.");
        } else if (temuanField) {
            // If temuan field is empty or different, and we are meant to fill Rekomendasi here.
            // This assumes 'inputND_SVP_IA_Temuan' is indeed for Rekomendasi if Temuan data was absent or different.
            // This is still risky.
            // setFieldValue('inputND_SVP_IA_Temuan', data.ND_SVP_IA_Rekomendasi, 'textarea');
            // console.log(`[ia_telkom_filler.js] Filled 'inputND_SVP_IA_Temuan' with Rekomendasi data as Temuan data was different or absent.`);
            console.warn(`[ia_telkom_filler.js] 'Rekomendasi ND SVP IA' has data but its ID 'inputND_SVP_IA_Temuan' is problematic. Rekomendasi data not filled.`);
            errors.push("'Rekomendasi ND SVP IA' field ID is problematic. Rekomendasi data not filled.");
        } else {
            // If even the 'inputND_SVP_IA_Temuan' field itself isn't found.
            console.warn("[ia_telkom_filler.js] Field for 'Temuan/Rekomendasi ND SVP IA' with ID 'inputND_SVP_IA_Temuan' not found.");
            if (data.ND_SVP_IA_Rekomendasi && data.ND_SVP_IA_Rekomendasi !== "Data belum ditemukan") {
                 errors.push("Field for 'Rekomendasi ND SVP IA' (ID 'inputND_SVP_IA_Temuan') not found.");
            }
        }
    }


    setFieldValue('inputND_Dirut_Nomor', data.ND_Dirut_Nomor); // User-provided ID
    setFieldValue('inputDesc_ND_Dirut', data.Desc_ND_Dirut); // User-provided ID
    setFieldValue('inputND_Dirut_Tgl', data.ND_Dirut_Tgl); // User-provided ID, type date
    setFieldValue('inputND_Dirut_Temuan', data.ND_Dirut_Temuan, 'textarea'); // User-provided ID
    setFieldValue('inputND_Dirut_Rekomendasi', data.ND_Dirut_Rekomendasi, 'textarea'); // User-provided ID

    // Duedate ND Dirut - consists of two dropdowns
    setFieldValue('ND_Dirut_Duedate1', data.ND_Dirut_Duedate1, 'select'); // User-provided ID
    setFieldValue('ND_Dirut_Duedate2', data.ND_Dirut_Duedate2, 'select'); // User-provided ID

    setFieldValue('inputND_Dirut_PIC', data.ND_Dirut_PIC); // User-provided ID
    setFieldValue('inputND_Dirut_UIC', data.ND_Dirut_UIC); // User-provided ID

    // IDs for status fields seem to be direct from user's list
    setFieldValue('closeinput', data.MTL_Closed);
    setFieldValue('rescheduleinput', data.Reschedule);
    setFieldValue('overdueinput', data.Overdue);
    setFieldValue('onscheduleinput', data.OnSchedule);
    setFieldValue('statusinput', data.Status);

    if (errors.length > 0) {
        return { success: false, message: `Some fields could not be filled or had issues: ${errors.join(', ')}` };
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
            }, 1000); // Adjust timeout as needed, or implement MutationObserver for robustness

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
