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
            const dataForMTL = {
                // Fields from the user's list for IA Telkom.mhtml
                no_spk: noSpkInput.value || extractedDataFromContent.noSPK || '',
                kelompok: extractedDataFromContent.kelompok || 'Information Technology Audit', // Default or from content
                CODE: extractedDataFromContent.code || '', // From content if available
                // Masa_Penyelesaian_Pekerjaan1_Entry_form is disabled, so we don't try to set it.
                // It's in extractedDataFromContent.masaPenyelesaianPekerjaan if needed elsewhere.
                Matriks_Program: extractedDataFromContent.matriksProgram || '', // From content if available
                Matriks_Tgl: extractedDataFromContent.tanggalMatriks || '', // From content if available

                ND_SVP_IA_Nomor: nomorNotaInput.value || extractedDataFromContent.nomorNdSvpIa || '',
                Desc_ND_SVP_IA: perihalInput.value || extractedDataFromContent.deskripsiNdSvpIa || '',
                ND_SVP_IA_Tanggal: tanggalNdSvpIaInput.value || extractedDataFromContent.tanggalNdSvpIa || '',
                ND_SVP_IA_Temuan: temuanNdSvpIaInput.value || extractedDataFromContent.temuanNdSvpIa || '',
                ND_SVP_IA_Rekomendasi: rekomendasiNdSvpIaInput.value || extractedDataFromContent.rekomendasiNdSvpIa || '',

                ND_Dirut_Nomor: extractedDataFromContent.nomorNdDirut || '',
                Desc_ND_Dirut: extractedDataFromContent.deskripsiNdDirut || '',
                ND_Dirut_Tgl: extractedDataFromContent.tanggalNdDirut || '',
                ND_Dirut_Temuan: extractedDataFromContent.temuanNdDirut || '',
                ND_Dirut_Rekomendasi: extractedDataFromContent.rekomendasiNdDirut || '',

                // Assuming Duedate ND Dirut might be split into two fields as per user's doc
                // For now, using a single field; filler script might need to adapt
                ND_Dirut_Duedate1: extractedDataFromContent.duedateNdDirut || '',
                ND_Dirut_Duedate2: '', // If there's a second part

                ND_Dirut_PIC: extractedDataFromContent.picNdDirut || '',
                ND_Dirut_UIC: extractedDataFromContent.uicNdDirut || '',

                // These seem to be status counters/values, default to 0 or empty if not in NDE
                MTL_Closed: extractedDataFromContent.mtlClosed || 0,
                Reschedule: extractedDataFromContent.reschedule || 0,
                Overdue: extractedDataFromContent.overdue || 0,
                OnSchedule: extractedDataFromContent.onSchedule === undefined ? 1 : extractedDataFromContent.onSchedule, // Default to 1 if not present
                Status: extractedDataFromContent.status || 'OnSchedule', // Default

                // Fields from popup that might not directly map or are supplemental
                idLampiran: idLampiranInput.value || extractedDataFromContent.idLampiran || '',
                pengirim: pengirimInput.value || extractedDataFromContent.pengirim || '',
                // Add other fields from extractedDataFromContent if they have a target in IA Telkom.mhtml
                masaPenyelesaianPekerjaan: extractedDataFromContent.masaPenyelesaianPekerjaan || '',

            };

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
                noSPK,
                // masaPenyelesaianPekerjaan, // Not directly on popup
                nomorNdSvpIa,
                deskripsiNdSvpIa,
                tanggalNdSvpIa,
                temuanNdSvpIa,
                rekomendasiNdSvpIa
            } = response.data;

            if (nomorNotaInput) nomorNotaInput.value = (nomorNdSvpIa && nomorNdSvpIa !== "Data belum ditemukan") ? nomorNdSvpIa : "";
            if (perihalInput) perihalInput.value = (deskripsiNdSvpIa && deskripsiNdSvpIa !== "Data belum ditemukan") ? deskripsiNdSvpIa : "";
            if (noSpkInput) noSpkInput.value = (noSPK && noSPK !== "Data belum ditemukan") ? noSPK : "";
            if (tanggalNdSvpIaInput) tanggalNdSvpIaInput.value = (tanggalNdSvpIa && tanggalNdSvpIa !== "Data belum ditemukan") ? tanggalNdSvpIa : "";
            if (temuanNdSvpIaInput) temuanNdSvpIaInput.value = (temuanNdSvpIa && temuanNdSvpIa !== "Data belum ditemukan") ? temuanNdSvpIa : "";

            if (rekomendasiNdSvpIaInput) {
                const recText = (rekomendasiNdSvpIa && rekomendasiNdSvpIa !== "Data belum ditemukan") ? rekomendasiNdSvpIa : "";
                rekomendasiNdSvpIaInput.value = highlightRekomendasi(recText); // Keep existing highlighting
            }

            // Also populate other fields if they exist in the popup and are in response.data
            // Example:
            // if (pengirimInput && response.data.pengirim) pengirimInput.value = response.data.pengirim;
            // if (idLampiranInput && response.data.idLampiran) idLampiranInput.value = response.data.idLampiran;


            const hasSignificantData = (nomorNdSvpIa && nomorNdSvpIa !== "Data belum ditemukan") ||
                                       (deskripsiNdSvpIa && deskripsiNdSvpIa !== "Data belum ditemukan");

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
