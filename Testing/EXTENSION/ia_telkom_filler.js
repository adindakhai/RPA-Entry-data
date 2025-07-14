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

// NEW: Polling function to wait for an element to exist in the DOM
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


// OLD: Function to wait for an element to be visible (REPLACED by waitForElement for this use case, but kept for reference/other uses if needed)
function waitForElementVisibility(selector, parentNodeToObserve, timeoutDuration = 7000) {
    return new Promise((resolve, reject) => {
        const isVisible = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            // Simplified check: primarily rely on not being display:none and being in the offset tree.
            if (style.display === 'none') {
                return false;
            }
            return el.offsetParent !== null;
            // More comprehensive original checks (can be re-enabled if this is too loose):
            // if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            //     return false;
            // }
            // return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && el.offsetParent !== null;
        };

        let element = document.querySelector(selector);
        if (element && isVisible(element)) {
            resolve(element);
            return;
        }

        let observer;
        const timeout = setTimeout(() => {
            if (observer) observer.disconnect();
            reject(new Error(`Timeout: Element "${selector}" did not become visible within ${timeoutDuration}ms.`));
        }, timeoutDuration);

        observer = new MutationObserver((mutationsList, obs) => {
            element = document.querySelector(selector);
            if (element && isVisible(element)) {
                clearTimeout(timeout);
                obs.disconnect();
                resolve(element);
            }
        });

        const observeTargetNode = parentNodeToObserve || document.body; // Fallback to document.body if no specific parent
        observer.observe(observeTargetNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class'] // Observe changes to style and class attributes
        });
    });
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
            // Visibility logging removed for this iteration to simplify.
            // console.log(`[ia_telkom_filler.js] Element for "${fieldName}" (selector: ${selector}) found. Visible (approx): ${isVisible}`);

            let processedValue = value;
            // Check if the field is a 'Temuan' or 'Rekomendasi' field and if the value is an array
            if ((fieldName.toLowerCase().includes('temuan') || fieldName.toLowerCase().includes('rekomendasi')) && Array.isArray(value)) {
                processedValue = value.map(item => `- ${item}`).join('\n');
                console.log(`[ia_telkom_filler.js] Formatted array for "${fieldName}" to bulleted list.`);
            }

            // JULES: Handle potential checkboxes by ID
            const checkboxIds = ["#closeinput", "#rescheduleinput", "#overdueinput", "#onscheduleinput"];
            const isCheckboxOrRadio = checkboxIds.includes(selector.toLowerCase()) && (element.type === 'checkbox' || element.type === 'radio');

            if (typeof element.focus === 'function') {
                try { element.focus(); } catch (e) { console.warn(`[ia_telkom_filler.js] Error focusing element ${fieldName}: ${e.message}`); }
            }

            if (isCheckboxOrRadio) {
                const checkedValue = String(processedValue).toLowerCase();
                element.checked = checkedValue === "1" || checkedValue === "true";
                // console.log for checkbox/radio is now part of the logging at the end.
            } else if (element.type === 'date') {
                if (processedValue === '' || /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
                    element.value = processedValue;
                } else {
                    console.warn(`[ia_telkom_filler.js] Invalid date format "${processedValue}" for "${fieldName}" (selector: ${selector}). Expected YYYY-MM-DD. Skipping.`);
                    errors.push(`Invalid date format for ${fieldName}: ${processedValue}`);
                    allFieldsFound = false;
                    return; // Skip event dispatching for invalid date
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
                     console.warn(`[ia_telkom_filler.js] Option "${processedValue}" not found for select "${fieldName}" (selector: ${selector}).`);
                }
            } else { // input, textarea
                element.value = processedValue;
            }

            // Dispatch a comprehensive sequence of events
            const commonEvents = [
                new Event('input', { bubbles: true, cancelable: true }), // Basic input event
                new Event('change', { bubbles: true, cancelable: true }) // Basic change event
            ];

            if (element.type === 'text' || element.type === 'textarea' || element.type === 'date' || element.nodeName.toLowerCase() === 'textarea') {
                // More elaborate sequence for text-like fields
                element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })); // Simulate a key press
                try { // InputEvent is more modern for text input
                    element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText' }));
                } catch (e) { // Fallback for older environments or if InputEvent is not applicable
                    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }
                element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: ' ' }));
                commonEvents.forEach(ev => element.dispatchEvent(ev)); // Dispatch change after keyup and input
            } else {
                // For other types like select, checkbox, radio
                commonEvents.forEach(ev => element.dispatchEvent(ev));
            }

            if (typeof element.blur === 'function') {
                try { element.blur(); } catch (e) { console.warn(`[ia_telkom_filler.js] Error blurring element ${fieldName}: ${e.message}`);}
            }

            // Centralized logging of successful value setting
            if (isCheckboxOrRadio) {
                console.log(`[ia_telkom_filler.js] Set checkbox/radio "${fieldName}" (selector: ${selector}) to checked: ${element.checked} (based on value: "${processedValue}")`);
            } else {
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
    setFieldValue('#ND_SVP_IA_Nomor_form', data.ND_SVP_IA_Nomor, 'Nomor ND SVP IA'); // Changed selector to ID based on user feedback. Assumed to be an input field.

    // Corrected selector and type for Deskripsi ND SVP IA based on user feedback.
    setFieldValue('#ND_SVP_IA_Deskripsi_form', data.Desc_ND_SVP_IA, 'Deskripsi ND SVP IA', 'input');

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

            // Using waitForElement to ensure the tab trigger is in the DOM
            const tabTriggerSelector = '#pills-profile-tab'; // Corrected selector to use ID, based on user inspection

            // Log modal body content before polling for tab trigger
            const modalElementForLog = document.getElementById('ModalAddSPK');
            if (modalElementForLog) {
                const modalBodyForLog = modalElementForLog.querySelector('.modal-body');
                if (modalBodyForLog) {
                    console.log("[ia_telkom_filler.js] HTML of .modal-body before polling for tab trigger (first 3000 chars):", modalBodyForLog.innerHTML.substring(0, 3000));
                } else {
                    console.log("[ia_telkom_filler.js] .modal-body not found for logging inside #ModalAddSPK.");
                }
            } else {
                console.log("[ia_telkom_filler.js] #ModalAddSPK not found for logging.");
            }

            console.log(`[ia_telkom_filler.js] Waiting for tab trigger "${tabTriggerSelector}" to appear in DOM (max 10s)...`); // Updated log message

            waitForElement(tabTriggerSelector, 5000) // Increased timeout to 10 seconds for the tab trigger
                .then(tabTrigger => {
                    console.log(`[ia_telkom_filler.js] Found tab trigger: ${tabTriggerSelector}. Checking if active and clicking if necessary...`);
                    // Check if the tab is already active to avoid unnecessary click and delay
                    const targetPaneId = tabTrigger.getAttribute('href'); // Should be '#tabDetailNDIA'
                    const targetPane = targetPaneId ? document.querySelector(targetPaneId) : null;

                    if (tabTrigger.classList.contains('active') && targetPane && targetPane.classList.contains('active')) {
                        console.log("[ia_telkom_filler.js] Detail ND SVP IA tab is already active. Proceeding to fill form.");
                        const result = fillFormFields(request.data);
                        sendResponse(result);
                    } else {
                        console.log(`[ia_telkom_filler.js] Clicking Detail ND SVP IA tab trigger: ${tabTriggerSelector}`);
                        tabTrigger.click();
                        setTimeout(() => {
                            console.log("[ia_telkom_filler.js] Proceeding to fill form after tab activation and 700ms delay.");
                            const result = fillFormFields(request.data);
                            sendResponse(result);
                        }, 700); // Delay for tab content to render
                    }
                })
                .catch(error => {
                    console.warn(`[ia_telkom_filler.js] ${error.message}. Proceeding without tab switch.`);
                    // Fallback: attempt to fill the form directly if tab trigger isn't found after polling
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
