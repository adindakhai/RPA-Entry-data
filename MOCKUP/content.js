// Cek apakah kita berada di halaman yang benar dengan melihat judulnya
if (document.title === "Mockup NDE") {
    console.log("✅ Script berjalan di halaman Mockup NDE yang benar!");

    // Fungsi untuk mengambil data dari halaman
    function scrapeDataFromPage() {
        const data = {
            nomorSurat: document.getElementById('nomor-surat')?.innerText,
            tanggalSurat: document.getElementById('tanggal-surat')?.innerText,
            perihal: document.getElementById('perihal-surat')?.innerText,
            pengirim: document.getElementById('pengirim-surat')?.innerText,
            tujuan: document.getElementById('tujuan-surat')?.innerText,
            retrievedAt: new Date().toISOString()
        };
        return data;
    }

    // Buat tombol di halaman
    const actionButton = document.createElement('button');
    actionButton.id = 'nde-action-button'; // Beri ID agar tidak duplikat
    actionButton.innerText = 'Kirim Data NDE ke Database & MTL';
    actionButton.style.marginTop = '20px';
    actionButton.style.padding = '10px 15px';
    actionButton.style.cursor = 'pointer';

    // Cek apakah tombol sudah ada sebelum menambahkannya
    if (!document.getElementById('nde-action-button')) {
        document.body.appendChild(actionButton);
    }
    
    // Tambahkan event listener ke tombol
    actionButton.addEventListener('click', () => {
        const scrapedData = scrapeDataFromPage();
        console.log("Data yang diambil:", scrapedData);

        actionButton.innerText = 'Mengirim...';
        actionButton.disabled = true;

        // Kirim data ke background script untuk diproses
        chrome.runtime.sendMessage({
            action: "processNdeData",
            data: scrapedData
        }, (response) => {
            if (response && response.status === 'success') {
                actionButton.innerText = 'Data Berhasil Terkirim!';
                actionButton.style.backgroundColor = '#4CAF50';
                actionButton.style.color = 'white';
                console.log("Respons dari background:", response.message);
            } else {
                actionButton.innerText = 'Gagal Mengirim!';
                actionButton.style.backgroundColor = '#F44336';
                actionButton.style.color = 'white';
                console.error("Error dari background:", response ? response.message : "Tidak ada respons.");
            }
        });
    });

} else {
    // Jika bukan di halaman yang benar, jangan lakukan apa-apa.
    // console.log("Script berjalan, tetapi ini bukan halaman Mockup NDE.");
}