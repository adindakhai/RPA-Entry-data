document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements in the popup
    const getDataBtn = document.getElementById('get-data-btn');
    const sendDataBtn = document.getElementById('send-data-btn');
    const dataDisplayDiv = document.getElementById('data-display');
    
    // Status message elements
    const statusContainer = document.getElementById('status-container');
    const statusInitial = document.getElementById('status-initial');
    const statusError = document.getElementById('status-error');

    // Input fields in the popup
    const nomorNotaInput = document.getElementById('popup-nomor-nota');
    const perihalInput = document.getElementById('popup-perihal');
    const pengirimInput = document.getElementById('popup-pengirim');
    const idLampiranInput = document.getElementById('popup-id-lampiran');

    const showError = (message) => {
        statusInitial.classList.add('hidden');
        dataDisplayDiv.classList.add('hidden');
        statusContainer.classList.remove('hidden');
        statusError.textContent = message;
        statusError.classList.remove('hidden');
    };

    // Event listener for the "Ambil Data" (Get Data) button
    getDataBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('nde_mockup.html')) {
            showError('Buka file MOCKUP/nde_mockup.html dulu!');
            return;
        }

        // Send a message to the content script to get data from the page
        chrome.tabs.sendMessage(tab.id, { action: "getDataFromNDE" }, (response) => {
            if (chrome.runtime.lastError) {
                // This error happens if the content script is not injected.
                // A common reason is not enabling "Allow access to file URLs" for the extension.
                showError('Gagal terhubung ke halaman. Pastikan "Allow access to file URLs" aktif untuk ekstensi ini dan refresh halaman NDE.');
                console.error(chrome.runtime.lastError.message);
                return;
            }

            if (response && response.data) {
                const { nomorNota, perihal, pengirim, idLampiran } = response.data;
                
                // Check if we actually got any data
                if (!nomorNota && !perihal && !pengirim && !idLampiran) {
                    showError('Tidak ada data yang ditemukan. Pastikan ID elemen di halaman NDE benar.');
                    return;
                }

                // Populate the popup form with the retrieved data
                nomorNotaInput.value = nomorNota || '';
                perihalInput.value = perihal || '';
                pengirimInput.value = pengirim || '';
                idLampiranInput.value = idLampiran || '';

                // Update UI: Hide status messages and show the data form
                statusContainer.classList.add('hidden');
                dataDisplayDiv.classList.remove('hidden');
                sendDataBtn.disabled = false; // Enable the "Send" button
            } else {
                showError('Gagal mendapat respons dari halaman. Coba refresh.');
            }
        });
    });

    // Event listener for the "Kirim ke MTL" (Send to MTL) button
    sendDataBtn.addEventListener('click', async () => {
        const dataToSend = {
            nomorNota: nomorNotaInput.value,
            perihal: perihalInput.value,
            pengirim: pengirimInput.value,
            idLampiran: idLampiranInput.value,
        };

        await chrome.storage.local.set({ dataForMTL: dataToSend });

        const mtlPageUrl = chrome.runtime.getURL('MOCKUP/mtl_mockup.html');
        await chrome.tabs.create({ url: mtlPageUrl });
        
        window.close(); // Close the popup after sending
    });
});
