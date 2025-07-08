// Content script for IA Telkom.mhtml page (ia_telkom_filler.js)
console.log("[ia_telkom_filler.js] Loaded.");

let dataForFilling = null;
let confirmationIframe = null;
let iframeOverlay = null;
let originalSendResponse = null; // To store the sendResponse function

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

// Function to fill form fields (remains largely the same)
function fillFormFields(data) {
    console.log("[ia_telkom_filler.js] Received data to fill:", data);
    let allFieldsFound = true;
    let errors = [];

    function setFieldValue(selector, value, fieldName, type = 'input') {
        if (value === undefined || value === null || value === "Data belum ditemukan") {
            if (value !== "") {
                console.log(`[ia_telkom_filler.js] No valid data for "${fieldName}" (selector: ${selector}). Skipping.`);
                return;
            }
        }
        const element = document.querySelector(selector);
        if (element) {
            const isVisible = !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
            console.log(`[ia_telkom_filler.js] Element for "${fieldName}" (selector: ${selector}) found. Visible (approx): ${isVisible}`);
            let processedValue = value;
            if ((fieldName.toLowerCase().includes('temuan') || fieldName.toLowerCase().includes('rekomendasi')) && Array.isArray(value)) {
                processedValue = value.map(item => `- ${item}`).join('\n');
            }
            const checkboxIds = ["#closeinput", "#rescheduleinput", "#overdueinput", "#onscheduleinput"];
            if (checkboxIds.includes(selector.toLowerCase()) && (element.type === 'checkbox' || element.type === 'radio')) {
                const checkedValue = String(processedValue).toLowerCase();
                element.checked = checkedValue === "1" || checkedValue === "true";
                console.log(`[ia_telkom_filler.js] Set checkbox/radio "${fieldName}" to checked: ${element.checked}`);
            } else if (element.type === 'date') {
                if (processedValue === '' || /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
                    element.value = processedValue;
                } else {
                    console.warn(`[ia_telkom_filler.js] Invalid date format "${processedValue}" for "${fieldName}". Expected YYYY-MM-DD.`);
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
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            if (!(checkboxIds.includes(selector.toLowerCase()) && (element.type === 'checkbox' || element.type === 'radio'))) {
                 console.log(`[ia_telkom_filler.js] Set "${fieldName}" to: "${processedValue}"`);
            }
        } else {
            console.warn(`[ia_telkom_filler.js] Element with selector "${selector}" for field "${fieldName}" not found.`);
            if (value !== "" && value !== undefined && value !== null && value !== "Data belum ditemukan") {
                errors.push(`Field "${fieldName}" (selector: ${selector}) not found on page.`);
                allFieldsFound = false;
            }
        }
    }

    setFieldValue('#kelompok', data.kelompok, 'Kelompok', 'select');
    setFieldValue('input[name="no_spk"]', data.no_spk, 'No SPK');
    setFieldValue('input[name="CODE"]', data.CODE, 'CODE');
    const masaPekerjaanField = document.querySelector('#Masa_Penyelesaian_Pekerjaan1_Entry_form');
    if (masaPekerjaanField && data.masaPenyelesaianPekerjaan) {
        masaPekerjaanField.value = data.masaPenyelesaianPekerjaan;
        masaPekerjaanField.dispatchEvent(new Event('input', { bubbles: true }));
        masaPekerjaanField.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (data.masaPenyelesaianPekerjaan) {
        console.warn(`[ia_telkom_filler.js] Field #Masa_Penyelesaian_Pekerjaan1_Entry_form for "Masa Penyelesaian" not found, or no data.`);
    }
    setFieldValue('input[name="Matriks_Program"]', data.Matriks_Program, 'Matriks Program');
    setFieldValue('#Matriks_Tgl_Entry', data.Matriks_Tgl, 'Tanggal Matriks', 'date');
    setFieldValue('input[name="ND_SVP_IA_Nomor"]', data.ND_SVP_IA_Nomor, 'Nomor ND SVP IA');
    setFieldValue('input[name="Desc_ND_SVP_IA"]', data.Desc_ND_SVP_IA, 'Deskripsi ND SVP IA');
    setFieldValue('#ND_SVP_IA_Tanggal_Entry', data.ND_SVP_IA_Tanggal, 'Tanggal ND SVP IA', 'date');
    setFieldValue('#inputND_SVP_IA_Temuan', data.ND_SVP_IA_Temuan, 'Temuan ND SVP IA', 'textarea');
    if (data.ND_SVP_IA_Rekomendasi && data.ND_SVP_IA_Rekomendasi !== "Data belum ditemukan") {
        setFieldValue('#inputND_SVP_IA_Rekomendasi', data.ND_SVP_IA_Rekomendasi, 'Rekomendasi ND SVP IA', 'textarea');
    } else if (data.ND_SVP_IA_Rekomendasi === "") {
        setFieldValue('#inputND_SVP_IA_Rekomendasi', "", 'Rekomendasi ND SVP IA', 'textarea');
    }
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

function removeConfirmationIframe() {
    if (confirmationIframe) {
        confirmationIframe.remove();
        confirmationIframe = null;
    }
    if (iframeOverlay) {
        iframeOverlay.remove();
        iframeOverlay = null;
    }
    window.removeEventListener('message', handleIframeMessage);
    console.log("[ia_telkom_filler.js] Confirmation iframe removed.");
    // dataForFilling = null; // Keep dataForFilling for the confirm action
    // originalSendResponse = null; // Keep sendResponse for confirm/cancel
}

function handleIframeMessage(event) {
    // Basic security: check if the message is from the expected iframe source.
    // For file URLs, origin is tricky. Checking event.source is more robust.
    if (!confirmationIframe || event.source !== confirmationIframe.contentWindow) {
        // console.warn("[ia_telkom_filler.js] Message received from unknown source or iframe not active.", event.source, confirmationIframe);
        return;
    }

    console.log("[ia_telkom_filler.js] Message received from iframe:", event.data);

    const action = event.data && event.data.action;

    if (action === 'confirmFillData') {
        dataForFilling = event.data.data; // Update with potentially modified data
        removeConfirmationIframe();

        if (!dataForFilling) {
            console.error("[ia_telkom_filler.js] No data available for filling after iframe confirmation.");
            if (originalSendResponse) originalSendResponse({ success: false, message: "Error: No data after confirmation." });
            return;
        }

        const openModalButton = document.querySelector('button[data-target="#ModalAddSPK"]');
        if (openModalButton) {
            const modalElement = document.getElementById('ModalAddSPK');
            let modalAlreadyOpen = modalElement && (modalElement.classList.contains('in') || modalElement.style.display === 'block');

            if (!modalAlreadyOpen && typeof $ === 'function' && typeof $.fn.modal === 'function') {
                $('#ModalAddSPK').modal('show');
            } else if (!modalAlreadyOpen) {
                openModalButton.click();
            }

            setTimeout(() => {
                const modalForm = document.getElementById('ModalAddSPK');
                if (!modalForm || (modalForm.style.display !== 'block' && !modalForm.classList.contains('in'))) {
                    console.error("[ia_telkom_filler.js] #ModalAddSPK is not visible after attempting to open for confirm.");
                    if (originalSendResponse) originalSendResponse({ success: false, message: "Could not open or find the new entry modal (#ModalAddSPK) for confirm." });
                    return;
                }
                const result = fillFormFields(dataForFilling);
                if (originalSendResponse) originalSendResponse(result);
            }, 1000);
        } else {
            console.error("[ia_telkom_filler.js] 'Input Data dengan SPK Baru' button not found for confirm.");
            if (originalSendResponse) originalSendResponse({ success: false, message: "'Input Data dengan SPK Baru' button not found for confirm." });
        }
    } else if (action === 'cancelFillData') {
        removeConfirmationIframe();
        console.log("[ia_telkom_filler.js] User cancelled operation from iframe.");
        if (originalSendResponse) originalSendResponse({ success: false, message: "User cancelled operation." });
    }
}

function showConfirmationIframe(data) {
    if (iframeOverlay || confirmationIframe) {
        removeConfirmationIframe(); // Remove existing if any
    }

    dataForFilling = data; // Store data

    iframeOverlay = document.createElement('div');
    iframeOverlay.id = 'nde-helper-iframe-overlay';
    Object.assign(iframeOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: '2147483645', // High z-index
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    });

    const iframeContainer = document.createElement('div');
    Object.assign(iframeContainer.style, {
        position: 'relative', // For close button positioning
        width: '420px', // Width similar to popup
        height: '600px', // Height similar to popup
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px'
    });

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    Object.assign(closeButton.style, {
        position: 'absolute',
        top: '5px',
        right: '10px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#555',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        lineHeight: '1'
    });
    closeButton.onclick = () => {
        removeConfirmationIframe();
        // Also inform the original popup about cancellation if the main sendResponse is available
        if (originalSendResponse) originalSendResponse({ success: false, message: "User closed the confirmation dialog." });
    };

    confirmationIframe = document.createElement('iframe');
    confirmationIframe.id = 'nde-helper-confirmation-iframe';
    try {
        // Encode data as query parameter
        const iframeSrc = chrome.runtime.getURL("popup.html") + "?data=" + encodeURIComponent(JSON.stringify(data));
        confirmationIframe.src = iframeSrc;
    } catch (e) {
        console.error("[ia_telkom_filler.js] Error creating iframe src with data:", e, data);
        // Fallback or error handling
        if (originalSendResponse) originalSendResponse({ success: false, message: "Error preparing confirmation dialog."});
        removeConfirmationIframe(); // Clean up overlay if created
        return;
    }

    Object.assign(confirmationIframe.style, {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '8px' // Match container
    });

    iframeContainer.appendChild(closeButton);
    iframeContainer.appendChild(confirmationIframe);
    iframeOverlay.appendChild(iframeContainer);
    document.body.appendChild(iframeOverlay);

    window.addEventListener('message', handleIframeMessage, false);
    console.log("[ia_telkom_filler.js] Confirmation iframe shown.");
}


// Main listener for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isCorrectPage()) {
        sendResponse({ success: false, message: "Not the target IA Telkom MTL page." });
        return false; // Return false as we are not handling asynchronously here
    }

    if (request.action === "fillMTLForm") {
        console.log("[ia_telkom_filler.js] Received fillMTLForm action. Storing sendResponse.");
        originalSendResponse = sendResponse; // Store sendResponse for later use
        showConfirmationIframe(request.data);
        return true; // Indicates that the response will be sent asynchronously
    }
    return false; // Default for other actions if any
});

// Initial check when script loads
if (isCorrectPage()) {
    console.log("[ia_telkom_filler.js] Content script active on IA Telkom MTL page.");
}
