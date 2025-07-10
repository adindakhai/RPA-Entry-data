document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements in the popup
    const getDataBtn = document.getElementById('get-data-btn');
    const sendDataBtn = document.getElementById('send-data-btn');
    const dataDisplayDiv = document.getElementById('data-display');
    const statusError = document.getElementById('status-error');

    // Input fields in the popup (only those in the new list)
    const noSpkInput = document.getElementById('popup-no-spk');
    const kelompokInput = document.getElementById('popup-kelompok');
    const codeInput = document.getElementById('popup-code');
    const masaPenyelesaianInput = document.getElementById('popup-masa-penyelesaian');
    const matriksProgramInput = document.getElementById('popup-matriks-program');
    const tanggalMatriksInput = document.getElementById('popup-tanggal-matriks');
    const nomorNdSvpIaInput = document.getElementById('popup-nd-svp-ia-nomor');
    const deskripsiNdSvpIaInput = document.getElementById('popup-nd-svp-ia-deskripsi');
    const tanggalNdSvpIaInput = document.getElementById('popup-nd-svp-ia-tanggal');
    const temuanNdSvpIaInput = document.getElementById('popup-nd-svp-ia-temuan');
    const rekomendasiNdSvpIaInput = document.getElementById('popup-nd-svp-ia-rekomendasi');
    const nomorNdDirutInput = document.getElementById('popup-nd-dirut-nomor');
    const deskripsiNdDirutInput = document.getElementById('popup-nd-dirut-deskripsi');
    const tanggalNdDirutInput = document.getElementById('popup-nd-dirut-tanggal');
    const temuanNdDirutInput = document.getElementById('popup-nd-dirut-temuan');
    const rekomendasiNdDirutInput = document.getElementById('popup-nd-dirut-rekomendasi');
    const duedateNdDirutInput = document.getElementById('popup-nd-dirut-duedate');
    const picNdDirutInput = document.getElementById('popup-nd-dirut-pic');
    const uicNdDirutInput = document.getElementById('popup-nd-dirut-uic');
    const mtlClosedInput = document.getElementById('popup-mtl-closed');
    const rescheduleInput = document.getElementById('popup-reschedule');
    const overdueInput = document.getElementById('popup-overdue');
    const onscheduleInput = document.getElementById('popup-onschedule');
    const statusInput = document.getElementById('popup-status');

    // Date formatting helper for YYYY-MM-DD
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
        return '';
    }

    // Show only error, hide form
    const showError = (message) => {
        if (!message || message.trim() === "") {
            statusError.style.display = 'none';
            dataDisplayDiv.style.display = 'none';
            return;
        }
        dataDisplayDiv.style.display = 'none';
        statusError.style.display = '';
        const errorText = statusError.querySelector('p:last-child');
        errorText.textContent = message;
    };

    // Show only form, hide error
    const showForm = () => {
        statusError.style.display = 'none';
        dataDisplayDiv.style.display = '';
        sendDataBtn.disabled = false;
    };

    const showLoading = (isLoading) => {
        const icon = getDataBtn.querySelector('i');
        const text = getDataBtn.querySelector('span');
        if (isLoading) {
            icon.className = 'fas fa-spinner animate-spin text-sm';
            text.textContent = 'Extracting...';
            getDataBtn.disabled = true;
        } else {
            icon.className = 'fas fa-download text-sm';
            text.textContent = 'Extract Data';
            getDataBtn.disabled = false;
        }
    };

    getDataBtn.addEventListener('click', async () => {
        showLoading(true);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const allowed = (
                tab.url.includes('nde_mockup.html') ||
                tab.url.toLowerCase().endsWith('.mhtml') ||
                tab.url.toLowerCase().includes('notadinas')
            );
            if (!allowed) {
                showLoading(false);
                showError('Please open a supported NDE or Notadinas file!');
                return;
            }
            chrome.tabs.sendMessage(tab.id, { action: "getDataFromNDE" }, (response) => {
                showLoading(false);
                if (chrome.runtime.lastError) {
                    showError('Failed to connect to page. Please ensure "Allow access to file URLs" is enabled for this extension and refresh the NDE page.');
                    return;
                }
                if (response && response.success && response.data) {
                    const data = response.data;
                    // Helper to safely set value or empty string if data is "Data belum ditemukan" or undefined
                    const safeSet = (value) => (value && value !== "Data belum ditemukan" ? value : "");
                    if (noSpkInput) noSpkInput.value = safeSet(data.noSPK);
                    if (kelompokInput) kelompokInput.value = safeSet(data.kelompok);
                    if (codeInput) codeInput.value = safeSet(data.code);
                    if (masaPenyelesaianInput) masaPenyelesaianInput.value = safeSet(data.masaPenyelesaianPekerjaan);
                    if (matriksProgramInput) matriksProgramInput.value = safeSet(data.matriksProgram);
                    if (tanggalMatriksInput) tanggalMatriksInput.value = formatDateForInput(safeSet(data.tanggalMatriks));
                    if (nomorNdSvpIaInput) nomorNdSvpIaInput.value = safeSet(data.nomorNdSvpIa);
                    if (deskripsiNdSvpIaInput) {
                        deskripsiNdSvpIaInput.value = safeSet(data.deskripsiNdSvpIa);
                        autoResizeTextarea(deskripsiNdSvpIaInput);
                    }
                    if (tanggalNdSvpIaInput) tanggalNdSvpIaInput.value = formatDateForInput(safeSet(data.tanggalNdSvpIa));
                    if (temuanNdSvpIaInput) {
                        temuanNdSvpIaInput.value = safeSet(data.temuanNdSvpIa);
                        autoResizeTextarea(temuanNdSvpIaInput);
                    }
                    if (rekomendasiNdSvpIaInput) {
                        rekomendasiNdSvpIaInput.value = safeSet(data.rekomendasiNdSvpIa);
                        autoResizeTextarea(rekomendasiNdSvpIaInput);
                    }
                    if (nomorNdDirutInput) nomorNdDirutInput.value = safeSet(data.nomorNdDirut);
                    if (deskripsiNdDirutInput) {
                        deskripsiNdDirutInput.value = safeSet(data.deskripsiNdDirut);
                        autoResizeTextarea(deskripsiNdDirutInput);
                    }
                    if (tanggalNdDirutInput) tanggalNdDirutInput.value = formatDateForInput(safeSet(data.tanggalNdDirut));
                    if (temuanNdDirutInput) {
                        temuanNdDirutInput.value = safeSet(data.temuanNdDirut);
                        autoResizeTextarea(temuanNdDirutInput);
                    }
                    if (rekomendasiNdDirutInput) {
                        rekomendasiNdDirutInput.value = safeSet(data.rekomendasiNdDirut);
                        autoResizeTextarea(rekomendasiNdDirutInput);
                    }
                    if (duedateNdDirutInput) duedateNdDirutInput.value = formatDateForInput(safeSet(data.duedateNdDirut));
                    if (picNdDirutInput) picNdDirutInput.value = safeSet(data.picNdDirut);
                    if (uicNdDirutInput) uicNdDirutInput.value = safeSet(data.uicNdDirut);
                    if (mtlClosedInput) mtlClosedInput.value = (data.mtlClosed !== undefined && data.mtlClosed !== "Data belum ditemukan") ? Number(data.mtlClosed) : "";
                    if (rescheduleInput) rescheduleInput.value = (data.reschedule !== undefined && data.reschedule !== "Data belum ditemukan") ? Number(data.reschedule) : "";
                    if (overdueInput) overdueInput.value = (data.overdue !== undefined && data.overdue !== "Data belum ditemukan") ? Number(data.overdue) : "";
                    if (onscheduleInput) onscheduleInput.value = (data.onSchedule !== undefined && data.onSchedule !== "Data belum ditemukan") ? Number(data.onSchedule) : "";
                    if (statusInput) statusInput.value = safeSet(data.status);
                    showForm();
                } else if (response && !response.success) {
                    showError(response.message || 'Failed to extract data from page. Content script reported an issue.');
                } else {
                    showError('No response or invalid data from page. Please try refreshing the NDE page and the extension.');
                }
            });
        } catch (error) {
            showLoading(false);
            showError('An unexpected error occurred. Please try again.');
        }
    });

    sendDataBtn.addEventListener('click', async () => {
        const sendIcon = sendDataBtn.querySelector('i');
        const sendText = sendDataBtn.querySelector('span');
        const originalIcon = sendIcon.className;
        const originalText = sendText.textContent;

        sendIcon.className = 'fas fa-spinner animate-spin text-sm';
        sendText.textContent = 'Sending...';
        sendDataBtn.disabled = true;
        showError('');

        try {
            // Helper function to parse list-like values from popup textareas
            function parsePopupListValue(inputValue) {
                if (!inputValue || typeof inputValue !== 'string' || inputValue.trim().toLowerCase() === "data belum ditemukan" || inputValue.trim() === "") {
                    return ["Data belum ditemukan"];
                }
                // Attempt to split by newline first, assuming user might edit with newlines
                let items = inputValue.split('\n').map(line => line.trim()).filter(line => line);
                if (items.length > 0 && (items.length > 1 || items[0] !== inputValue.trim())) { // Check if split by newline was effective
                    return items;
                }
                // If not effectively split by newline (e.g., single line of comma-separated values), split by comma
                items = inputValue.split(',').map(item => item.trim()).filter(item => item);
                if (items.length > 0) {
                    return items;
                }
                // If input is a non-empty string but not parsed into multiple items, return as single item array
                return [inputValue.trim()];
            }

            // Prepare data for MTL, using only the new field list
            const dataForMTL = {
                no_spk: noSpkInput.value || '',
                kelompok: kelompokInput.value || '',
                CODE: codeInput.value || '',
                masaPenyelesaianPekerjaan: masaPenyelesaianInput.value || '',
                Matriks_Program: matriksProgramInput.value || '',
                Matriks_Tgl: tanggalMatriksInput.value || '',
                ND_SVP_IA_Nomor: nomorNdSvpIaInput.value || '',
                Desc_ND_SVP_IA: deskripsiNdSvpIaInput.value || '',
                ND_SVP_IA_Tanggal: tanggalNdSvpIaInput.value || '',
                ND_SVP_IA_Temuan: parsePopupListValue(temuanNdSvpIaInput.value),
                ND_SVP_IA_Rekomendasi: parsePopupListValue(rekomendasiNdSvpIaInput.value),
                ND_Dirut_Nomor: nomorNdDirutInput.value || '',
                Desc_ND_Dirut: deskripsiNdDirutInput.value || '',
                ND_Dirut_Tgl: tanggalNdDirutInput.value || '',
                ND_Dirut_Temuan: parsePopupListValue(temuanNdDirutInput.value),
                ND_Dirut_Rekomendasi: parsePopupListValue(rekomendasiNdDirutInput.value),
                ND_Dirut_Duedate1: duedateNdDirutInput.value || '',
                ND_Dirut_Duedate2: '', // Only one due date field in popup, so leave this empty
                ND_Dirut_PIC: picNdDirutInput.value || '',
                ND_Dirut_UIC: uicNdDirutInput.value || '',
                MTL_Closed: mtlClosedInput.value !== '' ? Number(mtlClosedInput.value) : 0,
                Reschedule: rescheduleInput.value !== '' ? Number(rescheduleInput.value) : 0,
                Overdue: overdueInput.value !== '' ? Number(overdueInput.value) : 0,
                OnSchedule: onscheduleInput.value !== '' ? Number(onscheduleInput.value) : 1,
                Status: statusInput.value || '',
            };
            // Remove masaPenyelesaianPekerjaan if it's empty and we don't want to send it
            // However, the original code sent it, so keeping it for now.
            // if (!dataForMTL.masaPenyelesaianPekerjaan) delete dataForMTL.masaPenyelesaianPekerjaan;

            // ############# JULES: ADDED DETAILED LOG #############
            console.log("[popup.js] --- BEGINNING OF DATA FOR MTL ---");
            console.log("[popup.js] Data being sent to ia_telkom_filler.js:", JSON.stringify(dataForMTL, null, 2));
            console.log("[popup.js] --- END OF DATA FOR MTL ---");
            // ############# JULES: END OF ADDED LOG #############

            console.log("[popup.js] Prepared dataForMTL:", dataForMTL);

            // Query for IA Telkom.mhtml tab
            chrome.tabs.query({ url: "file:///*" }, (tabs) => {
                const mtlTabs = tabs.filter(tab => {
                    if (tab.url) {
                        const lowerUrl = tab.url.toLowerCase();
                        return lowerUrl.includes("ia telkom.mhtml") || lowerUrl.includes("ia%20telkom.mhtml");
                    }
                    return false;
                });
                if (mtlTabs.length > 0) {
                    const targetTab = mtlTabs[0];
                    chrome.tabs.update(targetTab.id, { active: true });
                    chrome.tabs.sendMessage(targetTab.id, {
                        action: "fillMTLForm",
                        data: dataForMTL
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            showError(`Could not connect to IA Telkom.mhtml. Ensure it's open and the extension has file access. Error: ${chrome.runtime.lastError.message}`);
                        } else if (response && response.success) {
                            showError('');
                            sendText.textContent = 'Data Sent!';
                        } else {
                            showError(response ? response.message : 'Failed to get confirmation from IA Telkom.mhtml.');
                        }
                        sendIcon.className = originalIcon;
                    });
                } else {
                    showError('File \'C:\\Users\\khair\\Downloads\\IA Telkom.mhtml\' is not open. Please open this file in a Chrome tab and try again.');
                    sendIcon.className = originalIcon;
                    sendText.textContent = originalText;
                    sendDataBtn.disabled = false;
                }
            });
        } catch (error) {
            sendIcon.className = originalIcon;
            sendText.textContent = originalText;
            sendDataBtn.disabled = false;
            showError('Failed to send data. Please try again. Error: ' + error.message);
        }
    });

    // On load, show only the Extract Data button (form and error hidden)
    dataDisplayDiv.style.display = 'none';
    statusError.style.display = 'none';

    // Function to auto-resize textarea
    function autoResizeTextarea(element) {
        if (element && typeof element.style !== 'undefined') {
            element.style.height = 'auto'; // Temporarily shrink to get the correct scrollHeight
            element.style.height = (element.scrollHeight) + 'px';
        }
    }

    // Get all textareas that need auto-resizing
    const textareasToResize = document.querySelectorAll('.auto-resize-textarea');

    // Add event listeners for input and call initial resize
    textareasToResize.forEach(textarea => {
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
        // Initial resize will be handled when data is populated by getDataBtn
        // or if there's any pre-filled content (though not typical for this popup)
        autoResizeTextarea(textarea); // Call once in case of pre-filled or cached values
    });

    // Modify the getDataBtn event listener to resize textareas after populating them
    // (This requires finding the part of the code where values are set)
    // The existing getDataBtn listener already handles populating. We need to ensure resize happens after.
    // The `safeSet` function is used. We'll add resizing after values are set.

    // Re-hooking the getDataBtn to ensure changes are applied correctly
    // This is a bit tricky as the original listener is already set up.
    // For simplicity in this environment, I'll focus on adding the calls
    // within the existing structure if possible, or clearly denote where they should go.

    // The calls to autoResizeTextarea will be added inside the chrome.tabs.sendMessage callback
    // after the `safeSet` calls for each relevant textarea.
});
