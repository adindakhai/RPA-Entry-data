// ===============================================================
// PENTING: GANTI URL DI BAWAH INI DENGAN URL UNIK DARI WEBHOOK.SITE
const MOCK_MTL_API_URL = 'https://webhook.site/1b319697-ad84-47fd-933d-41c9c092d5bb';
// ===============================================================

// Listener untuk pesan dari content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processNdeData") {
        console.log("Menerima data dari content script:", request.data);
        const data = request.data;

        // Gunakan Promise.all untuk menjalankan kedua tugas secara paralel
        Promise.all([
            saveToDatabase(data),
            sendToMtlApi(data)
        ]).then(results => {
            console.log("Semua tugas selesai.");
            console.log("Hasil DB:", results[0]);
            console.log("Hasil MTL:", results[1]);
            sendResponse({ status: 'success', message: 'Data berhasil disimpan ke DB dan dikirim ke MTL.' });
        }).catch(error => {
            console.error("Terjadi kesalahan:", error);
            sendResponse({ status: 'error', message: error.message });
        });

        // Return true untuk menandakan bahwa kita akan merespons secara asynchronous
        return true;
    }
});

// 1. Fungsi untuk menyimpan ke "Database" (Chrome Storage)
function saveToDatabase(data) {
    return new Promise((resolve, reject) => {
        // Buat key unik untuk setiap entri data
        const dataKey = `nde_data_${Date.now()}`;
        
        chrome.storage.local.set({ [dataKey]: data }, () => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve({ status: 'success', savedKey: dataKey });
        });
    });
}

// 2. Fungsi untuk mengirim ke "MTL Online" (Webhook.site)
function sendToMtlApi(data) {
    return fetch(MOCK_MTL_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Webhook.site biasanya merespons dengan OK
    })
    .then(textResponse => ({ status: 'success', response: textResponse }));
}