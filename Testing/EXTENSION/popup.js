document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements in the popup
    const getDataBtn = document.getElementById('get-data-btn');
    const sendDataBtn = document.getElementById('send-data-btn');
    const dataDisplayDiv = document.getElementById('data-display');
    const statusContainer = document.getElementById('status-container');
    const statusInitial = document.getElementById('status-initial');
    const statusError = document.getElementById('status-error');

    // Input fields in the popup
    const nomorNotaInput = document.getElementById('popup-nomor-nota');
    const perihalInput = document.getElementById('popup-perihal');
    const auditeeInput = document.getElementById('popup-auditee');
    const dueDateInput = document.getElementById('popup-due-date');
    const rekomendasiTextarea = document.getElementById('popup-rekomendasi');

    const showError = (message) => {
        statusInitial.classList.add('hidden');
        dataDisplayDiv.classList.add('hidden');
        statusContainer.classList.remove('hidden');
        statusError.textContent = message;
        statusError.classList.remove('hidden');
    };

    // Event listener for the "Ekstrak Data" button
    getDataBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // A more flexible check for the page
        if (!tab.url.includes('nde_mockup.html') && !tab.url.includes('nde.telkom.co.id')) {
            showError('Buka halaman NDE (mockup atau asli) terlebih dahulu!');
            return;
        }

        // Send a message to the content script to get data from the page
        chrome.tabs.sendMessage(tab.id, { action: "getDataFromNDE" }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Gagal terhubung ke halaman. Pastikan "Allow access to file URLs" aktif dan refresh halaman.');
                console.error(chrome.runtime.lastError.message);
                return;
            }

            if (response && response.data) {
                const { nomorNota, perihal, auditee, dueDate, rekomendasi } = response.data;
                
                if (!nomorNota && !perihal) {
                    showError('Tidak ada data yang dapat diekstrak. Pastikan format NDE sesuai.');
                    return;
                }

                // Populate the popup form with the retrieved data
                nomorNotaInput.value = nomorNota || '';
                perihalInput.value = perihal || '';
                auditeeInput.value = auditee || '';
                dueDateInput.value = dueDate || '';
                rekomendasiTextarea.value = rekomendasi ? rekomendasi.join('\n') : '';

                statusContainer.classList.add('hidden');
                dataDisplayDiv.classList.remove('hidden');
                sendDataBtn.disabled = false;
            } else {
                showError('Gagal mendapat respons dari halaman. Coba refresh.');
            }
        });
    });

    // Event listener for the "Kirim ke MTL" button
    sendDataBtn.addEventListener('click', async () => {
        const dataToSend = {
            nomorNota: nomorNotaInput.value,
            perihal: perihalInput.value,
            auditee: auditeeInput.value,
            dueDate: dueDateInput.value,
            rekomendasi: rekomendasiTextarea.value.split('\n').filter(line => line.trim() !== '')
        };

        await chrome.storage.local.set({ dataForMTL: dataToSend });

        const mtlPageUrl = chrome.runtime.getURL('MOCKUP/mtl_mockup.html');
        await chrome.tabs.create({ url: mtlPageUrl });
        
        window.close();
    });
});