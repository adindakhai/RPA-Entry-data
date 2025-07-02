// Fungsi untuk mengisi form
function fillForm(data) {
    console.log("Menerima data untuk diisi ke form:", data);

    const mapping = {
        nomorSurat: '#nomor_surat',
        perihal: '#perihal_surat',
        pengirim: '#asal_surat'
    };

    for (const key in mapping) {
        if (data[key]) {
            const element = document.querySelector(mapping[key]);
            if (element) {
                element.value = data[key];
                element.classList.add('autofilled'); // Tambah class untuk highlight
                console.log(`Mengisi field ${mapping[key]} dengan nilai: ${data[key]}`);
            } else {
                console.warn(`Elemen form tidak ditemukan untuk: ${mapping[key]}`);
            }
        }
    }
}

// Saat halaman MTL dimuat, minta data dari background script
console.log("MTL Filler Script Loaded. Meminta data dari storage...");
chrome.runtime.sendMessage({ action: "getStoredNdeData" }, (response) => {
    if (response && response.data) {
        fillForm(response.data);
    } else {
        console.log("Tidak ada data NDE yang tersimpan untuk diisi.");
    }
});