// content.js - Final Proactive Version with Robust Extraction Logic
console.log("Asisten NDE [Penjaga & Ekstraktor] aktif.");

// ===================================================================================
// BAGIAN 1: PENJAGA SANDBOX (MUTATION OBSERVER) - TIDAK BERUBAH
// ===================================================================================
const sandboxObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'IFRAME' && node.hasAttribute('sandbox')) {
                    node.removeAttribute('sandbox');
                    console.log("Penjaga: Atribut 'sandbox' telah dihapus dari iframe.");
                }
                if (node.querySelectorAll) {
                    node.querySelectorAll('iframe[sandbox]').forEach(iframe => {
                        iframe.removeAttribute('sandbox');
                        console.log("Penjaga: Atribut 'sandbox' telah dihapus dari nested iframe.");
                    });
                }
            });
        }
    }
});
sandboxObserver.observe(document.documentElement, { childList: true, subtree: true });


// ===================================================================================
// BAGIAN 2: FUNGSI BANTU (HELPER FUNCTIONS)
// ===================================================================================

/**
 * [LOGIKA BARU & LEBIH ANDAL] Fungsi ini mencari teks di antara serangkaian kata kunci awal dan akhir.
 * Ini lebih kuat daripada Regex yang kompleks.
 */
function getTextBetweenKeywords(fullText, startKeywords, endKeywords) {
    const lowerFullText = fullText.toLowerCase();
    let startIndex = -1;
    let effectiveStartKeywordLength = 0;

    // Cari indeks awal berdasarkan kata kunci awal yang paling pertama ditemukan
    for (const keyword of startKeywords) {
        const i = lowerFullText.indexOf(keyword.toLowerCase());
        if (i !== -1) {
            startIndex = i;
            effectiveStartKeywordLength = keyword.length;
            break;
        }
    }

    if (startIndex === -1) {
        return null; // Tidak ada kata kunci awal yang ditemukan
    }

    // Tentukan titik awal konten, yaitu setelah kata kunci dan karakter pemisah (:, spasi, baris baru)
    const afterKeywordIndex = startIndex + effectiveStartKeywordLength;
    const contentStartIndexMatch = fullText.substring(afterKeywordIndex).match(/^\s*[:\n\s.-]*/);
    const contentStartIndex = afterKeywordIndex + (contentStartIndexMatch ? contentStartIndexMatch[0].length : 0);

    let endIndex = fullText.length; // Default ke akhir teks jika tidak ada kata kunci akhir

    // Cari indeks akhir berdasarkan kata kunci akhir yang paling awal ditemukan SETELAH indeks awal
    for (const keyword of endKeywords) {
        const i = lowerFullText.indexOf(keyword.toLowerCase(), contentStartIndex);
        if (i !== -1) {
            endIndex = Math.min(endIndex, i);
        }
    }

    return fullText.substring(contentStartIndex, endIndex).trim();
}

/**
 * [LOGIKA YANG DISederhanakan] Fungsi ini hanya memecah teks menjadi daftar berdasarkan baris baru.
 */
function parseListFromString(textBlock) {
    if (!textBlock || typeof textBlock !== 'string') {
        return ["Data belum ditemukan"];
    }
    const trimmedTextBlock = textBlock.trim();
    if (!trimmedTextBlock) {
        return ["Data belum ditemukan"];
    }
    const lines = trimmedTextBlock.split('\n').map(line => line.trim()).filter(line => line);
    return lines.length > 0 ? lines : [trimmedTextBlock];
}


