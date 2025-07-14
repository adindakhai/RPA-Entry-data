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

            // Ekstraksi Nomor SPK
            // Format contoh: Surat Perintah Kerja (SPK) Nomor C.Tel.AMSXX/0XX/K/PW000/IA-X0/20XX/Rhs
            // Cari keyword "Surat Perintah Kerja (SPK) Nomor" atau "SPK Nomor"
            // Lalu ambil sisanya di baris itu atau sampai pattern nomornya selesai.
            try {
                const spkRegex = /(?:Surat Perintah Kerja \(SPK\) Nomor|SPK Nomor)\s*([A-Za-z0-9./-]+(?:BAPP|BAST|ADDENDUM|AMANDEMEN)?)/i;
                const spkMatch = bodyText.match(spkRegex);
                if (spkMatch && spkMatch[1]) {
                    extractedData.noSPK = spkMatch[1].trim();
                } else {
                    // Fallback if the primary regex doesn't match, try a simpler "SPK" keyword
                    // and getTextBetweenKeywords to get the line. This is less precise.
                    const spkLineText = getTextBetweenKeywords(bodyText, ["SPK"], ["\n", "tanggal", "perihal"]);
                    if (spkLineText && /[A-Za-z0-9./-]+/.test(spkLineText)) { // Basic check if it looks like a number
                         // Further attempt to clean up if it's just a line with "SPK" and the number.
                        const simplerSpkMatch = spkLineText.match(/([A-Za-z0-9./-]+(?:BAPP|BAST|ADDENDUM|AMANDEMEN)?)/);
                        if (simplerSpkMatch && simplerSpkMatch[1]) {
                            extractedData.noSPK = simplerSpkMatch[1].trim();
                        }
                    }
                }
            } catch (e) {
                console.error("Asisten NDE: Error saat ekstraksi Nomor SPK:", e);
            }

            // Ekstraksi Nomor ND SVP IA
            // Format contoh: C.Tel.XXX/UM 500/HCS-A1010000/2025. Biasanya di Kop Surat.
            // Mungkin didahului "Nomor :"
            try {
                const ndSvpIaRegex1 = /(?:Nomor|No\.)\s*[:\-]?\s*(C\.Tel\.[A-Z0-9./\s-]+)/i;
                let ndMatch = bodyText.match(ndSvpIaRegex1);
                if (ndMatch && ndMatch[1]) {
                    extractedData.nomorNdSvpIa = ndMatch[1].trim().replace(/\s+/g, ''); // Remove spaces within the number
                } else {
                    // Fallback: Look for the pattern C.Tel.XXX/UM... directly, common in headers
                    const ndSvpIaRegex2 = /\b(C\.Tel\.[A-Z0-9./-]+\/[A-Z0-9./-]+\/[A-Z0-9./-]+\/\d{4})\b/i;
                    ndMatch = bodyText.match(ndSvpIaRegex2);
                    if (ndMatch && ndMatch[1]) {
                        extractedData.nomorNdSvpIa = ndMatch[1].trim();
                    }
                }
            } catch (e) {
                console.error("Asisten NDE: Error saat ekstraksi Nomor ND SVP IA:", e);
            }

            // Ekstraksi Deskripsi ND SVP IA (Perihal)
            try {
                const perihalStartKeywords = [
                    "Perihal\t:", // From user log
                    "Perihal \t:", // Variation with space
                    "Perihal:",
                    "Perihal :",
                    "Hal :",
                    "Hal:"
                ];
                // Perihal is usually a single line. End before the main content starts.
                // Common follow-ups: Kepada Yth, Dengan hormat, Menunjuk, line breaks.
                // For a simple single-line perihal:
                const perihalEndKeywords = ["Lampiran:", "Kepada Yth", "Dengan hormat", "Menunjuk"];
                const perihalText = getTextBetweenKeywords(bodyText, perihalStartKeywords, perihalEndKeywords);
                if (perihalText) {
                    extractedData.deskripsiNdSvpIa = perihalText.trim();
                }
            } catch (e) {
                console.error("Asisten NDE: Error saat ekstraksi Deskripsi ND SVP IA:", e);
            }

            // Ekstraksi Tanggal ND SVP IA
            // "Tanggal diisi tanggal surat (biasanya ada di akhir)"
            // "kalo tanggal ya cari aja yg formatnya kayak tanggal, semua format tanggal"
            try {
                const dateRegexes = [
                    /\b(0?[1-9]|[12][0-9]|3[01])\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})\b/gi, // DD MMMM YYYY
                    /\b(0?[1-9]|[12][0-9]|3[01])[-/](0?[1-9]|1[0-2])[-/](\d{4})\b/gi, // DD-MM-YYYY or DD/MM/YYYY
                    /\b(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(0?[1-9]|[12][0-9]|3[01]),?\s+(\d{4})\b/gi // MMMM DD, YYYY
                ];

                let lastFoundDate = null;
                let lastFoundDateIndex = -1;

                for (const regex of dateRegexes) {
                    let match;
                    while ((match = regex.exec(bodyText)) !== null) {
                        if (match.index > lastFoundDateIndex) {
                            lastFoundDateIndex = match.index;
                            // Reconstruct the date from match groups to ensure consistent format if possible,
                            // or just use match[0] which is the full matched string.
                            // For simplicity here, using match[0] as popup.js has a formatter.
                            lastFoundDate = match[0];
                        }
                    }
                }
                if (lastFoundDate) {
                    // Normalize common month names for consistency if needed, though popup.js handles some.
                    // Example: Agustus -> Agustus, Agt -> Agustus (not done here, popup.js handles specific Indonesian month names)
                    extractedData.tanggalNdSvpIa = lastFoundDate.trim();
                }
            } catch (e) {
                console.error("Asisten NDE: Error saat ekstraksi Tanggal ND SVP IA:", e);
            }

            // Helper function to extract a number following a keyword
            function extractNumberAfterKeyword(text, keyword, searchWindowChars = 50) {
                const lowerText = text.toLowerCase();
                const keywordLower = keyword.toLowerCase();
                let keywordIndex = lowerText.indexOf(keywordLower);

                if (keywordIndex === -1) return 0; // Keyword not found

                const searchStartIndex = keywordIndex + keyword.length;
                const searchArea = text.substring(searchStartIndex, searchStartIndex + searchWindowChars);

                // Regex to find the first number, possibly after colon, space, or in parentheses
                const numberMatch = searchArea.match(/(?:[:\(\s-]*?)(\d+)/);
                if (numberMatch && numberMatch[1]) {
                    return parseInt(numberMatch[1], 10);
                }
                return 0; // No number found in search area
            }

            // Ekstraksi MTL Closed, Reschedule, Overdue, OnSchedule
            try {
                // Attempt to extract a specific number associated with "closed"
                extractedData.mtlClosed = extractNumberAfterKeyword(bodyText, "closed");

                // If no specific number was found (mtlClosed is 0 from helper)
                // but the word "closed" exists, set mtlClosed to 1.
                if (extractedData.mtlClosed === 0 && bodyText.toLowerCase().includes("closed")) {
                    extractedData.mtlClosed = 1;
                }

                extractedData.reschedule = extractNumberAfterKeyword(bodyText, "Reschedule");
                extractedData.overdue = extractNumberAfterKeyword(bodyText, "Overdue");
                extractedData.onSchedule = extractNumberAfterKeyword(bodyText, "OnSchedule");
            } catch (e) {
                console.error("Asisten NDE: Error saat ekstraksi data numerik (MTL Closed, etc.):", e);
            }

            // Menentukan Status berdasarkan nilai Reschedule, OnSchedule, Overdue
            // Asumsi: Jika salah satu dari ini > 0, itu menentukan status. Prioritas: Reschedule > OnSchedule > Overdue.
            try {
                if (extractedData.reschedule > 0) {
                    extractedData.status = "Reschedule";
                } else if (extractedData.onSchedule > 0) {
                    extractedData.status = "OnSchedule";
                } else if (extractedData.overdue > 0) {
                    extractedData.status = "Overdue";
                }
                // Else, status remains "Data belum ditemukan" or its default from initialization
            } catch (e) {
                console.error("Asisten NDE: Error saat menentukan Status:", e);
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
