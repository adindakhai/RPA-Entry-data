document.addEventListener('DOMContentLoaded', () => {
    const isIframeMode = window.self !== window.top;
    console.log("[popup.js] Initializing. Iframe mode:", isIframeMode);

    // --- Tab Switching Logic (Not applicable in iframe mode directly, but keep for normal popup) ---
    const tabTriggers = document.querySelectorAll('.tabs-trigger');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function to switch tabs
    function switchTab(targetTabId) {
        tabTriggers.forEach(trigger => {
            trigger.classList.toggle('active', trigger.dataset.tab === targetTabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${targetTabId}-tab`);
        });
    }

    // Add click listeners to tab triggers
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            switchTab(trigger.dataset.tab);
        });
    });

    // Set initial active tab (e.g., 'basic')
    // The 'active' class should already be on the 'basic' tab trigger and content in HTML.
    // If not, uncomment and set here:
    // switchTab('basic');


    // --- Existing Logic (Adapted) ---
    const getDataBtn = document.getElementById('get-data-btn');
    const sendDataBtn = document.getElementById('send-data-btn');
    const cancelDataBtn = document.getElementById('cancel-data-btn'); // New cancel button
    const dataDisplayDiv = document.getElementById('data-display'); // Used to show/hide form area
    const statusError = document.getElementById('status-error');
    // const mainContentArea = document.querySelector('.flex-1.p-4'); // Not used with current HTML

    // Input fields
    const nomorNotaInput = document.getElementById('popup-nomor-nota');
    const perihalInput = document.getElementById('popup-perihal');
    const pengirimInput = document.getElementById('popup-pengirim');
    const idLampiranInput = document.getElementById('popup-id-lampiran');
    const noSpkInput = document.getElementById('popup-no-spk');
    const tanggalNdSvpIaInput = document.getElementById('popup-tanggal-nd-svp-ia');
    const temuanNdSvpIaInput = document.getElementById('popup-temuan-nd-svp-ia');
    const rekomendasiNdSvpIaInput = document.getElementById('popup-rekomendasi-nd-svp-ia');

    const kelompokInput = document.getElementById('popup-kelompok');
    const codeInput = document.getElementById('popup-code');
    const masaPenyelesaianInput = document.getElementById('popup-masa-penyelesaian');
    const matriksProgramInput = document.getElementById('popup-matriks-program');
    const tanggalMatriksInput = document.getElementById('popup-tanggal-matriks');

    const ndDirutNomorInput = document.getElementById('popup-nd-dirut-nomor');
    const ndDirutTanggalInput = document.getElementById('popup-nd-dirut-tanggal');
    const ndDirutDeskripsiInput = document.getElementById('popup-nd-dirut-deskripsi');
    const ndDirutTemuanInput = document.getElementById('popup-nd-dirut-temuan');
    const ndDirutRekomendasiInput = document.getElementById('popup-nd-dirut-rekomendasi');
    const ndDirutDuedate1Input = document.getElementById('popup-nd-dirut-duedate1');
    const ndDirutDuedate2Input = document.getElementById('popup-nd-dirut-duedate2');
    const ndDirutPicInput = document.getElementById('popup-nd-dirut-pic');
    const ndDirutUicInput = document.getElementById('popup-nd-dirut-uic');

    const mtlClosedInput = document.getElementById('popup-mtl-closed');
    const rescheduleInput = document.getElementById('popup-reschedule');
    const overdueInput = document.getElementById('popup-overdue');
    const onscheduleInput = document.getElementById('popup-onschedule');
    const statusInput = document.getElementById('popup-status');


    function formatDateForInput(dateStr) {
        if (!dateStr || dateStr === "Data belum ditemukan") return '';
        const months = {
            "januari": "01", "februari": "02", "maret": "03", "april": "04",
            "mei": "05", "juni": "06", "juli": "07", "agustus": "08",
            "september": "09", "oktober": "10", "november": "11", "desember": "12"
        };
        const parts = dateStr.toLowerCase().split(' ');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = months[parts[1]];
            const year = parts[2];
            if (day && month && year && year.length === 4) {
                return `${year}-${month}-${day}`;
            }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        console.warn(`[popup.js] Could not parse date: ${dateStr} into YYYY-MM-DD. Returning empty.`);
        return '';
    }

    const showError = (message) => {
        const errorTextEl = statusError.querySelector('p'); // Assuming the <p> is the direct child for text
        if (!message || message.trim() === "") {
            statusError.style.display = 'none';
            if (errorTextEl) errorTextEl.textContent = '';
            dataDisplayDiv.style.display = ''; // Ensure form is visible if no error
            return;
        }
        dataDisplayDiv.style.display = 'none'; // Hide form if there is an error
        statusError.style.display = '';
        if (errorTextEl) errorTextEl.textContent = message;
        if (sendDataBtn) sendDataBtn.disabled = true;
    };

    const showForm = () => {
        statusError.style.display = 'none';
        dataDisplayDiv.style.display = '';
        if (sendDataBtn) sendDataBtn.disabled = false;
    };

    const showLoading = (isLoading, buttonType = 'extract') => {
        let btn, icon, textSpan;

        if (buttonType === 'extract' && getDataBtn) {
            btn = getDataBtn;
            icon = btn.querySelector('i');
            textSpan = btn.querySelector('span');
            if (isLoading) {
                if(icon) icon.className = 'fas fa-spinner animate-spin text-xs mr-1';
                if(textSpan) textSpan.textContent = 'Extracting...';
                btn.disabled = true;
            } else {
                if(icon) icon.className = 'fas fa-download text-xs mr-1';
                if(textSpan) textSpan.textContent = 'Extract Data';
                btn.disabled = false;
            }
        } else if (buttonType === 'send' && sendDataBtn) {
            btn = sendDataBtn;
            icon = btn.querySelector('i');
            textSpan = btn.querySelector('span');
            // const originalIconClass = 'fas fa-paper-plane text-xs mr-1';
            if (isLoading) {
                if(icon) icon.className = 'fas fa-spinner animate-spin text-xs mr-1';
                if(textSpan) textSpan.textContent = isIframeMode ? 'Confirming...' : 'Sending...';
                btn.disabled = true;
            } else {
                // Resetting is handled by the calling function typically
                // if(icon) icon.className = originalIconClass;
                // if(textSpan) textSpan.textContent = isIframeMode ? 'Confirm' : 'Send to MTL';
                // btn.disabled = false;
            }
        }
    };

    function populateFormFields(data) {
        const d = data || {}; // Handle null or undefined data
        const safeSet = (value) => (value && value !== "Data belum ditemukan" ? value : "");

        if (nomorNotaInput) nomorNotaInput.value = safeSet(d.nomorNdSvpIa || d.ND_SVP_IA_Nomor); // Check both key styles
        if (perihalInput) perihalInput.value = safeSet(d.deskripsiNdSvpIa || d.Desc_ND_SVP_IA);
        if (pengirimInput) pengirimInput.value = safeSet(d.pengirim);
        if (idLampiranInput) idLampiranInput.value = safeSet(d.idLampiran);

        if (noSpkInput) noSpkInput.value = safeSet(d.noSPK || d.no_spk);
        if (tanggalNdSvpIaInput) tanggalNdSvpIaInput.value = formatDateForInput(safeSet(d.tanggalNdSvpIa || d.ND_SVP_IA_Tanggal));
        if (temuanNdSvpIaInput) temuanNdSvpIaInput.value = safeSet(d.temuanNdSvpIa || d.ND_SVP_IA_Temuan);
        if (rekomendasiNdSvpIaInput) rekomendasiNdSvpIaInput.value = highlightRekomendasi(safeSet(d.rekomendasiNdSvpIa || d.ND_SVP_IA_Rekomendasi));

        if (kelompokInput) kelompokInput.value = safeSet(d.kelompok);
        if (codeInput) codeInput.value = safeSet(d.code || d.CODE);
        if (masaPenyelesaianInput) masaPenyelesaianInput.value = safeSet(d.masaPenyelesaianPekerjaan);
        if (matriksProgramInput) matriksProgramInput.value = safeSet(d.matriksProgram || d.Matriks_Program);
        if (tanggalMatriksInput) tanggalMatriksInput.value = formatDateForInput(safeSet(d.tanggalMatriks || d.Matriks_Tgl));

        if (ndDirutNomorInput) ndDirutNomorInput.value = safeSet(d.nomorNdDirut || d.ND_Dirut_Nomor);
        if (ndDirutTanggalInput) ndDirutTanggalInput.value = formatDateForInput(safeSet(d.tanggalNdDirut || d.ND_Dirut_Tgl));
        if (ndDirutDeskripsiInput) ndDirutDeskripsiInput.value = safeSet(d.deskripsiNdDirut || d.Desc_ND_Dirut);
        if (ndDirutTemuanInput) ndDirutTemuanInput.value = safeSet(d.temuanNdDirut || d.ND_Dirut_Temuan);
        if (ndDirutRekomendasiInput) ndDirutRekomendasiInput.value = safeSet(d.rekomendasiNdDirut || d.ND_Dirut_Rekomendasi);
        if (ndDirutDuedate1Input) ndDirutDuedate1Input.value = formatDateForInput(safeSet(d.duedateNdDirut || d.ND_Dirut_Duedate1));
        if (ndDirutDuedate2Input) ndDirutDuedate2Input.value = formatDateForInput(safeSet(d.ND_Dirut_Duedate2 || "")); // Check for Duedate2 specifically
        if (ndDirutPicInput) ndDirutPicInput.value = safeSet(d.picNdDirut || d.ND_Dirut_PIC);
        if (ndDirutUicInput) ndDirutUicInput.value = safeSet(d.uicNdDirut || d.ND_Dirut_UIC);

        const mtlClosedVal = d.mtlClosed !== undefined ? d.mtlClosed : (d.MTL_Closed !== undefined ? d.MTL_Closed : "");
        if (mtlClosedInput) mtlClosedInput.value = (mtlClosedVal !== "Data belum ditemukan" && mtlClosedVal !== "") ? Number(mtlClosedVal) : "";

        const rescheduleVal = d.reschedule !== undefined ? d.reschedule : (d.Reschedule !== undefined ? d.Reschedule : "");
        if (rescheduleInput) rescheduleInput.value = (rescheduleVal !== "Data belum ditemukan" && rescheduleVal !== "") ? Number(rescheduleVal) : "";

        const overdueVal = d.overdue !== undefined ? d.overdue : (d.Overdue !== undefined ? d.Overdue : "");
        if (overdueInput) overdueInput.value = (overdueVal !== "Data belum ditemukan" && overdueVal !== "") ? Number(overdueVal) : "";

        const onscheduleVal = d.onSchedule !== undefined ? d.onSchedule : (d.OnSchedule !== undefined ? d.OnSchedule : "");
        if (onscheduleInput) onscheduleInput.value = (onscheduleVal !== "Data belum ditemukan" && onscheduleVal !== "") ? Number(onscheduleVal) : "";

        if (statusInput) statusInput.value = safeSet(d.status || d.Status);

        console.log("[popup.js] Form fields populated with data:", d);
        showForm(); // Ensure form is visible and send button might be enabled
        if(sendDataBtn && !isIframeMode) sendDataBtn.disabled = false; // Enable only if not in iframe initially
        if(sendDataBtn && isIframeMode) sendDataBtn.disabled = false; // Always enable in iframe mode as data is preloaded
    }

    function highlightRekomendasi(rekomendasi) {
        if (!rekomendasi) return '';
        const lines = rekomendasi.split(/\r?\n/).filter(Boolean);
        const highlights = lines.map(line => {
            const match = line.match(/^(.*?[\.,]|(?:\S+\s+){1,10})/);
            return match ? match[0].trim() : line.trim();
        });
        return highlights.join('\n');
    }

    const originalGetDataResponseHandler = async (response) => {
        if (!isIframeMode) showLoading(false, 'extract'); // Only show loading for extract in normal mode
        if (chrome.runtime.lastError) {
            showError('Failed to connect to page. Ensure "Allow access to file URLs" is enabled and refresh NDE page.');
            console.error("[popup.js] sendMessage lastError:", chrome.runtime.lastError.message);
            return;
        }

        if (response && response.success && response.data) {
            console.log("[popup.js] Data received from content.js:", response.data);
            if (!isIframeMode && chrome.storage) { // Only use storage in normal mode
                 await chrome.storage.local.set({ ndeToMtlExtractedData: response.data });
            }
            populateFormFields(response.data);
        } else if (response && !response.success) {
            showError(response.message || 'Content script reported an issue.');
        } else {
            showError('No response or invalid data from page. Refresh NDE page and extension.');
        }
    };

    function getCurrentFormData() {
        // This function should collect all data from the form fields
        // It's the same logic used to build dataForMTL, so we can reuse/refactor later
        // For now, directly creating the object:
        const fallback = (value, fallbackValue = '') => (value !== undefined && value !== null ? value : fallbackValue);

        // In iframe mode, we don't have 'content' from storage, so we rely purely on form fields.
        // Or, we could use the initially passed data as a base if needed, but for now, let's take current form values.
        const currentData = {
            kelompok:           kelompokInput.value,
            no_spk:             noSpkInput.value,
            CODE:               codeInput.value,
            masaPenyelesaianPekerjaan: masaPenyelesaianInput.value,
            Matriks_Program:    matriksProgramInput.value,
            Matriks_Tgl:        tanggalMatriksInput.value,

            ND_SVP_IA_Nomor:    nomorNotaInput.value,
            Desc_ND_SVP_IA:     perihalInput.value,
            ND_SVP_IA_Tanggal:  tanggalNdSvpIaInput.value,
            ND_SVP_IA_Temuan:   temuanNdSvpIaInput.value,
            ND_SVP_IA_Rekomendasi: rekomendasiNdSvpIaInput.value,

            ND_Dirut_Nomor:     ndDirutNomorInput.value,
            Desc_ND_Dirut:      ndDirutDeskripsiInput.value,
            ND_Dirut_Tgl:       ndDirutTanggalInput.value,
            ND_Dirut_Temuan:    ndDirutTemuanInput.value,
            ND_Dirut_Rekomendasi: ndDirutRekomendasiInput.value,
            ND_Dirut_Duedate1:  ndDirutDuedate1Input.value,
            ND_Dirut_Duedate2:  ndDirutDuedate2Input.value,
            ND_Dirut_PIC:       ndDirutPicInput.value,
            ND_Dirut_UIC:       ndDirutUicInput.value,

            MTL_Closed:         mtlClosedInput.value !== "" ? Number(mtlClosedInput.value)   : 0,
            Reschedule:         rescheduleInput.value !== ""? Number(rescheduleInput.value)  : 0,
            Overdue:            overdueInput.value !== ""   ? Number(overdueInput.value)     : 0,
            OnSchedule:         onscheduleInput.value !== ""? Number(onscheduleInput.value)  : 1, // Default 1
            Status:             statusInput.value || 'OnSchedule', // Default

            idLampiran:         idLampiranInput.value,
            pengirim:           pengirimInput.value,
        };
        console.log("[popup.js] getCurrentFormData:", currentData);
        return currentData;
    }


    if (isIframeMode) {
        // Iframe Mode Specific Logic
        if (getDataBtn) getDataBtn.style.display = 'none'; // Hide extract button
        if (cancelDataBtn) cancelDataBtn.style.display = ''; // Show cancel button
        if (sendDataBtn) {
            const sendText = sendDataBtn.querySelector('span');
            if (sendText) sendText.textContent = 'Confirm Fill';
            sendDataBtn.disabled = true; // Will be enabled once data is populated
        }

        const header = document.querySelector('.bg-white.border-b');
        if(header) header.style.display = 'none'; // Hide header in iframe
        const footer = document.querySelector('.bg-slate-100.border-t');
        if(footer) footer.style.display = 'none'; // Hide footer in iframe
        document.body.style.minHeight = 'auto'; // Adjust body height for iframe

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const dataParam = urlParams.get('data');
            if (dataParam) {
                const initialData = JSON.parse(decodeURIComponent(dataParam));
                console.log("[popup.js] Iframe mode: Received initial data from URL:", initialData);
                populateFormFields(initialData); // Populate form with this data
                 if (sendDataBtn) sendDataBtn.disabled = false; // Enable confirm button
            } else {
                console.warn("[popup.js] Iframe mode: No data found in URL query parameter.");
                showError("No data provided to confirmation dialog.");
            }
        } catch (e) {
            console.error("[popup.js] Iframe mode: Error parsing data from URL:", e);
            showError("Error loading data in confirmation dialog.");
        }

        if (sendDataBtn) {
            sendDataBtn.addEventListener('click', () => {
                console.log("[popup.js] Iframe mode: Confirm button clicked.");
                const currentData = getCurrentFormData();
                window.parent.postMessage({ action: 'confirmFillData', data: currentData }, '*');
            });
        }
        if (cancelDataBtn) {
            cancelDataBtn.addEventListener('click', () => {
                console.log("[popup.js] Iframe mode: Cancel button clicked.");
                window.parent.postMessage({ action: 'cancelFillData' }, '*');
            });
        }

    } else {
        // Normal Popup Mode Logic
        if (getDataBtn) {
            getDataBtn.addEventListener('click', async () => {
                showLoading(true, 'extract');
                try {
                    // Standard chrome.tabs.query logic for extension popup
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab) {
                        showLoading(false, 'extract');
                        showError("Cannot access current tab. Try again.");
                        return;
                    }
                    const allowed = (
                        tab.url &&
                        (tab.url.includes('nde_mockup.html') ||
                        tab.url.toLowerCase().endsWith('.mhtml') ||
                        tab.url.toLowerCase().includes('notadinas'))
                    );
                    if (!allowed) {
                        showLoading(false, 'extract');
                        showError('Please open a supported NDE or Notadinas file!');
                        return;
                    }
                    chrome.tabs.sendMessage(tab.id, { action: "getDataFromNDE" }, originalGetDataResponseHandler);
                } catch (error) {
                    showLoading(false, 'extract');
                    showError('An unexpected error occurred: ' + error.message);
                    console.error('Error in getDataBtn:', error);
                }
            });
        }

        if (sendDataBtn) {
            sendDataBtn.addEventListener('click', async () => {
                const sendIcon = sendDataBtn.querySelector('i');
                const sendText = sendDataBtn.querySelector('span');
                const originalIconClass = sendIcon ? sendIcon.className : '';
                const originalTextContent = sendText ? sendText.textContent : '';

                showLoading(true, 'send');
                showError('');

                try {
                    // Retrieve data from storage (as in original logic) or form (if modified)
                    const storageResult = await chrome.storage.local.get('ndeToMtlExtractedData');
                    const storedData = storageResult.ndeToMtlExtractedData;

                    const currentFormData = getCurrentFormData(); // Get current data from form

                    // Prefer form data if available, otherwise use stored data as base
                    // This logic for combining/prioritizing might need refinement based on exact needs
                    const dataForMTL = { ...storedData, ...currentFormData };

                    console.log("[popup.js] Normal mode: Data being sent to ia_telkom_filler.js:", JSON.stringify(dataForMTL, null, 2));

                    chrome.tabs.query({ url: "file:///*" }, (tabs) => {
                        const mtlTabs = tabs.filter(tab =>
                            tab.url && (tab.url.toLowerCase().includes("ia telkom.mhtml") || tab.url.toLowerCase().includes("ia%20telkom.mhtml"))
                        );

                        if (mtlTabs.length > 0) {
                            const targetTab = mtlTabs[0];
                            chrome.tabs.update(targetTab.id, { active: true }); // Focus the tab
                            chrome.tabs.sendMessage(targetTab.id, {
                                action: "fillMTLForm",
                                data: dataForMTL
                            }, (response) => {
                                showLoading(false, 'send'); // Stop loading indicator
                                if (chrome.runtime.lastError) {
                                    showError(`Could not connect to IA Telkom.mhtml. Error: ${chrome.runtime.lastError.message}`);
                                    console.error("Error sending to ia_telkom_filler.js:", chrome.runtime.lastError.message);
                                    if(sendText) sendText.textContent = 'Send Failed';
                                } else if (response && response.success) {
                                    showError('');
                                    if(sendText) sendText.textContent = 'Data Sent!';
                                    // setTimeout(() => window.close(), 2000); // Optional
                                } else {
                                    showError(response ? response.message : 'Failed: IA Telkom.mhtml reported an issue or user cancelled.');
                                    if(sendText) sendText.textContent = 'Send Failed';
                                }
                                if(sendIcon && originalIconClass) sendIcon.className = originalIconClass;
                                if(sendDataBtn) sendDataBtn.disabled = false; // Re-enable, or handle based on success
                                 if (response && response.success) {
                                     if(sendDataBtn) sendDataBtn.disabled = true; // Keep disabled on success
                                 } else {
                                     if(sendDataBtn) sendDataBtn.disabled = false; // Re-enable on failure
                                 }
                            });
                        } else {
                            showLoading(false, 'send');
                            showError('File \'IA Telkom.mhtml\' is not open. Please open it.');
                            if(sendIcon && originalIconClass) sendIcon.className = originalIconClass;
                            if(sendText) sendText.textContent = originalTextContent;
                            if(sendDataBtn) sendDataBtn.disabled = false;
                        }
                    });

                } catch (error) {
                    showLoading(false, 'send');
                    const sendIcon = sendDataBtn.querySelector('i');
                    const sendText = sendDataBtn.querySelector('span');
                    if(sendIcon) sendIcon.className = sendIcon ? sendIcon.className.replace('fa-spinner animate-spin', 'fa-paper-plane') : '';
                    if(sendText) sendText.textContent = 'Send to MTL';
                    if(sendDataBtn) sendDataBtn.disabled = false;
                    showError('Failed to send data: ' + error.message);
                    console.error('Send error:', error);
                }
            });
        }
    } // End of Normal Popup Mode Logic

    // Initial state
    if (!isIframeMode) {
        statusError.style.display = 'none';
        dataDisplayDiv.style.display = 'none'; // Hide form initially in normal mode
        if (sendDataBtn) sendDataBtn.disabled = true;
    } else {
        // In iframe mode, the form is shown by populateFormFields after data is loaded
        dataDisplayDiv.style.display = 'none'; // Hide initially until data is loaded
    }
});
