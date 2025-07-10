// content.js - Final Proactive Version
console.log("Asisten NDE [Penjaga] aktif pada document_start.");

// ===================================================================================
// BAGIAN 1: PENJAGA SANDBOX (MUTATION OBSERVER)
// Tugasnya: memantau dan menghapus atribut 'sandbox' dari iframe yang baru dibuat.
// ===================================================================================

const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                // Cek jika node yang baru ditambahkan adalah iframe
                if (node.nodeName === 'IFRAME' && node.hasAttribute('sandbox')) {
                    node.removeAttribute('sandbox');
                    console.log("Penjaga: Atribut 'sandbox' telah dihapus dari iframe.");
                }
                // Cek juga jika iframe ada di dalam node yang lebih besar (nested)
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

// Mulai mengamati seluruh dokumen dari awal untuk setiap perubahan
observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});


// ===================================================================================
// BAGIAN 2: FUNGSI BANTU (HELPER FUNCTIONS)
// ===================================================================================

function indoDateToISO(dateStr) {
    if (!dateStr) return '';
    const months = {
        "Januari": "01", "Februari": "02", "Maret": "03", "April": "04", 
        "Mei": "05", "Juni": "06", "Juli": "07", "Agustus": "08", 
        "September": "09", "Oktober": "10", "November": "11", "Desember": "12"
    };
    const match = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
    if (!match) return dateStr;
    const [_, day, monthName, year] = match;
    const month = months[monthName];
    if (!month) return dateStr;
    return `${year}-${month}-${day.padStart(2, '0')}`;
}

function extractTextBetween(startKeyword, endKeyword, textBlock) {
    const regex = new RegExp(`${startKeyword}([\\s\\S]*?)${endKeyword}`, 'i');
    const match = textBlock.match(regex);
    return match && match[1] ? match[1].replace(/^[:：\s-]+/, '').trim() : '';
}

function findLineByKeywords(keywords, textBlock) {
    if (!textBlock) return '';
    const lines = textBlock.split('\n');
    for (const line of lines) {
        for (const keyword of keywords) {
            if (line.toLowerCase().includes(keyword.toLowerCase())) {
                return line.trim();
            }
        }
    }
    return '';
}

function findLineByRegex(regex, textBlock) {
    if (!textBlock) return '';
    const match = textBlock.match(regex);
    return match ? match[0].trim() : '';
}

function ringkasTeks(text) {
    if (!text) return '';
    const ringkasan = text.substring(0, 250);
    return ringkasan.length === 250 ? ringkasan + '...' : ringkasan;
}

function parseListFromString(textBlock) {
    if (!textBlock || typeof textBlock !== 'string') {
        return ["Data belum ditemukan"];
    }

    if (!textBlock || typeof textBlock !== 'string') {
        return ["Data belum ditemukan"];
    }

    const trimmedTextBlock = textBlock.trim();
    if (!trimmedTextBlock) {
        return ["Data belum ditemukan"];
    }

    const lines = trimmedTextBlock.split('\n');
    const listItems = [];
    let currentItemBuffer = []; // Buffer for lines that might belong to one item

    const actionVerbPattern = "(?:Melakukan|Meningkatkan|Merevisi|Menggunakan|Menindaklanjuti|Memastikan|Mengembangkan|Menyusun|Menetapkan|Mengimplementasikan|Mengintegrasikan|Mengoptimalkan|Mengevaluasi|Mensosialisasikan)";
    const newItemStartRegex = new RegExp(
        `^\\s*(?:(?:[-*•–]|\\d+[.)]|[a-zA-Z][.)])\\s+|${actionVerbPattern}\\s+|DT\\s+)`,
        "i"
    );
    const ofiItemRegex = /;\s*$/;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        if (/^\(sudah ditindaklanjuti,\s*closed\)$/i.test(trimmedLine)) continue;

        if (ofiItemRegex.test(trimmedLine)) {
            if (currentItemBuffer.length > 0) {
                listItems.push(currentItemBuffer.join('\n').trim());
            }
            listItems.push(trimmedLine);
            currentItemBuffer = [];
        } else if (newItemStartRegex.test(trimmedLine)) {
            if (currentItemBuffer.length > 0) {
                listItems.push(currentItemBuffer.join('\n').trim());
            }
            currentItemBuffer = [trimmedLine];
        } else {
            if (currentItemBuffer.length > 0) {
                currentItemBuffer.push(trimmedLine);
            } else {
                currentItemBuffer = [trimmedLine];
            }
        }
    }

    if (currentItemBuffer.length > 0) {
        listItems.push(currentItemBuffer.join('\n').trim());
    }

    const finalItems = listItems.filter(item => item && item.length > 0 && item.toLowerCase() !== "data belum ditemukan");

    return finalItems.length > 0 ? finalItems : [trimmedTextBlock];
}


// ===================================================================================
// BAGIAN 3: LISTENER EKSTRAKSI DATA UNIVERSAL
// ===================================================================================

