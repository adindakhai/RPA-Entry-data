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
        try {
            const dataFromNDE = {
                nomorNota: nomorNotaInput.value,
                perihal: perihalInput.value,
                pengirim: pengirimInput.value,
                idLampiran: idLampiranInput.value,
                noSpk: noSpkInput.value,
                tanggalNdSvpIa: tanggalNdSvpIaInput.value,
                temuanNdSvpIa: temuanNdSvpIaInput.value,
                rekomendasiNdSvpIa: rekomendasiNdSvpIaInput.value,
            };
            const { dataForMTL: lastData } = await new Promise(resolve => {
                chrome.storage.local.get('dataForMTL', resolve);
            });
            const n = lastData || {};
            const extra = {
                noSpk: dataFromNDE.noSpk,
                tanggalNdSvpIa: dataFromNDE.tanggalNdSvpIa,
                temuanNdSvpIa: dataFromNDE.temuanNdSvpIa,
                rekomendasiNdSvpIa: highlightRekomendasi(dataFromNDE.rekomendasiNdSvpIa)
            };
            const dataForMTL = {
                noSpk: extra.noSpk || '',
                kelompok: '',
                code: '',
                masaPenyelesaianPekerjaan: '',
                matriksProgram: '',
                tanggalMatriks: '',
                nomorNdSvpIa: dataFromNDE.nomorNota || '',
                deskripsiNdSvpIa: dataFromNDE.perihal || '',
                tanggalNdSvpIa: extra.tanggalNdSvpIa || '',
                temuanNdSvpIa: extra.temuanNdSvpIa || '',
                rekomendasiNdSvpIa: extra.rekomendasiNdSvpIa || '',
                nomorNdDirut: '',
                deskripsiNdDirut: '',
                tanggalNdDirut: '',
                temuanNdDirut: '',
                rekomendasiNdDirut: '',
                duedateNdDirut: '',
                picNdDirut: '',
                uicNdDirut: '',
                mtlClosed: n.mtlClosed || 0,
                reschedule: n.reschedule || 0,
                overdue: n.overdue || 0,
                onSchedule: n.onSchedule || 0,
                status: n.status || '',
                idLampiran: dataFromNDE.idLampiran || '',
            };
            await chrome.storage.local.set({ dataForMTL });
            const mtlPageUrl = chrome.runtime.getURL('MOCKUP/mtl_mockup.html');
            await chrome.tabs.create({ url: mtlPageUrl });
            window.close();
        } catch (error) {
            sendIcon.className = originalIcon;
            sendText.textContent = originalText;
            sendDataBtn.disabled = false;
            showError('Failed to send data. Please try again.');
            console.error('Send error:', error);
        }
    });

    // On load, show only the Extract Data button (form and error hidden)
    dataDisplayDiv.style.display = 'none';
    statusError.style.display = 'none';
});
