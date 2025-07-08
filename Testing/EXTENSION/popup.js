document.addEventListener('DOMContentLoaded', () => {
    // --- Tab Switching Logic ---
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
    // const dataDisplayDiv = document.getElementById('data-display'); // This ID is no longer used for main form
    const statusError = document.getElementById('status-error');
    const mainContentArea = document.querySelector('.flex-1.p-4'); // The main area holding tabs

    // Input fields (ensure these IDs match your new HTML structure if they changed)
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
            return;
        }
        // mainContentArea.style.display = 'none'; // Don't hide the whole form area
        statusError.style.display = ''; // This should be a block or flex depending on CSS
        if (errorTextEl) errorTextEl.textContent = message;
        sendDataBtn.disabled = true; // Disable send if there's an error
    };

    // This function is effectively replaced by directly enabling the button after data load.
    // const showForm = () => {
    //     statusError.style.display = 'none';
    //     // mainContentArea.style.display = ''; // Form is always visible
    //     sendDataBtn.disabled = false;
    // };

    const showLoading = (isLoading, buttonType = 'extract') => {
        let btn, icon, textSpan;

        if (buttonType === 'extract') {
            btn = getDataBtn;
            icon = btn.querySelector('i');
            textSpan = btn.querySelector('span');
            if (isLoading) {
                icon.className = 'fas fa-spinner animate-spin text-xs mr-1';
                textSpan.textContent = 'Extracting...';
                btn.disabled = true;
            } else {
                icon.className = 'fas fa-download text-xs mr-1';
                textSpan.textContent = 'Extract Data';
                btn.disabled = false;
            }
        } else if (buttonType === 'send') {
            btn = sendDataBtn;
            icon = btn.querySelector('i');
            textSpan = btn.querySelector('span');
            const originalIconClass = 'fas fa-paper-plane text-xs mr-1'; // Store original
            if (isLoading) {
                icon.className = 'fas fa-spinner animate-spin text-xs mr-1';
                textSpan.textContent = 'Sending...';
                btn.disabled = true;
            } else {
                // This state (isLoading=false for send) will be set by the sendData logic itself
                // For now, just ensure it can be reset if needed.
                // icon.className = originalIconClass;
                // textSpan.textContent = 'Send to MTL';
                // btn.disabled = false; // Or based on isDataExtracted
            }
        }
    };

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
        showLoading(false, 'extract');
        if (chrome.runtime.lastError) {
            showError('Failed to connect to page. Ensure "Allow access to file URLs" is enabled and refresh NDE page.');
            console.error("[popup.js] sendMessage lastError:", chrome.runtime.lastError.message);
            return;
        }

        if (response && response.success && response.data) {
            console.log("[popup.js] Data received from content.js:", response.data);
            await chrome.storage.local.set({ ndeToMtlExtractedData: response.data });

            const d = response.data;
            const safeSet = (value) => (value && value !== "Data belum ditemukan" ? value : "");

            if (nomorNotaInput) nomorNotaInput.value = safeSet(d.nomorNdSvpIa);
            if (perihalInput) perihalInput.value = safeSet(d.deskripsiNdSvpIa);
            if (pengirimInput) pengirimInput.value = safeSet(d.pengirim);
            if (idLampiranInput) idLampiranInput.value = safeSet(d.idLampiran);

            if (noSpkInput) noSpkInput.value = safeSet(d.noSPK);
            if (tanggalNdSvpIaInput) tanggalNdSvpIaInput.value = formatDateForInput(safeSet(d.tanggalNdSvpIa));
            if (temuanNdSvpIaInput) temuanNdSvpIaInput.value = safeSet(d.temuanNdSvpIa);
            if (rekomendasiNdSvpIaInput) rekomendasiNdSvpIaInput.value = highlightRekomendasi(safeSet(d.rekomendasiNdSvpIa));

            if (kelompokInput) kelompokInput.value = safeSet(d.kelompok);
            if (codeInput) codeInput.value = safeSet(d.code);
            if (masaPenyelesaianInput) masaPenyelesaianInput.value = safeSet(d.masaPenyelesaianPekerjaan);
            if (matriksProgramInput) matriksProgramInput.value = safeSet(d.matriksProgram);
            if (tanggalMatriksInput) tanggalMatriksInput.value = formatDateForInput(safeSet(d.tanggalMatriks));

            if (ndDirutNomorInput) ndDirutNomorInput.value = safeSet(d.nomorNdDirut);
            if (ndDirutTanggalInput) ndDirutTanggalInput.value = formatDateForInput(safeSet(d.tanggalNdDirut));
            if (ndDirutDeskripsiInput) ndDirutDeskripsiInput.value = safeSet(d.deskripsiNdDirut);
            if (ndDirutTemuanInput) ndDirutTemuanInput.value = safeSet(d.temuanNdDirut);
            if (ndDirutRekomendasiInput) ndDirutRekomendasiInput.value = safeSet(d.rekomendasiNdDirut);
            if (ndDirutDuedate1Input) ndDirutDuedate1Input.value = formatDateForInput(safeSet(d.duedateNdDirut));
            if (ndDirutDuedate2Input) ndDirutDuedate2Input.value = "";
            if (ndDirutPicInput) ndDirutPicInput.value = safeSet(d.picNdDirut);
            if (ndDirutUicInput) ndDirutUicInput.value = safeSet(d.uicNdDirut);

            if (mtlClosedInput) mtlClosedInput.value = (d.mtlClosed !== undefined && d.mtlClosed !== "Data belum ditemukan") ? Number(d.mtlClosed) : "";
            if (rescheduleInput) rescheduleInput.value = (d.reschedule !== undefined && d.reschedule !== "Data belum ditemukan") ? Number(d.reschedule) : "";
            if (overdueInput) overdueInput.value = (d.overdue !== undefined && d.overdue !== "Data belum ditemukan") ? Number(d.overdue) : "";
            if (onscheduleInput) onscheduleInput.value = (d.onSchedule !== undefined && d.onSchedule !== "Data belum ditemukan") ? Number(d.onSchedule) : "";
            if (statusInput) statusInput.value = safeSet(d.status);

            showError(''); // Clear any previous errors
            sendDataBtn.disabled = false; // Enable send button
            // Switch to basic tab or the most relevant tab after data load might be good UX
            // For now, it stays on the current tab.
            // Example: switchTab('basic');

        } else if (response && !response.success) {
            showError(response.message || 'Content script reported an issue.');
        } else {
            showError('No response or invalid data from page. Refresh NDE page and extension.');
        }
    };

    if (getDataBtn) {
        getDataBtn.addEventListener('click', async () => {
            showLoading(true, 'extract');
            try {
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
            const originalIconClass = sendIcon.className; // Store to reset
            const originalTextContent = sendText.textContent; // Store to reset

            showLoading(true, 'send'); // Handles icon, text, disabled state
            showError('');

            try {
                const result = await chrome.storage.local.get('ndeToMtlExtractedData');
                const extractedDataFromContent = result.ndeToMtlExtractedData;

                // Note: Even if extractedDataFromContent is null, we might still want to send manually entered data.
                // The original code had a check, but let's assume the filler script can handle partial data.
                // if (!extractedDataFromContent) {
                //     showError('No base extracted NDE data found. Please extract data first if you need it.');
                //     // Or, allow sending purely manual data. For now, let's proceed.
                // }

                const fallback = (value, fallbackValue = '') => (value !== undefined && value !== null ? value : fallbackValue);
                const content = extractedDataFromContent || {}; // Use empty object if no stored data

                const dataForMTL = {
                    kelompok:           kelompokInput.value         || fallback(content.kelompok, 'Information Technology Audit'),
                    no_spk:             noSpkInput.value            || fallback(content.noSPK),
                    CODE:               codeInput.value             || fallback(content.code),
                    masaPenyelesaianPekerjaan: masaPenyelesaianInput.value || fallback(content.masaPenyelesaianPekerjaan),
                    Matriks_Program:    matriksProgramInput.value   || fallback(content.matriksProgram),
                    Matriks_Tgl:        tanggalMatriksInput.value   || formatDateForInput(fallback(content.tanggalMatriks)),

                    ND_SVP_IA_Nomor:    nomorNotaInput.value        || fallback(content.nomorNdSvpIa),
                    Desc_ND_SVP_IA:     perihalInput.value          || fallback(content.deskripsiNdSvpIa),
                    ND_SVP_IA_Tanggal:  tanggalNdSvpIaInput.value   || formatDateForInput(fallback(content.tanggalNdSvpIa)),
                    ND_SVP_IA_Temuan:   temuanNdSvpIaInput.value    || fallback(content.temuanNdSvpIa),
                    ND_SVP_IA_Rekomendasi: rekomendasiNdSvpIaInput.value || fallback(content.rekomendasiNdSvpIa),

                    ND_Dirut_Nomor:     ndDirutNomorInput.value     || fallback(content.nomorNdDirut),
                    Desc_ND_Dirut:      ndDirutDeskripsiInput.value || fallback(content.deskripsiNdDirut),
                    ND_Dirut_Tgl:       ndDirutTanggalInput.value   || formatDateForInput(fallback(content.tanggalNdDirut)),
                    ND_Dirut_Temuan:    ndDirutTemuanInput.value    || fallback(content.temuanNdDirut),
                    ND_Dirut_Rekomendasi: ndDirutRekomendasiInput.value || fallback(content.rekomendasiNdDirut),
                    ND_Dirut_Duedate1:  ndDirutDuedate1Input.value  || formatDateForInput(fallback(content.duedateNdDirut)),
                    ND_Dirut_Duedate2:  ndDirutDuedate2Input.value  || '',
                    ND_Dirut_PIC:       ndDirutPicInput.value       || fallback(content.picNdDirut),
                    ND_Dirut_UIC:       ndDirutUicInput.value       || fallback(content.uicNdDirut),

                    MTL_Closed:         mtlClosedInput.value !== ""      ? Number(mtlClosedInput.value)   : (fallback(content.mtlClosed) !== '' ? Number(fallback(content.mtlClosed)) : 0),
                    Reschedule:         rescheduleInput.value !== ""     ? Number(rescheduleInput.value)  : (fallback(content.reschedule) !== '' ? Number(fallback(content.reschedule)) : 0),
                    Overdue:            overdueInput.value !== ""        ? Number(overdueInput.value)     : (fallback(content.overdue) !== '' ? Number(fallback(content.overdue)) : 0),
                    OnSchedule:         onscheduleInput.value !== ""     ? Number(onscheduleInput.value)  : (fallback(content.onSchedule, 1) !== '' ? Number(fallback(content.onSchedule, 1)) : 1), // Default 1
                    Status:             statusInput.value           || fallback(content.status, 'OnSchedule'), // Default

                    idLampiran: idLampiranInput.value || fallback(content.idLampiran),
                    pengirim: pengirimInput.value || fallback(content.pengirim),
                };

                console.log("[popup.js] Data being sent to ia_telkom_filler.js:", JSON.stringify(dataForMTL, null, 2));

                chrome.tabs.query({ url: "file:///*" }, (tabs) => {
                    const mtlTabs = tabs.filter(tab =>
                        tab.url && (tab.url.toLowerCase().includes("ia telkom.mhtml") || tab.url.toLowerCase().includes("ia%20telkom.mhtml"))
                    );

                    if (mtlTabs.length > 0) {
                        const targetTab = mtlTabs[0];
                        chrome.tabs.update(targetTab.id, { active: true });
                        chrome.tabs.sendMessage(targetTab.id, {
                            action: "fillMTLForm",
                            data: dataForMTL
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                showError(`Could not connect to IA Telkom.mhtml. Error: ${chrome.runtime.lastError.message}`);
                                console.error("Error sending to ia_telkom_filler.js:", chrome.runtime.lastError.message);
                                sendText.textContent = 'Send Failed'; // Update text
                            } else if (response && response.success) {
                                showError('');
                                sendText.textContent = 'Data Sent!';
                                // setTimeout(() => window.close(), 2000); // Optional: close popup
                            } else {
                                showError(response ? response.message : 'Failed: IA Telkom.mhtml confirmation error.');
                                sendText.textContent = 'Send Failed';
                            }
                            // Reset button visuals but not necessarily re-enable if it's a final state like "Data Sent!"
                            sendIcon.className = originalIconClass;
                            // sendDataBtn.disabled = false; // Only re-enable if it's not a final success/close
                        });
                    } else {
                        showError('File \'C:\\\\Users\\\\khair\\\\Downloads\\\\IA Telkom.mhtml\' is not open. Please open it.');
                        sendIcon.className = originalIconClass;
                        sendText.textContent = originalTextContent;
                        sendDataBtn.disabled = false; // Re-enable since action couldn't be performed
                    }
                });

            } catch (error) {
                sendIcon.className = originalIconClass;
                sendText.textContent = originalTextContent;
                sendDataBtn.disabled = false;
                showError('Failed to send data: ' + error.message);
                console.error('Send error:', error);
            }
        });
    }

    // Initial state for UI elements that are not tabs
    statusError.style.display = 'none'; // Error message hidden by default
    if (sendDataBtn) sendDataBtn.disabled = true; // Send button disabled until data is extracted

});