// content.js for NDE Data Extraction

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDataFromNDE") {
    console.log("Asisten NDE: Menerima permintaan getDataFromNDE.");

    let extractedData = {
      noSPK: "Data belum ditemukan",
      kelompok: "Data belum ditemukan",
      code: "Data belum ditemukan",
      masaPenyelesaianPekerjaan: "Data belum ditemukan",
      matriksProgram: "Data belum ditemukan",
      tanggalMatriks: "Data belum ditemukan",
      nomorNdSvpIa: "Data belum ditemukan",
      deskripsiNdSvpIa: "Data belum ditemukan",
      tanggalNdSvpIa: "Data belum ditemukan",
      temuanNdSvpIa: ["Data belum ditemukan"], // Initialize as array
      rekomendasiNdSvpIa: ["Data belum ditemukan"], // Initialize as array
      nomorNdDirut: "Data belum ditemukan",
      deskripsiNdDirut: "Data belum ditemukan",
      tanggalNdDirut: "Data belum ditemukan",
      temuanNdDirut: ["Data belum ditemukan"], // Initialize as array
      rekomendasiNdDirut: ["Data belum ditemukan"], // Initialize as array
      duedateNdDirut: "Data belum ditemukan",
      picNdDirut: "Data belum ditemukan",
      uicNdDirut: "Data belum ditemukan",
      mtlClosed: 0,
      reschedule: 0,
      overdue: 0,
      onSchedule: 0,
      status: "Data belum ditemukan",
      pengirim: "Data belum ditemukan",
      idLampiran: "Data belum ditemukan"
    };

    const cleanText = (text) => text ? text.replace(/\s+/g, ' ').trim() : "Data belum ditemukan";

    const getTextFromTable = (shadowContent, label) => {
      try {
        const element = Array.from(shadowContent.querySelectorAll('table tbody tr td'))
          .find(td => td.textContent.trim().toLowerCase() === label.toLowerCase());
        if (element && element.nextElementSibling && element.nextElementSibling.nextElementSibling) {
          return cleanText(element.nextElementSibling.nextElementSibling.textContent);
        }
      } catch (e) {
        console.warn(`Error ekstraksi untuk label '${label}':`, e);
      }
      return "Data belum ditemukan";
    };

    const tryExtract = (shadowContent, data) => {
      console.log("Memulai tryExtract di dalam Shadow DOM.");

      data.nomorNdSvpIa = getTextFromTable(shadowContent, "nomor");
      data.deskripsiNdSvpIa = getTextFromTable(shadowContent, "perihal");

      try {
        const isisuratElement = shadowContent.querySelector('.isisurat');
        if (isisuratElement) {
          const bodyTextInShadow = isisuratElement.innerText || "";
          const pejabatIndicator = "Nama Pejabat";
          let relevantText = bodyTextInShadow;
          const pejabatIndex = bodyTextInShadow.indexOf(pejabatIndicator);
          if (pejabatIndex !== -1) {
            relevantText = bodyTextInShadow.substring(0, pejabatIndex);
          }
          
          const dateRegex = /(?:[\w\s]+,\s*)?(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})/i;
          const matches = relevantText.match(new RegExp(dateRegex.source, 'gi')); 

          if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const finalDateMatch = lastMatch.match(dateRegex);
            if (finalDateMatch && finalDateMatch[1]) {
              data.tanggalNdSvpIa = cleanText(finalDateMatch[1]);
            }
          }
        }
      } catch (e) { console.warn("Error ekstraksi Tanggal ND SVP IA:", e); }

      const fullTextContent = (shadowContent.querySelector('.isisurat')?.innerText || "");
      const fullTextContentLowerCase = fullTextContent.toLowerCase();

      try {
        const spkRegexDetailed = /(?:Surat Perintah Kerja|SPK)(?:\s*\(SPK\))?\s*(?:Nomor|No\.?)\s*[:\s-]*([\w\/.-]+(?:\/[\w.-]+)*)/i;
        const spkMatch = fullTextContent.match(spkRegexDetailed);
        if (spkMatch && spkMatch[1]) {
            data.noSPK = cleanText(spkMatch[1].toUpperCase());
        } else {
            const spkRegexOld = /spk\s*(?:no\.?|nomor)?\s*[:\-\s]*([\w\/\.\-\s]+)/i;
            const spkMatchOld = fullTextContentLowerCase.match(spkRegexOld);
            if (spkMatchOld && spkMatchOld[1]) {
                const originalTextMatch = fullTextContent.substring(spkMatchOld.index, spkMatchOld.index + spkMatchOld[0].length);
                const valueMatchOriginalCase = originalTextMatch.match(spkRegexOld);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    const potentialSPK = valueMatchOriginalCase[1].split(/[\n\r]| {2,}/)[0];
                    data.noSPK = cleanText(potentialSPK.toUpperCase());
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi No SPK:", e); }
      
      try {
        const masaRegex = /masa\s+penyelesaian\s+pekerjaan\s*[:\-\s]*([\w\s\d\.\-\/]+)(?:\n|$)/i;
        const masaMatchKeywords = fullTextContentLowerCase.match(masaRegex);
        if (masaMatchKeywords && masaMatchKeywords[1]) {
            const actualTextPortion = fullTextContent.substring(masaMatchKeywords.index, masaMatchKeywords.index + masaMatchKeywords[0].length);
            const valueMatchOriginalCase = actualTextPortion.match(masaRegex);
            if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                data.masaPenyelesaianPekerjaan = cleanText(valueMatchOriginalCase[1]);
            } else {
                data.masaPenyelesaianPekerjaan = cleanText(masaMatchKeywords[1]);
            }
        }
      } catch (e) { console.warn("Error ekstraksi Masa Penyelesaian Pekerjaan:", e); }

      // Temuan ND SVP IA (OFI) and Rekomendasi ND SVP IA
      try {
        let ofiTextContent = null;
        let rekomendasiTextContent = null;
        let rekomendasiLinkedToOFI = false; // This variable might need to be re-evaluated based on new structure.

        // OFI (Temuan) Extraction
        const ofiKeywords = ["opportunities for improvement\\s*\\(ofi\\)", "ofi", "temuan"];
        const ofiSectionRegex = new RegExp(
            `(?:${ofiKeywords.join('|')})` +
            `[^\\n]*?sebagai berikut:\\s*` +
            `([\\s\\S]*?)` +
            `(?=\\n\\s*Terhadap OFI tersebut, kami menyampaikan rekomendasi|\\n\\s*Permasalahan di atas telah kami klarifikasi|\\n\\n[\\w\\s]{15,}|$)`,
            "i"
        );
        const ofiMatch = fullTextContent.match(ofiSectionRegex);

        if (ofiMatch && ofiMatch[1] && ofiMatch[1].trim().length > 0) { // Changed length check to > 0 for safety
            ofiTextContent = ofiMatch[1].trim(); // .substring(0, 2000) can be applied after parsing if needed
            data.temuanNdSvpIa = parseListFromString(ofiTextContent);
            console.log("[content.js] OFI section identified by primary regex. Raw:", ofiTextContent.substring(0,100), "Parsed:", data.temuanNdSvpIa);
        } else {
            console.log("[content.js] OFI section not clearly identified by primary regex. Attempting fallback.");
            const ofiFallbackKeywords = ["temuan audit", "hasil pemeriksaan", "opportunities for improvement", "ofi", "temuan"];
            // Simplified fallback regex, looking for keyword then colon/newline, then content until "rekomendasi" or "tindak lanjut"
            const ofiFallbackRegex = new RegExp(`(?:${ofiFallbackKeywords.join('|')})\\s*[:\\n\\s.-]+([\\s\\S]*?)(?=(?:(?:\\n|^)\\s*(?:rekomendasi|kami menyampaikan rekomendasi|tindak lanjut|action plan|permasalahan di atas))|\\n\\n[\\w\\s]{10,}|\\Z)`, "i");
            const temuanFallbackMatch = fullTextContent.match(ofiFallbackRegex);
            if (temuanFallbackMatch && temuanFallbackMatch[1] && temuanFallbackMatch[1].trim()) {
                ofiTextContent = temuanFallbackMatch[1].trim();
                data.temuanNdSvpIa = parseListFromString(ofiTextContent);
                console.log("[content.js] Found Temuan ND SVP IA using fallback search. Raw:", ofiTextContent.substring(0,100), "Parsed:", data.temuanNdSvpIa);
            } else {
                console.log("[content.js] OFI / Temuan section not found with any regex.");
                data.temuanNdSvpIa = ["Data belum ditemukan"];
            }
        }

        // Rekomendasi Extraction (should run regardless of OFI found directly above it, but ensure it doesn't overlap)
        // It's better to search for Rekomendasi independently from the full text or a relevant starting point.
        const rekomendasiGlobalKeywords = ["Terhadap OFI tersebut, kami menyampaikan rekomendasi", "kami menyampaikan rekomendasi", "rekomendasi"];
        // Look for a more specific start for recommendations.
        const rekGlobalRegex = new RegExp(
            `(?:${rekomendasiGlobalKeywords.join('|')})[^\\n]*?(?:DT agar:|manajemen agar:|sebagai berikut:|[:\\n\\s.-]+)` + // Consume rest of header line or up to colon
            `([\\s\\S]*?)` + // Capture group 1: Rekomendasi items
            `(?=\\n\\s*Permasalahan di atas telah kami klarifikasi|\\n\\s*Demikian disampaikan|\\n\\n[\\w\\s]{15,}|$)`, // Positive lookahead for end
            "i"
        );
        const rekMatchGlobal = fullTextContent.match(rekGlobalRegex);

        if (rekMatchGlobal && rekMatchGlobal[1] && rekMatchGlobal[1].trim().length > 0) {
            rekomendasiTextContent = rekMatchGlobal[1].trim();
            data.rekomendasiNdSvpIa = parseListFromString(rekomendasiTextContent);
            console.log(`[content.js] Rekomendasi Extracted (len: ${rekomendasiTextContent.length}): "${rekomendasiTextContent.substring(0, 100)}..." Parsed:`, data.rekomendasiNdSvpIa);
        } else {
            console.log("[content.js] Rekomendasi section not clearly identified by global regex.");
             // Keep existing fallback if truly needed, but global should be more robust
            let isRekomendasiStillDefault = (Array.isArray(data.rekomendasiNdSvpIa) && data.rekomendasiNdSvpIa.length === 1 && data.rekomendasiNdSvpIa[0] === "Data belum ditemukan");
            if (isRekomendasiStillDefault) { // Only run if not found by global
                const standaloneRekKeywords = ["rekomendasi", "saran perbaikan"]; // Simplified
                const standaloneRekRegex = new RegExp(`(?:${standaloneRekKeywords.join('|')})\\s*[:\\n\\s.-]+([\\s\\S]*?)(?=(?:tindak\\s+lanjut|penutup|hormat kami|demikian|permasalahan di atas)|\\n\\n[\\w\\s]{10,}|\\Z)`, "i");
                const standaloneRekMatch = fullTextContent.match(standaloneRekRegex);
                if (standaloneRekMatch && standaloneRekMatch[1] && standaloneRekMatch[1].trim()) {
                    rekomendasiTextContent = standaloneRekMatch[1].trim();
                    data.rekomendasiNdSvpIa = parseListFromString(rekomendasiTextContent);
                    console.log("[content.js] Found Rekomendasi ND SVP IA using standalone fallback search. Parsed:", data.rekomendasiNdSvpIa);
                } else {
                    data.rekomendasiNdSvpIa = ["Data belum ditemukan"];
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Temuan/Rekomendasi ND SVP IA:", e); data.temuanNdSvpIa = data.temuanNdSvpIa || ["Data belum ditemukan"]; data.rekomendasiNdSvpIa = data.rekomendasiNdSvpIa || ["Data belum ditemukan"]; }

      // Nomor ND SVP IA (refined - already uses getTextFromTable, but if not found, try keywords)
      if (data.nomorNdSvpIa === "Data belum ditemukan") {
        const nomorKeywords = ["nomor nd", "nota dinas", "no.", "nomor"];
        for (const keyword of nomorKeywords) {
            const valuePattern = "([A-Z0-9\\/\\.\\-\\s]*[A-Z0-9\\/][A-Z0-9\\/\\.\\-\\s]*)";
            let regex;
            if (keyword === "nomor") {
                 regex = new RegExp(`${keyword}\\s*[:\\s]*${valuePattern}(?=\\s|\\n|$)`, "i");
            } else {
                 regex = new RegExp(`${keyword}\\s*[:\\s]*([A-Z0-9\\/\\.\\-\\s]+[A-Z0-9])`, "i");
            }
            const matchKeywords = fullTextContentLowerCase.substring(0, Math.min(fullTextContentLowerCase.length, 600)).match(regex);
            if (matchKeywords && matchKeywords[1] && matchKeywords[1].length > 5 ) {
                const originalTextPortion = fullTextContent.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.nomorNdSvpIa = cleanText(valueMatchOriginalCase[1].replace(/\s+/g, ' ').trim());
                    break;
                }
            }
        }
      }
      // Deskripsi ND SVP IA (Perihal) (refined - already uses getTextFromTable, but if not found, try keywords)
      if (data.deskripsiNdSvpIa === "Data belum ditemukan") {
        const perihalKeywords = ["perihal", "subject", "hal"];
        for (const keyword of perihalKeywords) {
            const regex = new RegExp(`(?:^|\\n)${keyword}\\s*[:\\s]*([^\\n]+)`, "i");
            const matchKeywords = fullTextContentLowerCase.substring(0, Math.min(fullTextContentLowerCase.length, 700)).match(regex);
            if (matchKeywords && matchKeywords[1]) {
                const originalTextPortion = fullTextContent.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.deskripsiNdSvpIa = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }
      }

      // CODE
      try {
        const codeKeywords = ["kode", "code", "audit code", "kode temuan", "project code"];
        for (const keyword of codeKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([\\w\\/\\.\\-]+)`, "i");
            const matchKeywords = fullTextContentLowerCase.match(regex);
            if (matchKeywords && matchKeywords[1]) {
                const originalTextPortion = fullTextContent.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                const valueMatchOriginalCase = originalTextPortion.match(regex);
                 if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.code = cleanText(valueMatchOriginalCase[1].toUpperCase());
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi CODE:", e); }

      // Matriks Program & Tanggal Matriks
      try {
        const matriksKeywords = ["matriks program", "program kerja audit tahunan", "pkat", "pknat", "audit tahunan", "matriks"];
        for (const keyword of matriksKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n]+)(?:.*tanggal\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4}))?`, "i");
            const matchKeywords = fullTextContentLowerCase.match(regex);
            if (matchKeywords && matchKeywords[1]) {
                const originalTextPortion = fullTextContent.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.matriksProgram = cleanText(valueMatchOriginalCase[1]);
                    if (valueMatchOriginalCase[2]) {
                        data.tanggalMatriks = cleanText(valueMatchOriginalCase[2]);
                    }
                    break;
                }
            }
        }
        if (data.tanggalMatriks === "Data belum ditemukan") {
            const tglMatriksKeywords = ["tanggal matriks", "tanggal pkat", "tanggal pknat"];
             for (const keyword of tglMatriksKeywords) {
                const regex = new RegExp(`${keyword}\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})`, "i");
                const matchKeywords = fullTextContentLowerCase.match(regex);
                if (matchKeywords && matchKeywords[1]) {
                    const originalTextPortion = fullTextContent.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                    const valueMatchOriginalCase = originalTextPortion.match(regex);
                    if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                        data.tanggalMatriks = cleanText(valueMatchOriginalCase[1]);
                        break;
                    }
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Matriks Program/Tanggal Matriks:", e); }

      // Kelompok
      try {
        const kelompokKeywords = ["kelompok temuan", "jenis temuan", "kategori temuan", "kelompok:"];
        for (const keyword of kelompokKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n]+)`, "i");
            const matchKeywords = fullTextContentLowerCase.match(regex);
            if (matchKeywords && matchKeywords[1]) {
                 const originalTextPortion = fullTextContent.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                 const valueMatchOriginalCase = originalTextPortion.match(regex);
                 if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.kelompok = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Kelompok:", e); }

      // --- ND DIRUT Fields ---
      const ndDirutContextRegex = /nota dinas direktur utama|nd dirut|kepada direktur utama/i;
      const dirutSectionMatch = fullTextContentLowerCase.match(ndDirutContextRegex);
      let dirutText = fullTextContent;
      let dirutTextLowerCase = fullTextContentLowerCase;

      if (dirutSectionMatch) {
          dirutText = fullTextContent.substring(dirutSectionMatch.index);
          dirutTextLowerCase = fullTextContentLowerCase.substring(dirutSectionMatch.index);
      }

      try { // Nomor ND Dirut
        const nomorNdDirutKeywords = ["nomor nd dirut", "nd dirut nomor"];
        for (const keyword of nomorNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([\\w\\/\\.\\-]+)`, "i");
            const matchKeywords = dirutTextLowerCase.match(regex);
            if (matchKeywords && matchKeywords[1]) {
                const originalTextPortion = dirutText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.nomorNdDirut = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Nomor ND Dirut:", e); }

      try { // Deskripsi ND Dirut
        const deskripsiNdDirutKeywords = ["perihal nd dirut", "hal nd dirut"];
         for (const keyword of deskripsiNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n]+)`, "i");
            const matchKeywords = dirutTextLowerCase.match(regex);
            if (matchKeywords && matchKeywords[1]) {
                 const originalTextPortion = dirutText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                 const valueMatchOriginalCase = originalTextPortion.match(regex);
                 if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.deskripsiNdDirut = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Deskripsi ND Dirut:", e); }

      try { // Tanggal ND Dirut
        const tanggalNdDirutKeywords = ["tanggal nd dirut"];
         for (const keyword of tanggalNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})`, "i");
            const matchKeywords = dirutTextLowerCase.match(regex);
            if (matchKeywords && matchKeywords[1]) {
                 const originalTextPortion = dirutText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                 const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.tanggalNdDirut = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Tanggal ND Dirut:", e); }

      try { // Temuan ND Dirut
        const temuanNdDirutKeywords = ["temuan nd dirut", "ofi dirut"];
        for (const keyword of temuanNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:rekomendasi nd dirut|rekomendasi dirut|tindak lanjut dirut|\\n\\n[\\w\\s]{15,}|\\Z))`, "i");
            const match = dirutText.match(regex); // Match on original case dirutText
            if (match && match[1] && match[1].trim()) {
                data.temuanNdDirut = parseListFromString(match[1].substring(0, 1000));
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Temuan ND Dirut:", e); }

      try { // Rekomendasi ND Dirut
        const rekomendasiNdDirutKeywords = ["rekomendasi nd dirut", "rekomendasi dirut"];
         for (const keyword of rekomendasiNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:pic dirut|uic dirut|due date dirut|tindak lanjut|penutup|hormat kami|demikian|\\n\\n[\\w\\s]{15,}|\Z))`, "i");
            const match = dirutText.match(regex); // Match on original case dirutText
            if (match && match[1] && match[1].trim()) {
                data.rekomendasiNdDirut = parseListFromString(match[1].substring(0, 1000));
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Rekomendasi ND Dirut:", e); }

      try { // Duedate ND Dirut
        const duedateKeywords = ["paling lambat", "due\\s*date", "target penyelesaian", "tindak lanjut.*(?:tanggal|target)"];
        const duedateContextRegex = new RegExp(`(?:rencana tindak lanjut|action plan).*nd dirut([\\s\\S]*?)(?:\\n\\n|$)`, "i");
        let duedateSearchText = dirutText;
        let duedateSearchTextLowerCase = dirutTextLowerCase;
        const duedateContextMatch = dirutTextLowerCase.match(duedateContextRegex);
        if (duedateContextMatch && duedateContextMatch[1]) {
            duedateSearchText = dirutText.substring(dirutTextLowerCase.indexOf(duedateContextMatch[1]));
        }

        for (const keyword of duedateKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*((?:\\d{1,2}\\s+\\w+\\s+\\d{4})|[^\\n\\.,]+(?:minggu|bulan|hari|triwulan|semester|tahun))`, "i");
            const matchKeywords = duedateSearchText.toLowerCase().match(regex); // Match keyword on lowercase segment
            if (matchKeywords && matchKeywords[1]) {
                 const originalTextPortion = duedateSearchText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                 const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.duedateNdDirut = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Duedate ND Dirut:", e); }

      try { // PIC ND Dirut & UIC ND Dirut
        const picKeywords = ["pic", "penanggung jawab", "auditee", "manajemen terkait"];
        const uicKeywords = ["uic", "unit kerja", "divisi", "direktorat"];
        const actionPlanContextRegex = /(?:rekomendasi nd dirut|tindak lanjut nd dirut)([\s\S]*?)(?:\n\n\w{5,}|\Z)/i;
        let actionPlanText = dirutText;
        const actionPlanMatch = dirutTextLowerCase.match(actionPlanContextRegex);
        if(actionPlanMatch && actionPlanMatch[1]) {
            actionPlanText = dirutText.substring(dirutTextLowerCase.indexOf(actionPlanMatch[1]));
        }

        for (const keyword of picKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n,]+)`, "i");
            const matchKeywords = actionPlanText.toLowerCase().match(regex);
            if (matchKeywords && matchKeywords[1]) {
                const originalTextPortion = actionPlanText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                const valueMatchOriginalCase = originalTextPortion.match(regex);
                if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                    data.picNdDirut = cleanText(valueMatchOriginalCase[1]);
                    break;
                }
            }
        }

        if(data.uicNdDirut === "Data belum ditemukan"){ // UIC Search
            for (const keyword of uicKeywords) {
                const regex = new RegExp(`(?:${keyword}|kepada\\s*[:\\s-]*ykh\\.?\\s*([^\\n]+(?:${uicKeywords.join('|')})[^\\n]*))`, "i");
                const headerText = fullTextContent.substring(0, Math.min(fullTextContent.length, 1000));
                const matchKeywords = headerText.toLowerCase().match(regex);

                if (matchKeywords && matchKeywords[1]) {
                     const originalTextPortion = headerText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                     const valueMatchOriginalCase = originalTextPortion.match(regex);
                     if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                        data.uicNdDirut = cleanText(valueMatchOriginalCase[1].replace(/ykh\.?\s*/i, ''));
                        break;
                     }
                } else if (matchKeywords && matchKeywords[0].toLowerCase().includes(keyword)) {
                     const simpleRegex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n,]+)`, "i");
                     const simpleMatchKeywords = headerText.toLowerCase().match(simpleRegex);
                     if(simpleMatchKeywords && simpleMatchKeywords[1]){
                        const simpleOriginalPortion = headerText.substring(simpleMatchKeywords.index, simpleMatchKeywords.index + simpleMatchKeywords[0].length);
                        const simpleValueOriginal = simpleOriginalPortion.match(simpleRegex);
                        if (simpleValueOriginal && simpleValueOriginal[1]) {
                            data.uicNdDirut = cleanText(simpleValueOriginal[1]);
                            break;
                        }
                     }
                }
            }
        }
        if(data.uicNdDirut === "Data belum ditemukan"){ // Fallback UIC in actionPlanText
            for (const keyword of uicKeywords) {
                const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n,]+)`, "i");
                const matchKeywords = actionPlanText.toLowerCase().match(regex);
                if (matchKeywords && matchKeywords[1]) {
                    const originalTextPortion = actionPlanText.substring(matchKeywords.index, matchKeywords.index + matchKeywords[0].length);
                    const valueMatchOriginalCase = originalTextPortion.match(regex);
                    if (valueMatchOriginalCase && valueMatchOriginalCase[1]) {
                        data.uicNdDirut = cleanText(valueMatchOriginalCase[1]);
                        break;
                    }
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi PIC/UIC ND Dirut:", e); }

      // --- Set flags based on textual cues ---
      try {
        const closedKeywords = ["closed", "selesai", "sudah ditindaklanjuti", "telah diselesaikan"];
        const latterHalfText = fullTextContentLowerCase.substring(Math.floor(fullTextContentLowerCase.length / 2));
        if (closedKeywords.some(kw => latterHalfText.includes(kw))) {
            data.mtlClosed = 1;
        }
      } catch(e) { console.warn("Error checking for MTL Closed keywords:", e); }

      try {
        const rescheduleKeywords = ["reschedule", "dijadwalkan ulang", "penyesuaian waktu"];
        if (rescheduleKeywords.some(kw => fullTextContentLowerCase.includes(kw))) {
            data.reschedule = 1;
        }
      } catch(e) { console.warn("Error checking for Reschedule keywords:", e); }

      try {
        const overdueKeywords = ["overdue", "terlambat", "lewat deadline"];
        if (overdueKeywords.some(kw => fullTextContentLowerCase.includes(kw))) {
            data.overdue = 1;
        }
      } catch(e) { console.warn("Error checking for Overdue keywords:", e); }

      // --- Derive Status field ---
      if (data.mtlClosed === 1) {
        data.status = "Closed";
      } else if (data.overdue === 1) {
        data.status = "Overdue";
      } else if (data.reschedule === 1) {
        data.status = "Reschedule";
      } else {
        const hasAnySignificantData = Object.entries(data).some(([key, value]) => {
            if (["temuanNdSvpIa", "rekomendasiNdSvpIa", "temuanNdDirut", "rekomendasiNdDirut"].includes(key)) {
                return Array.isArray(value) && !(value.length === 1 && value[0] === "Data belum ditemukan");
            }
            return value !== "Data belum ditemukan" && value !== "" && value !== 0;
        });
        if (hasAnySignificantData && data.status === "Data belum ditemukan") {
             data.status = "OnSchedule";
             data.onSchedule = 1;
        }
      }
      console.log("Ekstraksi selesai dalam tryExtract.");
    }; // End of tryExtract

    // Function to extract data from the new standard HTML structure
    const extractDataFromStandardHTML = (data) => {
      console.log("Asisten NDE: Attempting extraction from standard HTML structure.");

      const bodyFullText = document.body.innerText || "";
      const bodyFullTextLowerCase = bodyFullText.toLowerCase();

      // Nomor Nota (ND SVP IA Nomor)
      try {
        const nomorLabel = Array.from(document.querySelectorAll('.grid .col-span-1.font-semibold'))
                                .find(el => el.textContent.trim().toLowerCase() === "nomor");
        if (nomorLabel && nomorLabel.nextElementSibling) {
          const nomorText = nomorLabel.nextElementSibling.textContent.replace(/^:\s*/, '').trim();
          data.nomorNdSvpIa = cleanText(nomorText);
        } else { data.nomorNdSvpIa = "Data belum ditemukan"; }
      } catch (e) { data.nomorNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Nomor Nota (standard):", e); }

      // Perihal (Deskripsi ND SVP IA)
      try {
        const perihalEl = document.getElementById('perihal');
        if (perihalEl) {
          data.deskripsiNdSvpIa = cleanText(perihalEl.textContent.replace(/^:\s*/, '').trim());
        } else { data.deskripsiNdSvpIa = "Data belum ditemukan"; }
      } catch (e) { data.deskripsiNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Perihal (standard):", e); }
      
      // Dari (Pengirim)
      try {
        const pengirimEl = document.getElementById('pengirim');
        if (pengirimEl) {
          data.pengirim = cleanText(pengirimEl.textContent.replace(/^:\s*/, '').trim());
        } else { data.pengirim = "Data belum ditemukan"; }
      } catch (e) { data.pengirim = "Data belum ditemukan"; console.warn("Error extracting Pengirim (standard):", e); }

      // Tanggal ND SVP IA (Document Date)
      try {
        const dateEl = document.querySelector('main > div.mt-8.text-right');
        if (dateEl) {
          const dateText = dateEl.textContent.trim();
          const dateMatch = dateText.match(/(\d{1,2}\s+\w+\s+\d{4})/);
          if (dateMatch && dateMatch[1]) {
            data.tanggalNdSvpIa = cleanText(dateMatch[1]);
          } else { data.tanggalNdSvpIa = "Data belum ditemukan"; }
        } else { data.tanggalNdSvpIa = "Data belum ditemukan"; }
      } catch (e) { data.tanggalNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Tanggal Document (standard):", e); }

      // Temuan (OFI)
      try {
        let ofiText = "";
        const ofiHeaderElement = Array.from(document.querySelectorAll('ol.list-decimal > li > p > strong, ol.list-decimal > li'))
                                     .find(el => el.textContent.toLowerCase().includes("opportunities for improvement (ofi)"));
        if (ofiHeaderElement) {
            const ofiListItem = ofiHeaderElement.closest('li');
            if (ofiListItem) {
                const ofiList = ofiListItem.querySelector('ol.list-alpha');
                if (ofiList) {
                    const items = Array.from(ofiList.children)
                                       .map(li => li.textContent.trim())
                                       .filter(text => text.length > 0);
                    ofiText = items.map(item => `- ${item}`).join('\n'); // Keep as single string with dashes for now
                }
            }
        }
        data.temuanNdSvpIa = ofiText ? parseListFromString(ofiText) : ["Data belum ditemukan"];
        if(!ofiText) console.warn("Temuan (OFI) not found in standard HTML with specific structure.");
      } catch (e) { data.temuanNdSvpIa = ["Data belum ditemukan"]; console.warn("Error extracting Temuan (OFI) (standard):", e); }

      // Rekomendasi
      try {
        let rekomendasiText = "";
        const rekHeaderElement = Array.from(document.querySelectorAll('ol.list-decimal > li > p > strong, ol.list-decimal > li'))
                                    .find(el => el.textContent.toLowerCase().includes("menyampaikan beberapa rekomendasi"));
        if (rekHeaderElement) {
            const rekListItem = rekHeaderElement.closest('li');
            if (rekListItem) {
                const rekList = rekListItem.querySelector('ol.list-alpha');
                if (rekList) {
                    const items = Array.from(rekList.children)
                                       .map(li => li.textContent.trim())
                                       .filter(text => text.length > 0);
                    rekomendasiText = items.map(item => `- ${item}`).join('\n'); // Keep as single string
                }
            }
        }
        data.rekomendasiNdSvpIa = rekomendasiText ? parseListFromString(rekomendasiText) : ["Data belum ditemukan"];
        if(!rekomendasiText) console.warn("Rekomendasi not found in standard HTML with specific structure.");
      } catch (e) { data.rekomendasiNdSvpIa = ["Data belum ditemukan"]; console.warn("Error extracting Rekomendasi (standard):", e); }
      
      const allTextElements = Array.from(document.querySelectorAll('p, span, div, td, li, h1, h2, h3, h4, strong'));
      const extractValueAfterKeyword = (elements, keywords, regexPattern, contextKeywords = [], isCaseSensitiveValue = false) => {
          for (const el of elements) {
              const elFullText = el.innerText || el.textContent || "";
              if (!elFullText.trim()) continue;

              const elSearchText = isCaseSensitiveValue ? elFullText : elFullText.toLowerCase();

              let foundContext = contextKeywords.length === 0;
              if (!foundContext) {
                  if (contextKeywords.some(ck => elSearchText.includes(ck.toLowerCase()))) {
                      foundContext = true;
                  } else {
                      let parent = el.parentElement;
                      for (let i = 0; i < 3 && parent; i++) {
                          const parentFullText = parent.innerText || parent.textContent || "";
                          if (parentFullText && contextKeywords.some(ck => (isCaseSensitiveValue ? parentFullText : parentFullText.toLowerCase()).includes(ck.toLowerCase()))) {
                              foundContext = true;
                              break;
                          }
                          parent = parent.parentElement;
                      }
                  }
              }
              if (!foundContext) continue;

              for (const keyword of keywords) {
                  const keywordRegex = new RegExp(keyword.toLowerCase() + regexPattern, "i"); // Keyword match always case-insensitive
                  const match = elFullText.match(keywordRegex); // Match on original case text to capture original case value
                  if (match && match[1] && match[1].trim()) {
                      return cleanText(match[1]);
                  }
              }
          }
          return "Data belum ditemukan";
      };

      // Fallbacks using extractValueAfterKeyword if specific selectors failed
      if (data.nomorNdSvpIa === "Data belum ditemukan") {
        const nomorKeywords = ["nomor nd", "nota dinas", "no.", "nomor"];
        const generalPattern = "\\s*[:\\s]*([A-Z0-9\\/\\.\\-\\s]+[A-Z0-9])";
        const specificPatternForNomor = "\\s*[:\\s]*([A-Z0-9\\/\\.\\-\\s]*[A-Z0-9\\/][A-Z0-9\\/\\.\\-\\s]*)";
        for(const keyword of nomorKeywords) {
            let pattern = (keyword === "nomor") ? specificPatternForNomor : generalPattern;
            const found = extractValueAfterKeyword(allTextElements.slice(0, 30), [keyword], pattern, [], true);
            if (found !== "Data belum ditemukan" && found.length > 5) { data.nomorNdSvpIa = found; break; }
        }
      }
      if (data.deskripsiNdSvpIa === "Data belum ditemukan") {
         data.deskripsiNdSvpIa = extractValueAfterKeyword(allTextElements.slice(0,30), ["perihal", "subject", "hal"], "\\s*[:\\s]*([^\\n]+)");
      }
      if (data.tanggalNdSvpIa === "Data belum ditemukan") {
        const footerElements = allTextElements.slice(Math.max(0, allTextElements.length - 30));
        data.tanggalNdSvpIa = extractValueAfterKeyword(footerElements, ["tanggal", ""], "\\s*[:\\s]*(\\d{1,2}\\s+\\w+\\s+\\d{4})");
      }

      if (data.noSPK === "Data belum ditemukan") {
        const spkRegexDetailedStd = /(?:Surat Perintah Kerja|SPK)(?:\s*\(SPK\))?\s*(?:Nomor|No\.?)\s*[:\s-]*([\w\/.-]+(?:\/[\w.-]+)*)/i;
        const spkMatchDetailedStd = bodyFullText.match(spkRegexDetailedStd);
        if (spkMatchDetailedStd && spkMatchDetailedStd[1]) {
          data.noSPK = cleanText(spkMatchDetailedStd[1].toUpperCase());
        } else {
          data.noSPK = extractValueAfterKeyword(allTextElements, ["spk", "surat perintah kerja", "nomor spk"], "\\s*[:\\s]*([\\w\\/\\.\\-]+)", [], true);
        }
      }
      if (data.code === "Data belum ditemukan") {
        data.code = extractValueAfterKeyword(allTextElements, ["kode", "code", "audit code", "kode temuan"], "\\s*[:\\s]*([\\w\\/\\.\\-]+)", [], true).toUpperCase();
      }
      if (data.matriksProgram === "Data belum ditemukan") {
        data.matriksProgram = extractValueAfterKeyword(allTextElements, ["matriks program", "pkat", "pknat", "program kerja audit tahunan"], "\\s*[:\\s-]*([^\\n]+(?:(?:program|matriks)[^\\n]*)?)");
      }
      if (data.tanggalMatriks === "Data belum ditemukan") {
        data.tanggalMatriks = extractValueAfterKeyword(allTextElements, ["tanggal matriks", "tanggal pkat", "tanggal pknat"], "\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})", ["matriks", "pkat", "pknat"]);
      }
      if (data.kelompok === "Data belum ditemukan") {
        data.kelompok = extractValueAfterKeyword(allTextElements, ["kelompok temuan", "jenis temuan", "kategori temuan", "kelompok:"], "\\s*[:\\s-]*([^\\n]+)");
      }
      if (data.masaPenyelesaianPekerjaan === "Data belum ditemukan") {
        data.masaPenyelesaianPekerjaan = extractValueAfterKeyword(allTextElements, ["masa penyelesaian", "batas waktu", "selesai dalam"], "\\s*[:\\s-]*([^\\n]+(?:(?:minggu|bulan|hari)[^\\n]*)?)", ["due date", "target"]);
      }

      // Fallback for Temuan/Rekomendasi if specific list structure wasn't found
      let isTemuanDefaultHTML = (Array.isArray(data.temuanNdSvpIa) && data.temuanNdSvpIa.length === 1 && data.temuanNdSvpIa[0] === "Data belum ditemukan");
      if(isTemuanDefaultHTML) {
          const temuanText = extractValueAfterKeyword(allTextElements, ["temuan", "ofi", "opportunity for improvement"], "\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:rekomendasi|tindak lanjut|\\n\\n[\\w\\s]{15,}|$))");
          if (temuanText !== "Data belum ditemukan") data.temuanNdSvpIa = parseListFromString(temuanText.substring(0,2000));
      }
      let isRekDefaultHTML = (Array.isArray(data.rekomendasiNdSvpIa) && data.rekomendasiNdSvpIa.length === 1 && data.rekomendasiNdSvpIa[0] === "Data belum ditemukan");
      if(isRekDefaultHTML) {
          const rekText = extractValueAfterKeyword(allTextElements, ["rekomendasi", "kami menyampaikan rekomendasi"], "\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:pic|uic|due date|tindak lanjut|penutup|\\n\\n[\\w\\s]{15,}|$))");
          if (rekText !== "Data belum ditemukan") data.rekomendasiNdSvpIa = parseListFromString(rekText.substring(0,2000));
      }

      // ND Dirut Fields
      const dirutContext = ["nd dirut", "direktur utama"];
      if (data.nomorNdDirut === "Data belum ditemukan") {
        data.nomorNdDirut = extractValueAfterKeyword(allTextElements, ["nomor"], "\\s*[:\\s-]*([\\w\\/\\.\\-]+)", dirutContext, true);
      }
      // ... (similar updates for other ND Dirut fields to use extractValueAfterKeyword and parseListFromString for temuan/rekomendasi)
      if (data.deskripsiNdDirut === "Data belum ditemukan") {
        data.deskripsiNdDirut = extractValueAfterKeyword(allTextElements, ["perihal", "hal"], "\\s*[:\\s-]*([^\\n]+)", dirutContext);
      }
      if (data.tanggalNdDirut === "Data belum ditemukan") {
        data.tanggalNdDirut = extractValueAfterKeyword(allTextElements, ["tanggal"], "\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})", dirutContext);
      }
      let isTemuanDirutDefaultHTML = (Array.isArray(data.temuanNdDirut) && data.temuanNdDirut.length === 1 && data.temuanNdDirut[0] === "Data belum ditemukan");
      if(isTemuanDirutDefaultHTML){
          const temuanDirutText = extractValueAfterKeyword(allTextElements, ["temuan", "ofi"], "\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:rekomendasi|tindak lanjut|\\n\\n[\\w\\s]{5,}|pic|uic|due date|$))", dirutContext);
          if(temuanDirutText !== "Data belum ditemukan") data.temuanNdDirut = parseListFromString(temuanDirutText.substring(0,1000));
      }
      let isRekDirutDefaultHTML = (Array.isArray(data.rekomendasiNdDirut) && data.rekomendasiNdDirut.length === 1 && data.rekomendasiNdDirut[0] === "Data belum ditemukan");
      if(isRekDirutDefaultHTML){
          const rekDirutText = extractValueAfterKeyword(allTextElements, ["rekomendasi"], "\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:pic|uic|due date|tindak lanjut|penutup|\\n\\n[\\w\\s]{5,}|$))", dirutContext);
          if(rekDirutText !== "Data belum ditemukan") data.rekomendasiNdDirut = parseListFromString(rekDirutText.substring(0,1000));
      }
      if (data.duedateNdDirut === "Data belum ditemukan") {
        data.duedateNdDirut = extractValueAfterKeyword(allTextElements, ["paling lambat", "due date", "target penyelesaian"], "\\s*[:\\s-]*((?:\\d{1,2}\\s+\\w+\\s+\\d{4})|[^\\n\\.,]+(?:minggu|bulan|hari|triwulan|semester|tahun))", ["rencana tindak lanjut", "action plan"].concat(dirutContext));
      }
      if (data.picNdDirut === "Data belum ditemukan") {
        data.picNdDirut = extractValueAfterKeyword(allTextElements, ["pic", "penanggung jawab"], "\\s*[:\\s-]*([^\\n,]+)", ["rekomendasi", "tindak lanjut"].concat(dirutContext));
      }
      if (data.uicNdDirut === "Data belum ditemukan") {
        data.uicNdDirut = extractValueAfterKeyword(allTextElements.slice(0,30), ["uic", "unit kerja", "kepada yth"], "\\s*[:\\s-]*([^\\n,]+)", dirutContext.length > 0 ? dirutContext : []);
        if (data.uicNdDirut === "Data belum ditemukan") {
             data.uicNdDirut = extractValueAfterKeyword(allTextElements, ["uic", "unit kerja"], "\\s*[:\\s-]*([^\\n,]+)", dirutContext);
        }
      }

      // --- Set flags based on textual cues in Standard HTML ---
      try {
        const closedKeywords = ["closed", "selesai", "sudah ditindaklanjuti", "telah diselesaikan"];
        const footerElementsText = allTextElements.slice(Math.max(0, allTextElements.length - 20)).map(el => (el.innerText || el.textContent || "").toLowerCase()).join(" ");
        if (closedKeywords.some(kw => footerElementsText.includes(kw))) {
            data.mtlClosed = 1;
        }
      } catch(e) { console.warn("Error checking for MTL Closed keywords (standard HTML):", e); }

      try {
        const rescheduleKeywords = ["reschedule", "dijadwalkan ulang", "penyesuaian waktu"];
        if (allTextElements.some(el => rescheduleKeywords.some(kw => (el.innerText || el.textContent || "").toLowerCase().includes(kw)))) {
            data.reschedule = 1;
        }
      } catch(e) { console.warn("Error checking for Reschedule keywords (standard HTML):", e); }

      try {
        const overdueKeywords = ["overdue", "terlambat", "lewat deadline"];
         if (allTextElements.some(el => overdueKeywords.some(kw => (el.innerText || el.textContent || "").toLowerCase().includes(kw)))) {
            data.overdue = 1;
        }
      } catch(e) { console.warn("Error checking for Overdue keywords (standard HTML):", e); }

      // --- Derive Status field for Standard HTML ---
      if (data.mtlClosed === 1) {
        data.status = "Closed";
      } else if (data.overdue === 1) {
        data.status = "Overdue";
      } else if (data.reschedule === 1) {
        data.status = "Reschedule";
      } else {
        const hasAnySignificantData = Object.entries(data).some(([key, value]) => {
            if (["temuanNdSvpIa", "rekomendasiNdSvpIa", "temuanNdDirut", "rekomendasiNdDirut"].includes(key)) {
                return Array.isArray(value) && !(value.length === 1 && value[0] === "Data belum ditemukan");
            }
            return value !== "Data belum ditemukan" && value !== "" && value !== 0;
        });
        if (hasAnySignificantData && data.status === "Data belum ditemukan") {
             data.status = "OnSchedule";
             data.onSchedule = 1;
        }
      }
      console.log("Asisten NDE: Standard HTML extraction attempt complete.");
    }; // End of extractDataFromStandardHTML


    // --- Detection and Execution Logic ---
    const appVirtualDomElement = document.querySelector('app-virtualdom');
    const standardHtmlPerihal = document.getElementById('perihal');
    const standardHtmlPengirim = document.getElementById('pengirim');

    if (appVirtualDomElement && appVirtualDomElement.shadowRoot) {
        console.log("Asisten NDE: app-virtualdom with Shadow DOM found. Proceeding with Shadow DOM extraction.");
        tryExtract(appVirtualDomElement.shadowRoot, extractedData); 
        console.log("Asisten NDE: Data extracted via Shadow DOM:", extractedData);
        sendResponse({ data: extractedData, success: true });
        return true; 
    } else if (standardHtmlPerihal && standardHtmlPengirim) {
        console.log("Asisten NDE: Standard HTML structure detected upfront.");
        extractDataFromStandardHTML(extractedData);
        console.log("Asisten NDE: Data extracted via Standard HTML (upfront):", extractedData);
        sendResponse({ data: extractedData, success: true });
        return true; 
    } else {
        console.log("Asisten NDE: Key markers not immediately found. Setting up MutationObserver.");
        let observerInst = null; // Renamed to avoid conflict with global observer
        let observationTimeout = null;

        const finalizeExtractionAfterObserver = (appVirtualDomWasFound) => {
            if (observationTimeout) clearTimeout(observationTimeout);
            if (observerInst) observerInst.disconnect();
            observerInst = null;

            if (!appVirtualDomWasFound) {
                console.log("Asisten NDE: app-virtualdom not found by observer. Attempting standard HTML extraction as fallback.");
                extractDataFromStandardHTML(extractedData);
            }

            const wasAnythingExtracted = Object.values(extractedData).some(
                val => val !== "Data belum ditemukan" && val !== "" && val !== 0 &&
                       !(Array.isArray(val) && val.length === 1 && val[0] === "Data belum ditemukan")
            );

            if (wasAnythingExtracted) {
                console.log("Asisten NDE: Final extracted data after observer/fallback:", extractedData);
                sendResponse({ data: extractedData, success: true });
            } else {
                console.warn("Asisten NDE: No data extracted after all attempts.");
                sendResponse({ 
                    data: extractedData, 
                    success: false, 
                    message: "Could not identify document structure or extract significant data."
                });
            }
        };
      
        observerInst = new MutationObserver((mutationsList, obs) => {
            const avdElementObserved = document.querySelector('app-virtualdom');
            if (avdElementObserved && avdElementObserved.shadowRoot) {
                console.log("Asisten NDE: app-virtualdom detected by MutationObserver.");
                tryExtract(avdElementObserved.shadowRoot, extractedData);
                finalizeExtractionAfterObserver(true);
            }
        });

        observerInst.observe(document.documentElement, { childList: true, subtree: true });
        console.log("Asisten NDE: MutationObserver for app-virtualdom active.");

        observationTimeout = setTimeout(() => {
            // If observer is still running, it means app-virtualdom wasn't found in time.
             if (observerInst) {
                console.warn("Asisten NDE: MutationObserver timeout reached for app-virtualdom.");
                finalizeExtractionAfterObserver(false);
             }
        }, 10000); // Reduced timeout for faster fallback if needed

        return true;
    }
  } // End of if (request.action === "getDataFromNDE")
}); // End of chrome.runtime.onMessage.addListener

console.log("Content script NDE 'content.js' dimuat dan listener aktif.");

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Ekstensi NDE berhasil diinstal/diupdate.');
  });
}