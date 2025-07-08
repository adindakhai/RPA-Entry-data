document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements in the popup
    const getDataBtn = document.getElementById('get-data-btn');
    const sendDataBtn = document.getElementById('send-data-btn');
    const dataDisplayDiv = document.getElementById('data-display');
    const statusError = document.getElementById('status-error');

    // Input fields in the popup
    const nomorNotaInput = document.getElementById('popup-nomor-nota');
    const perihalInput = document.getElementById('popup-perihal');
    const pengirimInput = document.getElementById('popup-pengirim');
    const idLampiranInput = document.getElementById('popup-id-lampiran');
    const noSpkInput = document.getElementById('popup-no-spk');
    const tanggalNdSvpIaInput = document.getElementById('popup-tanggal-nd-svp-ia');
    const temuanNdSvpIaInput = document.getElementById('popup-temuan-nd-svp-ia');
    const rekomendasiNdSvpIaInput = document.getElementById('popup-rekomendasi-nd-svp-ia');

    // New MTL General Fields
    const kelompokInput = document.getElementById('popup-kelompok');
    const codeInput = document.getElementById('popup-code');
    const masaPenyelesaianInput = document.getElementById('popup-masa-penyelesaian');
    const matriksProgramInput = document.getElementById('popup-matriks-program');
    const tanggalMatriksInput = document.getElementById('popup-tanggal-matriks');

    // New ND Dirut Fields
    const ndDirutNomorInput = document.getElementById('popup-nd-dirut-nomor');
    const ndDirutTanggalInput = document.getElementById('popup-nd-dirut-tanggal');
    const ndDirutDeskripsiInput = document.getElementById('popup-nd-dirut-deskripsi');
    const ndDirutTemuanInput = document.getElementById('popup-nd-dirut-temuan');
    const ndDirutRekomendasiInput = document.getElementById('popup-nd-dirut-rekomendasi');
    const ndDirutDuedate1Input = document.getElementById('popup-nd-dirut-duedate1');
    const ndDirutDuedate2Input = document.getElementById('popup-nd-dirut-duedate2');
    const ndDirutPicInput = document.getElementById('popup-nd-dirut-pic');
    const ndDirutUicInput = document.getElementById('popup-nd-dirut-uic');

    // New MTL Status Fields
    const mtlClosedInput = document.getElementById('popup-mtl-closed');
    const rescheduleInput = document.getElementById('popup-reschedule');
    const overdueInput = document.getElementById('popup-overdue');
    const onscheduleInput = document.getElementById('popup-onschedule');
    const statusInput = document.getElementById('popup-status');


    // Date formatting helper for YYYY-MM-DD
    function formatDateForInput(dateStr) {
        if (!dateStr || dateStr === "Data belum ditemukan") return '';
        // Try to parse common Indonesian format "DD MMMM YYYY"
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
        // If it's already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // Add more parsing logic if other formats are expected from content.js
        console.warn(`[popup.js] Could not parse date: ${dateStr} into YYYY-MM-DD. Returning empty.`);
        return ''; // Return empty if format is not recognized or invalid
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

    function highlightRekomendasi(rekomendasi) {
        if (!rekomendasi) return '';
        const lines = rekomendasi.split(/\r?\n/).filter(Boolean);
        const highlights = lines.map(line => {
            const match = line.match(/^(.*?[\.,]|(?:\S+\s+){1,10})/);
            return match ? match[0].trim() : line.trim();
        });
        return highlights.join('\n');
    }

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
        console.error("[popup.js] sendMessage lastError:", chrome.runtime.lastError.message);
        return;
    }

    // Periksa apakah respons ada dan sukses
    if (response && response.success && response.data) {
        console.log("[popup.js] Data diterima dari content.js:", response.data);

        // Destrukturisasi dengan nama field yang benar dari content.js
        const {
            noSPK,
            masaPenyelesaianPekerjaan,
            nomorNdSvpIa,
            deskripsiNdSvpIa,
            tanggalNdSvpIa,
            temuanNdSvpIa,
            rekomendasiNdSvpIa
            // pengirim, // Uncomment jika 'pengirim' sudah diekstrak di content.js
            // Anda bisa tambahkan field lain di sini jika sudah ada di response.data
        } = response.data;

        // Mengisi input fields di popup
        // Pastikan variabel input (nomorNotaInput, dll.) sudah dideklarasikan di scope atas
        // dan ID elemennya cocok dengan yang ada di popup.html

        if (nomorNotaInput) nomorNotaInput.value = (nomorNdSvpIa && nomorNdSvpIa !== "Data belum ditemukan") ? nomorNdSvpIa : "";
        if (perihalInput) perihalInput.value = (deskripsiNdSvpIa && deskripsiNdSvpIa !== "Data belum ditemukan") ? deskripsiNdSvpIa : "";
        
        // Contoh untuk pengirim (jika sudah ada variabel pengirimInput dan field pengirim di response.data)
        // if (pengirimInput && pengirim && pengirim !== "Data belum ditemukan") pengirimInput.value = pengirim;
        // else if (pengirimInput) pengirimInput.value = "";

        // Untuk idLampiran, kita belum mengekstraknya secara spesifik di content.js
        // if (idLampiranInput) idLampiranInput.value = ""; // Kosongkan dulu atau isi default

        if (noSpkInput) noSpkInput.value = (noSPK && noSPK !== "Data belum ditemukan") ? noSPK : "";
        if (tanggalNdSvpIaInput) tanggalNdSvpIaInput.value = (tanggalNdSvpIa && tanggalNdSvpIa !== "Data belum ditemukan") ? tanggalNdSvpIa : "";
        if (temuanNdSvpIaInput) temuanNdSvpIaInput.value = (temuanNdSvpIa && temuanNdSvpIa !== "Data belum ditemukan") ? temuanNdSvpIa : "";
        
        if (rekomendasiNdSvpIaInput) {
            const recText = (rekomendasiNdSvpIa && rekomendasiNdSvpIa !== "Data belum ditemukan") ? rekomendasiNdSvpIa : "";
            rekomendasiNdSvpIaInput.value = highlightRekomendasi(recText);
        }

        // Jika Anda punya input untuk masaPenyelesaianPekerjaan:
        // const elMasaPenyelesaian = document.getElementById('popup-masa-penyelesaian'); // Ganti ID jika perlu
        // if (elMasaPenyelesaian) elMasaPenyelesaian.value = (masaPenyelesaianPekerjaan && masaPenyelesaianPekerjaan !== "Data belum ditemukan") ? masaPenyelesaianPekerjaan : "";

        // Cek apakah ada data signifikan yang terisi untuk menampilkan form
        const hasSignificantData = (nomorNdSvpIa && nomorNdSvpIa !== "Data belum ditemukan") || 
                                   (deskripsiNdSvpIa && deskripsiNdSvpIa !== "Data belum ditemukan");

        if (hasSignificantData) {
            showForm();
        } else {
            // Jika tidak ada data signifikan, tetap tampilkan form agar bisa diisi manual
            // Semua field akan berisi string kosong jika nilainya "Data belum ditemukan"
            showForm(); 
            // Pertimbangkan untuk memberi notifikasi jika semua field kosong:
            // console.log("[popup.js] Tidak ada data signifikan yang diekstrak, form ditampilkan kosong.");
        }

    } else if (response && !response.success) {
        // Jika content.js mengirim success: false beserta pesan error
        showError(response.message || 'Failed to extract data from page. Content script reported an issue.');
        console.warn('[popup.js] Pesan error dari content.js:', response.message);
    } else {
        // Jika tidak ada respons sama sekali atau formatnya salah
        showError('No response or invalid data from page. Please try refreshing the NDE page and the extension.');
        console.warn('[popup.js] Respons tidak valid atau tidak ada:', response);
    }
});
        } catch (error) {
            showLoading(false);
            showError('An unexpected error occurred. Please try again.');
            console.error('Error:', error);
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
        showError(''); // Clear previous errors

        try {
            // Retrieve fully extracted data from content script, stored temporarily in local storage
            // This ensures we use the most complete data set from content.js
            const result = await chrome.storage.local.get('ndeToMtlExtractedData');
            const extractedDataFromContent = result.ndeToMtlExtractedData;

            if (!extractedDataFromContent) {
                showError('No extracted NDE data found. Please extract data first.');
                sendIcon.className = originalIcon;
                sendText.textContent = originalText;
                sendDataBtn.disabled = false;
                return;
            }

            // Prepare data for MTL, combining popup values (user edits) with content script extractions
            // Prepare data for MTL, combining popup values (user edits) with content script extractions
            // Prioritize popup input value, then fallback to extractedDataFromContent, then to empty/default.
            const dataForMTL = {
                // User Table Field | `dataForMTL` Key         | Source from Popup (Primary) or Extracted (Fallback)
                //------------------|--------------------------|--------------------------------------------------------------
                kelompok:           kelompokInput.value         || extractedDataFromContent.kelompok || 'Information Technology Audit',
                no_spk:             noSpkInput.value            || extractedDataFromContent.noSPK || '',
                CODE:               codeInput.value             || extractedDataFromContent.code || '',
                // Masa Penyelesaian Pekerjaan - MTL field is disabled, but we send the data if available
                masaPenyelesaianPekerjaan: masaPenyelesaianInput.value || extractedDataFromContent.masaPenyelesaianPekerjaan || '',
                Matriks_Program:    matriksProgramInput.value   || extractedDataFromContent.matriksProgram || '',
                Matriks_Tgl:        tanggalMatriksInput.value   || formatDateForInput(extractedDataFromContent.tanggalMatriks) || '', // Ensure YYYY-MM-DD

                ND_SVP_IA_Nomor:    nomorNotaInput.value        || extractedDataFromContent.nomorNdSvpIa || '',
                Desc_ND_SVP_IA:     perihalInput.value          || extractedDataFromContent.deskripsiNdSvpIa || '',
                ND_SVP_IA_Tanggal:  tanggalNdSvpIaInput.value   || formatDateForInput(extractedDataFromContent.tanggalNdSvpIa) || '', // Ensure YYYY-MM-DD
                ND_SVP_IA_Temuan:   temuanNdSvpIaInput.value    || extractedDataFromContent.temuanNdSvpIa || '',
                // Assuming 'rekomendasiNdSvpIaInput' is the correct popup field for "Rekomendasi ND SVP IA"
                ND_SVP_IA_Rekomendasi: rekomendasiNdSvpIaInput.value || extractedDataFromContent.rekomendasiNdSvpIa || '',

                ND_Dirut_Nomor:     ndDirutNomorInput.value     || extractedDataFromContent.nomorNdDirut || '',
                Desc_ND_Dirut:      ndDirutDeskripsiInput.value || extractedDataFromContent.deskripsiNdDirut || '',
                ND_Dirut_Tgl:       ndDirutTanggalInput.value   || formatDateForInput(extractedDataFromContent.tanggalNdDirut) || '', // Ensure YYYY-MM-DD
                ND_Dirut_Temuan:    ndDirutTemuanInput.value    || extractedDataFromContent.temuanNdDirut || '',
                ND_Dirut_Rekomendasi: ndDirutRekomendasiInput.value || extractedDataFromContent.rekomendasiNdDirut || '',

                ND_Dirut_Duedate1:  ndDirutDuedate1Input.value  || formatDateForInput(extractedDataFromContent.duedateNdDirut) || '', // content.js 'duedateNdDirut' goes to Duedate1
                ND_Dirut_Duedate2:  ndDirutDuedate2Input.value  || '', // Duedate2 is likely manual or from a different source

                ND_Dirut_PIC:       ndDirutPicInput.value       || extractedDataFromContent.picNdDirut || '',
                ND_Dirut_UIC:       ndDirutUicInput.value       || extractedDataFromContent.uicNdDirut || '',

                // Status fields: values from popup (which might have been pre-filled by content.js)
                // Convert empty strings from number inputs to 0 or a suitable default if necessary,
                // but filler script might handle empty strings appropriately for number fields.
                // For now, send what's in the popup or extracted, then default to 0 if nothing.
                MTL_Closed:         mtlClosedInput.value !== ""      ? Number(mtlClosedInput.value)   : (extractedDataFromContent.mtlClosed !== undefined ? Number(extractedDataFromContent.mtlClosed) : 0),
                Reschedule:         rescheduleInput.value !== ""     ? Number(rescheduleInput.value)  : (extractedDataFromContent.reschedule !== undefined ? Number(extractedDataFromContent.reschedule) : 0),
                Overdue:            overdueInput.value !== ""        ? Number(overdueInput.value)     : (extractedDataFromContent.overdue !== undefined ? Number(extractedDataFromContent.overdue) : 0),
                // OnSchedule: default to 1 if nothing else, as per original logic
                OnSchedule:         onscheduleInput.value !== ""     ? Number(onscheduleInput.value)  : (extractedDataFromContent.onSchedule !== undefined ? Number(extractedDataFromContent.onSchedule) : 1),
                Status:             statusInput.value           || extractedDataFromContent.status || 'OnSchedule', // Default

                // Supplemental fields (not directly in user's MTL table but were in original dataForMTL)
                idLampiran: idLampiranInput.value || extractedDataFromContent.idLampiran || '',
                pengirim: pengirimInput.value || extractedDataFromContent.pengirim || '',
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
                        // Check for "ia telkom.mhtml" or "ia%20telkom.mhtml" case-insensitively
                        return lowerUrl.includes("ia telkom.mhtml") || lowerUrl.includes("ia%20telkom.mhtml");
                    }
                    return false;
                });

                if (mtlTabs.length > 0) {
                    const targetTab = mtlTabs[0]; // Use the first match
                    chrome.tabs.update(targetTab.id, { active: true });
                    // Send a message to the content script in that tab
                    chrome.tabs.sendMessage(targetTab.id, {
                        action: "fillMTLForm",
                        data: dataForMTL
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            showError(`Could not connect to IA Telkom.mhtml. Ensure it's open and the extension has file access. Error: ${chrome.runtime.lastError.message}`);
                            console.error("Error sending message to ia_telkom_filler.js:", chrome.runtime.lastError.message);
                        } else if (response && response.success) {
                            showError(''); // Clear error
                            sendText.textContent = 'Data Sent!';
                            // Optionally close popup after a delay or keep it open
                            // setTimeout(() => window.close(), 2000);
                        } else {
                            showError(response ? response.message : 'Failed to get confirmation from IA Telkom.mhtml.');
                        }
                        sendIcon.className = originalIcon; // Reset icon
                        // sendDataBtn.disabled = false; // Re-enable button only if we don't close
                    });
                } else {
                    showError('File \'C:\\\\Users\\\\khair\\\\Downloads\\\\IA Telkom.mhtml\' is not open. Please open this file in a Chrome tab and try again.');
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
            console.error('Send error:', error);
        }
        // Not closing window.close(); immediately to allow user to see status/error.
    });

    // Store data from content.js into chrome.storage.local when received
    // This is a new listener to capture the full data set from content.js
    // Assumes content.js will send a message like { action: "storeExtractedData", data: extractedData }
    // However, current content.js sends data back to popup directly.
    // Modifying getDataBtn listener to store this data.

    // Modify existing getDataBtn's response handler
    const originalGetDataResponseHandler = async (response) => {
        showLoading(false);
        if (chrome.runtime.lastError) {
            showError('Failed to connect to page. Please ensure "Allow access to file URLs" is enabled for this extension and refresh the NDE page.');
            console.error("[popup.js] sendMessage lastError:", chrome.runtime.lastError.message);
            return;
        }

        if (response && response.success && response.data) {
            console.log("[popup.js] Data diterima dari content.js:", response.data);

            // Store the complete extracted data for sendDataBtn to use
            await chrome.storage.local.set({ ndeToMtlExtractedData: response.data });

            const {
                // Existing fields from content.js
                noSPK,
                nomorNdSvpIa,
                deskripsiNdSvpIa,
                tanggalNdSvpIa,
                temuanNdSvpIa,
                rekomendasiNdSvpIa,
                pengirim, // Assuming content.js might provide this
                idLampiran, // Assuming content.js might provide this

                // Potential new fields from content.js (even if not fully implemented there yet)
                kelompok,
                code,
                masaPenyelesaianPekerjaan,
                matriksProgram,
                tanggalMatriks,
                nomorNdDirut,
                deskripsiNdDirut,
                tanggalNdDirut,
                temuanNdDirut,
                rekomendasiNdDirut,
                duedateNdDirut, // This might be a single string from content.js
                picNdDirut,
                uicNdDirut,
                mtlClosed,
                reschedule,
                overdue,
                onSchedule,
                status
            } = response.data;

            // Helper to safely set value or empty string if data is "Data belum ditemukan" or undefined
            const safeSet = (value) => (value && value !== "Data belum ditemukan" ? value : "");

            // Populate existing popup fields
            if (nomorNotaInput) nomorNotaInput.value = safeSet(nomorNdSvpIa);
            if (perihalInput) perihalInput.value = safeSet(deskripsiNdSvpIa);
            if (pengirimInput) pengirimInput.value = safeSet(pengirim);
            if (idLampiranInput) idLampiranInput.value = safeSet(idLampiran);
            if (noSpkInput) noSpkInput.value = safeSet(noSPK);
            if (tanggalNdSvpIaInput) tanggalNdSvpIaInput.value = formatDateForInput(safeSet(tanggalNdSvpIa));
            if (temuanNdSvpIaInput) temuanNdSvpIaInput.value = safeSet(temuanNdSvpIa);
            if (rekomendasiNdSvpIaInput) rekomendasiNdSvpIaInput.value = highlightRekomendasi(safeSet(rekomendasiNdSvpIa));


            // Populate new MTL General Fields
            if (kelompokInput) kelompokInput.value = safeSet(kelompok);
            if (codeInput) codeInput.value = safeSet(code);
            if (masaPenyelesaianInput) masaPenyelesaianInput.value = safeSet(masaPenyelesaianPekerjaan);
            if (matriksProgramInput) matriksProgramInput.value = safeSet(matriksProgram);
            if (tanggalMatriksInput) tanggalMatriksInput.value = formatDateForInput(safeSet(tanggalMatriks));

            // Populate new ND Dirut Fields
            if (ndDirutNomorInput) ndDirutNomorInput.value = safeSet(nomorNdDirut);
            if (ndDirutTanggalInput) ndDirutTanggalInput.value = formatDateForInput(safeSet(tanggalNdDirut));
            if (ndDirutDeskripsiInput) ndDirutDeskripsiInput.value = safeSet(deskripsiNdDirut);
            if (ndDirutTemuanInput) ndDirutTemuanInput.value = safeSet(temuanNdDirut);
            if (ndDirutRekomendasiInput) ndDirutRekomendasiInput.value = safeSet(rekomendasiNdDirut);
            // For duedateNdDirut, content.js might send a single string. We'll put it in the first field.
            if (ndDirutDuedate1Input) ndDirutDuedate1Input.value = formatDateForInput(safeSet(duedateNdDirut));
            if (ndDirutDuedate2Input) ndDirutDuedate2Input.value = ""; // Clear or handle separately if needed
            if (ndDirutPicInput) ndDirutPicInput.value = safeSet(picNdDirut);
            if (ndDirutUicInput) ndDirutUicInput.value = safeSet(uicNdDirut);

            // Populate new MTL Status Fields
            // For these numeric/boolean fields, ensure they are numbers or empty string for the input.
            if (mtlClosedInput) mtlClosedInput.value = (mtlClosed !== undefined && mtlClosed !== "Data belum ditemukan") ? Number(mtlClosed) : "";
            if (rescheduleInput) rescheduleInput.value = (reschedule !== undefined && reschedule !== "Data belum ditemukan") ? Number(reschedule) : "";
            if (overdueInput) overdueInput.value = (overdue !== undefined && overdue !== "Data belum ditemukan") ? Number(overdue) : "";
            if (onscheduleInput) onscheduleInput.value = (onSchedule !== undefined && onSchedule !== "Data belum ditemukan") ? Number(onSchedule) : "";
            if (statusInput) statusInput.value = safeSet(status);


            const hasSignificantData = safeSet(nomorNdSvpIa) || safeSet(deskripsiNdSvpIa);

            if (hasSignificantData) {
                showForm();
            } else {
                showForm();
            }

        } else if (response && !response.success) {
            showError(response.message || 'Failed to extract data from page. Content script reported an issue.');
            console.warn('[popup.js] Pesan error dari content.js:', response.message);
        } else {
            showError('No response or invalid data from page. Please try refreshing the NDE page and the extension.');
            console.warn('[popup.js] Respons tidak valid atau tidak ada:', response);
        }
    };

    // Detach original listener and attach new one if necessary, or modify it
    // For simplicity, I'm assuming this is the only place `getDataFromNDE` response is handled.
    // The original `getDataBtn` listener now calls `originalGetDataResponseHandler`
    getDataBtn.removeEventListener('click', getDataBtn.fn); // Need to store original fn if this approach is taken elsewhere
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
            // The response from sendMessage will be handled by originalGetDataResponseHandler
            chrome.tabs.sendMessage(tab.id, { action: "getDataFromNDE" }, originalGetDataResponseHandler);
        } catch (error) {
            showLoading(false);
            showError('An unexpected error occurred. Please try again.');
            console.error('Error:', error);
        }
    });


    // On load, show only the Extract Data button (form and error hidden)
    dataDisplayDiv.style.display = 'none';
    statusError.style.display = 'none';
});