// ===================================================================================
// BAGIAN 3: LISTENER EKSTRAKSI DATA UNIVERSAL (LOGIKA INTI DIPERBARUI)
// ===================================================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getDataFromNDE") {
        console.log("Asisten NDE: Menerima permintaan. Menunggu halaman stabil selama 2 detik...");

        // Ganti MutationObserver dengan jeda waktu yang lebih andal untuk file MHTML
        setTimeout(() => {
            console.log("Asisten NDE: Waktu tunggu selesai. Memulai ekstraksi...");

            let extractedData = {
                noSPK: "Data belum ditemukan", kelompok: "Data belum ditemukan", code: "Data belum ditemukan",
                masaPenyelesaianPekerjaan: "Data belum ditemukan", matriksProgram: "Data belum ditemukan", tanggalMatriks: "Data belum ditemukan",
                nomorNdSvpIa: "Data belum ditemukan", deskripsiNdSvpIa: "Data belum ditemukan", tanggalNdSvpIa: "Data belum ditemukan",
                temuanNdSvpIa: ["Data belum ditemukan"], rekomendasiNdSvpIa: ["Data belum ditemukan"], nomorNdDirut: "Data belum ditemukan",
                deskripsiNdDirut: "Data belum ditemukan", tanggalNdDirut: "Data belum ditemukan", temuanNdDirut: ["Data belum ditemukan"],
                rekomendasiNdDirut: ["Data belum ditemukan"], duedateNdDirut: "Data belum ditemukan", picNdDirut: "Data belum ditemukan",
                uicNdDirut: "Data belum ditemukan", mtlClosed: 0, reschedule: 0, overdue: 0, onSchedule: 0,
                status: "Data belum ditemukan", pengirim: "Data belum ditemukan", idLampiran: "Data belum ditemukan"
            };

            // Coba ambil teks dari Shadow DOM dulu, jika gagal, ambil dari body utama.
            const shadowHost = document.querySelector('app-virtualdom');
            const bodyText = shadowHost?.shadowRoot?.querySelector('.isisurat')?.innerText || document.body.innerText;

            if (!bodyText || bodyText.trim() === "") {
                console.error("Asisten NDE: Tidak dapat menemukan teks konten di body atau Shadow DOM.");
                sendResponse({ success: false, message: "Konten teks tidak ditemukan di halaman." });
                return;
            }

            // --- EKSTRAKSI UTAMA MENGGUNAKAN METODE BARU ---

            // Ekstraksi Temuan (OFI)
            const ofiStartKeywords = ["opportunities for improvement (ofi)", "ofi", "temuan"];
            const ofiEndKeywords = ["terhadap ofi tersebut, kami menyampaikan rekomendasi", "rekomendasi", "permasalahan di atas telah kami klarifikasi", "demikian disampaikan"];
            const ofiTextContent = getTextBetweenKeywords(bodyText, ofiStartKeywords, ofiEndKeywords);
            if (ofiTextContent) {
                extractedData.temuanNdSvpIa = parseListFromString(ofiTextContent);
            }

            // Ekstraksi Rekomendasi
            const rekStartKeywords = ["terhadap ofi tersebut, kami menyampaikan rekomendasi", "rekomendasi"];
            const rekEndKeywords = ["permasalahan di atas telah kami klarifikasi", "demikian disampaikan", "hormat kami", "nama pejabat"];
            const rekomendasiTextContent = getTextBetweenKeywords(bodyText, rekStartKeywords, rekEndKeywords);
            if (rekomendasiTextContent) {
                extractedData.rekomendasiNdSvpIa = parseListFromString(rekomendasiTextContent);
            }

            // Anda bisa menambahkan ekstraksi untuk field lain di sini dengan pola yang sama
            // Contoh:
            // const spkStartKeywords = ["surat perintah kerja", "spk"];
            // const spkEndKeywords = ["\n"]; // Berakhir di baris baru
            // const spkText = getTextBetweenKeywords(bodyText, spkStartKeywords, spkEndKeywords);
            // if(spkText) extractedData.noSPK = spkText;

            console.log("Asisten NDE: Ekstraksi selesai.", extractedData);
            sendResponse({ success: true, data: extractedData });

        }, 2000); // Jeda 2 detik

        return true; // Wajib untuk respons asinkron
    }
});
