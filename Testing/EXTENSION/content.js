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

// ===================================================================================
// BAGIAN 3: LISTENER EKSTRAKSI DATA UNIVERSAL
// ===================================================================================

// content.js for NDE Data Extraction

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDataFromNDE") {
    console.log("Asisten NDE: Menerima permintaan getDataFromNDE.");

    let extractedData = {
      noSPK: "Data belum ditemukan",
      noSPK: "Data belum ditemukan", // Existing
      kelompok: "", // Existing - typically from popup/DB, but content.js could try
      code: "Data belum ditemukan", // To be enhanced
      masaPenyelesaianPekerjaan: "Data belum ditemukan", // Existing
      matriksProgram: "Data belum ditemukan", // To be enhanced
      tanggalMatriks: "Databelum ditemukan", // To be enhanced

      nomorNdSvpIa: "Data belum ditemukan", // Existing
      deskripsiNdSvpIa: "Data belum ditemukan", // Existing
      tanggalNdSvpIa: "Data belum ditemukan", // Existing
      temuanNdSvpIa: "Data belum ditemukan", // Existing
      rekomendasiNdSvpIa: "Data belum ditemukan", // Existing

      nomorNdDirut: "Data belum ditemukan", // To be enhanced
      deskripsiNdDirut: "Data belum ditemukan", // To be enhanced
      tanggalNdDirut: "Data belum ditemukan", // To be enhanced
      temuanNdDirut: "Data belum ditemukan", // To be enhanced
      rekomendasiNdDirut: "Data belum ditemukan", // To be enhanced
      duedateNdDirut: "Data belum ditemukan", // To be enhanced (will likely be single string)

      picNdDirut: "Data belum ditemukan", // To be enhanced
      uicNdDirut: "Data belum ditemukan", // To be enhanced

      // Status fields - typically not from NDE content, but defaults are set
      mtlClosed: 0, // Existing
      reschedule: 0, // Existing
      overdue: 0, // Existing
      onSchedule: 0, // Existing - popup.js defaults to 1 if undefined
      status: "Data belum ditemukan", // Existing

      // Supplemental, but good to have in init
      pengirim: "Data belum ditemukan", // Added for consistency
      idLampiran: "Data belum ditemukan" // Added for consistency
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

      const fullTextContent = (shadowContent.querySelector('.isisurat')?.innerText || "").toLowerCase();

      try {
        const spkRegex = /spk\s*(?:no\.?|nomor)?\s*[:\-\s]*([\w\/\.\-\s]+)/i;
        const spkMatch = fullTextContent.match(spkRegex);
        if (spkMatch && spkMatch[1]) {
            const potentialSPK = spkMatch[1].split(/[\n\r]| {2,}/)[0];
            data.noSPK = cleanText(potentialSPK.toUpperCase()); // SPK biasanya uppercase
        }
      } catch (e) { console.warn("Error ekstraksi No SPK:", e); }
      
      try {
        const masaRegex = /masa\s+penyelesaian\s+pekerjaan\s*[:\-\s]*([\w\s\d\.\-\/]+)(?:\n|$)/i;
        const masaMatch = fullTextContent.match(masaRegex);
        if (masaMatch && masaMatch[1]) {
          data.masaPenyelesaianPekerjaan = cleanText(masaMatch[1]);
        }
      } catch (e) { console.warn("Error ekstraksi Masa Penyelesaian Pekerjaan:", e); }

      try {
        const ofiKeywords = ["opportunity for improvement", "ofi", "temuan"];
        let ofiText = "";
        let ofiRegex = new RegExp(`(?:${ofiKeywords.join('|')})\s*[:\n\s.-]*([\s\S]*?)(?=(?:rekomendasi[:\s\n]|\n\n[\w\s]{20,}|\Z))`, "i");
        let ofiMatch = fullTextContent.match(ofiRegex);

        if (ofiMatch && ofiMatch[1] && ofiMatch[1].trim().length > 10) {
            ofiText = ofiMatch[1];
        }
        if (ofiText) {
            data.temuanNdSvpIa = cleanText(ofiText.substring(0, 500));
        }
      } catch (e) { console.warn("Error ekstraksi Temuan ND SVP IA (OFI):", e); }

      try {
        const rekomendasiRegex = /rekomendasi\s*[:\n\s.-]+([\s\S]*?)(?=(?:tindak\s+lanjut|penutup|hormat kami|demikian|\n\n[\w\s]{20,}|\Z))/i;
        const rekomendasiMatch = fullTextContent.match(rekomendasiRegex);
        if (rekomendasiMatch && rekomendasiMatch[1]) {
          data.rekomendasiNdSvpIa = cleanText(rekomendasiMatch[1].substring(0, 500));
        }
      } catch (e) { console.warn("Error ekstraksi Rekomendasi ND SVP IA:", e); }

      // Revised extraction logic based on new user guidance:

      // Nomor ND SVP IA (refined - already uses getTextFromTable, but if not found, try keywords)
      if (data.nomorNdSvpIa === "Data belum ditemukan") {
        const nomorKeywords = ["nomor nd", "nota dinas", "no.", "nomor"]; // Added "nomor" back but will be careful with context
        for (const keyword of nomorKeywords) {
            // Regex refined to better match formats like C.Tel.XXX/UM 500/HCS-A1010000/2025
            // Allows alphanumeric, '.', '/', '-', and spaces within the number string.
            // Ensures it doesn't just capture a simple number if "nomor" is used more broadly.
            const valuePattern = "([A-Z0-9\\/\\.\\-\\s]*[A-Z0-9\\/][A-Z0-9\\/\\.\\-\\s]*)"; // Must contain at least one letter or slash and not be purely numeric for generic "nomor"
            let regex;
            if (keyword === "nomor") { // More restrictive for generic "nomor" to avoid capturing any number
                 regex = new RegExp(`${keyword}\\s*[:\\s]*${valuePattern}(?=\\s|\\n|$)`, "i");
            } else {
                 regex = new RegExp(`${keyword}\\s*[:\\s]*([A-Z0-9\\/\\.\\-\\s]+[A-Z0-9])`, "i");
            }

            const match = fullTextContent.substring(0, Math.min(fullTextContent.length, 600)).match(regex); // Search in header part (increased length slightly)
            if (match && match[1] && match[1].length > 5) { // Basic sanity check for length
                data.nomorNdSvpIa = cleanText(match[1].replace(/\s+/g, ' ').trim()); // Normalize spaces within the number
                break;
            }
        }
      }
      // Deskripsi ND SVP IA (Perihal) (refined - already uses getTextFromTable, but if not found, try keywords)
      if (data.deskripsiNdSvpIa === "Data belum ditemukan") {
        const perihalKeywords = ["perihal", "subject", "hal"];
        for (const keyword of perihalKeywords) {
            const regex = new RegExp(`(?:^|\\n)${keyword}\\s*[:\\s]*([^\\n]+)`, "i");
            const match = fullTextContent.substring(0, Math.min(fullTextContent.length, 700)).match(regex); // Search in header part
            if (match && match[1]) {
                data.deskripsiNdSvpIa = cleanText(match[1]);
                break;
            }
        }
      }
      // Tanggal ND SVP IA (already good, uses dateRegex on isisuratElement, last match before "Nama Pejabat")
      // No SPK (already good, uses spkRegex)
      // Masa Penyelesaian Pekerjaan (already good, uses masaRegex)
      // Temuan ND SVP IA (already good, uses ofiKeywords and ofiRegex)
      // Temuan ND SVP IA (OFI) and linked Rekomendasi ND SVP IA
      try {
        const ofiKeywords = ["opportunity for improvement", "ofi", "temuan"];
        // Refined ofiRegex to also look for "kami menyampaikan rekomendasi" as a potential end delimiter for OFI.
        const ofiRegex = new RegExp(`(?:${ofiKeywords.join('|')})\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:rekomendasi[:\\s\\n]|kami menyampaikan rekomendasi|\\n\\n[\\w\\s]{20,}|\Z))`, "i");
        const ofiMatch = fullTextContent.match(ofiRegex);

        if (ofiMatch && ofiMatch[1] && ofiMatch[1].trim().length > 5) { // Min length for OFI text
            data.temuanNdSvpIa = cleanText(ofiMatch[1].substring(0, 500));

            // Search for Rekomendasi *after* this OFI match
            // Ensure ofiMatch.index and ofiMatch[0].length are valid before substring
            const startIndexForRekomendasi = (ofiMatch.index !== undefined && ofiMatch[0] !== undefined) ? ofiMatch.index + ofiMatch[0].length : -1;

            if (startIndexForRekomendasi !== -1 && startIndexForRekomendasi < fullTextContent.length) {
                const textAfterOFI = fullTextContent.substring(startIndexForRekomendasi);
                const rekomendasiKeywords = ["rekomendasi", "kami menyampaikan rekomendasi"];
                // Regex for Rekomendasi: starts with keyword (possibly at beginning of line), then captures content
                const rekRegex = new RegExp(`(?:^|\\n)\\s*(?:${rekomendasiKeywords.join('|')})\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:tindak\\s+lanjut|penutup|hormat kami|demikian|\\n\\n[\\w\\s]{20,}|\Z))`, "i");
                const rekomendasiMatchInFollowingText = textAfterOFI.match(rekRegex);

                if (rekomendasiMatchInFollowingText && rekomendasiMatchInFollowingText[1] && rekomendasiMatchInFollowingText[1].trim()) {
                    data.rekomendasiNdSvpIa = cleanText(rekomendasiMatchInFollowingText[1].substring(0, 500));
                } else {
                    console.log("[content.js] Rekomendasi ND SVP IA not found immediately after OFI section using specific keywords.");
                }
            } else {
                 console.log("[content.js] Invalid start index for Rekomendasi search after OFI.");
            }
        } else {
            console.log("[content.js] OFI section not clearly identified, skipping linked Rekomendasi ND SVP IA search.");
            // Fallback: If OFI wasn't found with the above, try a more general Rekomendasi search if temuan is still empty
            // This retains some of the older broader search if the strict OFI->Rek linkage fails.
            if (data.temuanNdSvpIa === "Data belum ditemukan" && data.rekomendasiNdSvpIa === "Data belum ditemukan") {
                const standaloneRekSvpIaKeywords = ["rekomendasi", "kami menyampaikan rekomendasi"];
                const standaloneRekSvpIaRegex = new RegExp(`(?:${standaloneRekSvpIaKeywords.join('\\s*[:\\n\\s.-]*|')}\\s*)([\\s\\S]*?)(?=(?:tindak\\s+lanjut|penutup|hormat kami|demikian|\\n\\n[\\w\\s]{20,}|\Z))`, "i");
                const standaloneRekMatch = fullTextContent.match(standaloneRekSvpIaRegex);
                if (standaloneRekMatch && standaloneRekMatch[1] && standaloneRekMatch[1].trim()) {
                  data.rekomendasiNdSvpIa = cleanText(standaloneRekMatch[1].substring(0, 500));
                  console.log("[content.js] Found Rekomendasi ND SVP IA using standalone search.");
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Temuan ND SVP IA (OFI) or linked Rekomendasi:", e); }

      // CODE
      try {
        const codeKeywords = ["kode", "code", "audit code", "kode temuan", "project code"];
        for (const keyword of codeKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([\\w\\/\\.\\-]+)`, "i");
            const match = fullTextContent.match(regex);
            if (match && match[1]) {
                data.code = cleanText(match[1].toUpperCase());
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi CODE:", e); }

      // Matriks Program & Tanggal Matriks
      try {
        const matriksKeywords = ["matriks program", "program kerja audit tahunan", "pkat", "pknat", "audit tahunan", "matriks"];
        for (const keyword of matriksKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n]+)(?:.*tanggal\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4}))?`, "i");
            const match = fullTextContent.match(regex);
            if (match && match[1]) {
                data.matriksProgram = cleanText(match[1]);
                if (match[2]) { // If tanggal is captured in the same line/context
                    data.tanggalMatriks = cleanText(match[2]);
                }
                break;
            }
        }
        // If Tanggal Matriks not found with Matriks Program, try standalone
        if (data.tanggalMatriks === "Data belum ditemukan") {
            const tglMatriksKeywords = ["tanggal matriks", "tanggal pkat", "tanggal pknat"];
             for (const keyword of tglMatriksKeywords) {
                const regex = new RegExp(`${keyword}\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})`, "i");
                const match = fullTextContent.match(regex);
                if (match && match[1]) {
                    data.tanggalMatriks = cleanText(match[1]);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Error ekstraksi Matriks Program/Tanggal Matriks:", e); }

      // Kelompok
      try {
        const kelompokKeywords = ["kelompok temuan", "jenis temuan", "kategori temuan", "kelompok:"];
        for (const keyword of kelompokKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n]+)`, "i");
            const match = fullTextContent.match(regex);
            if (match && match[1]) {
                data.kelompok = cleanText(match[1]);
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Kelompok:", e); }

      // --- ND DIRUT Fields ---
      const ndDirutContextRegex = /nota dinas direktur utama|nd dirut|kepada direktur utama/i;
      const dirutSectionMatch = fullTextContent.match(ndDirutContextRegex);
      let dirutText = fullTextContent; // Default to full text if no specific section found

      if (dirutSectionMatch) {
          // Try to narrow down the search text if a clear "ND Dirut" section header is found
          // This is a simple approach; more complex documents might need smarter segmentation
          const searchStartIndex = dirutSectionMatch.index;
          dirutText = fullTextContent.substring(searchStartIndex);
      }

      try {
        const nomorNdDirutKeywords = ["nomor nd dirut", "nd dirut nomor"];
        for (const keyword of nomorNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([\\w\\/\\.\\-]+)`, "i");
            const match = dirutText.match(regex);
            if (match && match[1]) {
                data.nomorNdDirut = cleanText(match[1]);
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Nomor ND Dirut:", e); }

      try {
        const deskripsiNdDirutKeywords = ["perihal nd dirut", "hal nd dirut"];
         for (const keyword of deskripsiNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n]+)`, "i");
            const match = dirutText.match(regex);
            if (match && match[1]) {
                data.deskripsiNdDirut = cleanText(match[1]);
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Deskripsi ND Dirut:", e); }

      try {
        const tanggalNdDirutKeywords = ["tanggal nd dirut"];
         for (const keyword of tanggalNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})`, "i");
            const match = dirutText.match(regex);
            if (match && match[1]) {
                data.tanggalNdDirut = cleanText(match[1]);
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Tanggal ND Dirut:", e); }

      try {
        const temuanNdDirutKeywords = ["temuan nd dirut", "ofi dirut"];
        for (const keyword of temuanNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:rekomendasi nd dirut|rekomendasi dirut|tindak lanjut dirut|\\n\\n[\\w\\s]{20,}|\\Z))`, "i");
            const match = dirutText.match(regex);
            if (match && match[1] && match[1].trim()) {
                data.temuanNdDirut = cleanText(match[1].substring(0, 500));
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Temuan ND Dirut:", e); }

      try {
        const rekomendasiNdDirutKeywords = ["rekomendasi nd dirut", "rekomendasi dirut"];
         for (const keyword of rekomendasiNdDirutKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:pic dirut|uic dirut|due date dirut|tindak lanjut|penutup|hormat kami|demikian|\\n\\n[\\w\\s]{20,}|\\Z))`, "i");
            const match = dirutText.match(regex);
            if (match && match[1] && match[1].trim()) {
                data.rekomendasiNdDirut = cleanText(match[1].substring(0, 500));
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Rekomendasi ND Dirut:", e); }

      // Duedate ND Dirut
      try {
        const duedateKeywords = ["paling lambat", "due\\s*date", "target penyelesaian", "tindak lanjut.*(?:tanggal|target)"];
        // Search within "rencana tindak lanjut" context if possible, or general text for ND Dirut
        const duedateContextRegex = new RegExp(`(?:rencana tindak lanjut|action plan).*nd dirut([\\s\\S]*?)(?:\\n\\n|$)`, "i");
        let duedateSearchText = dirutText;
        const duedateContextMatch = dirutText.match(duedateContextRegex);
        if (duedateContextMatch && duedateContextMatch[1]) {
            duedateSearchText = duedateContextMatch[1];
        }

        for (const keyword of duedateKeywords) {
            // Regex tries to capture a date, or a phrase indicating a period
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*((?:\\d{1,2}\\s+\\w+\\s+\\d{4})|[^\\n\\.,]+(?:minggu|bulan|hari|triwulan|semester|tahun))`, "i");
            const match = duedateSearchText.match(regex);
            if (match && match[1]) {
                data.duedateNdDirut = cleanText(match[1]);
                break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Duedate ND Dirut:", e); }

      // PIC ND Dirut & UIC ND Dirut
      try {
        const picKeywords = ["pic", "penanggung jawab", "auditee", "manajemen terkait"];
        const uicKeywords = ["uic", "unit kerja", "divisi", "direktorat"];
        // Try to find these in context of recommendations or action plans for Dirut
        const actionPlanContextRegex = /(?:rekomendasi nd dirut|tindak lanjut nd dirut)([\s\S]*?)(?:\n\n\w{5,}|\Z)/i;
        let actionPlanText = dirutText;
        const actionPlanMatch = dirutText.match(actionPlanContextRegex);
        if(actionPlanMatch && actionPlanMatch[1]) {
            actionPlanText = actionPlanMatch[1];
        }

        for (const keyword of picKeywords) {
            const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n,]+)`, "i");
            const match = actionPlanText.match(regex);
            if (match && match[1]) {
                data.picNdDirut = cleanText(match[1]);
                break;
            }
        }
        // Search for UIC in document beginning if not found near action plan
        if(data.uicNdDirut === "Data belum ditemukan"){
            for (const keyword of uicKeywords) {
                const regex = new RegExp(`(?:${keyword}|kepada\\s*[:\\s-]*ykh\\.?\\s*([^\\n]+(?:${uicKeywords.join('|')})[^\\n]*))`, "i");
                const match = fullTextContent.substring(0, Math.min(fullTextContent.length, 1000)).match(regex); // Search in header
                if (match && match[1]) {
                     data.uicNdDirut = cleanText(match[1].replace(/ykh\.?\s*/i, ''));
                     break;
                } else if (match && match[0].toLowerCase().includes(keyword)) { // If keyword itself matched
                     const simpleRegex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n,]+)`, "i");
                     const simpleMatch = fullTextContent.substring(0, Math.min(fullTextContent.length, 1000)).match(simpleRegex);
                     if(simpleMatch && simpleMatch[1]){
                        data.uicNdDirut = cleanText(simpleMatch[1]);
                        break;
                     }
                }
            }
        }
         // Fallback for UIC if still not found, search in actionPlanText again
        if(data.uicNdDirut === "Data belum ditemukan"){
            for (const keyword of uicKeywords) {
                const regex = new RegExp(`${keyword}\\s*[:\\s-]*([^\\n,]+)`, "i");
                const match = actionPlanText.match(regex);
                if (match && match[1]) {
                    data.uicNdDirut = cleanText(match[1]);
                    break;
                }
            }
        }

      } catch (e) { console.warn("Error ekstraksi PIC/UIC ND Dirut:", e); }

      // Status (Opportunistic search in conclusion)
      try {
        const statusKeywords = ["status\\s*:\\s*([^\\n]+)", "(closed)", "(sudah ditindaklanjuti)", "(selesai)"];
        const conclusionText = fullTextContent.substring(Math.max(0, fullTextContent.length - 500)); // Last 500 chars
        for (const keyword of statusKeywords) {
            const regex = new RegExp(keyword, "i");
            const match = conclusionText.match(regex);
            if (match && match[1]) { // For "status : value"
                data.status = cleanText(match[1]);
                break;
            } else if (match && match[0]) { // For keywords in parentheses
                 data.status = cleanText(match[0].replace(/[()]/g, ''));
                 break;
            }
        }
      } catch (e) { console.warn("Error ekstraksi Status:", e); } // Old status text search can be removed or repurposed for flags

      // --- Set flags based on textual cues ---
      try {
        const closedKeywords = ["closed", "selesai", "sudah ditindaklanjuti", "telah diselesaikan"];
        // Search in the latter half of the document for closure status
        const latterHalfText = fullTextContent.substring(Math.floor(fullTextContent.length / 2));
        if (closedKeywords.some(kw => latterHalfText.includes(kw))) {
            data.mtlClosed = 1;
        }
      } catch(e) { console.warn("Error checking for MTL Closed keywords:", e); }

      try {
        const rescheduleKeywords = ["reschedule", "dijadwalkan ulang", "penyesuaian waktu"];
        if (rescheduleKeywords.some(kw => fullTextContent.includes(kw))) {
            data.reschedule = 1;
        }
      } catch(e) { console.warn("Error checking for Reschedule keywords:", e); }

      try {
        const overdueKeywords = ["overdue", "terlambat", "lewat deadline"];
        if (overdueKeywords.some(kw => fullTextContent.includes(kw))) {
            data.overdue = 1;
        }
      } catch(e) { console.warn("Error checking for Overdue keywords:", e); }

      // --- Derive Status field ---
      // Note: data.onSchedule is initialized to 0. It can be set to 1 by popup if no other status applies.
      if (data.mtlClosed === 1) {
        data.status = "Closed";
      } else if (data.overdue === 1) {
        data.status = "Overdue";
      } else if (data.reschedule === 1) {
        data.status = "Reschedule";
      } else {
        // If no specific textual cues for Closed, Overdue, Reschedule were found in NDE,
        // default to "OnSchedule" from content.js perspective.
        // The popup.js has its own default for OnSchedule if this remains "Data belum ditemukan".
        // For clarity, if any significant data was extracted, we might assume "OnSchedule" here.
        const hasAnyData = Object.values(data).some(val => val !== "Data belum ditemukan" && val !== "" && val !== 0);
        if (hasAnyData && data.status === "Data belum ditemukan") { // Avoid overwriting if status was somehow already set by old logic
             data.status = "OnSchedule"; // Default if other flags not set
             data.onSchedule = 1; // Also set the flag for consistency
        }
      }
      // The old opportunistic text search for data.status can be removed as per new logic.
      // The above derivation is now the primary way data.status is set from content.js.

      console.log("Ekstraksi selesai dalam tryExtract.");
    };

    let observer = null;

    const performExtractionAndSendResponse = () => {
      const appVirtualDomElement = document.querySelector('app-virtualdom');
      if (appVirtualDomElement && appVirtualDomElement.shadowRoot) {
        const shadowContent = appVirtualDomElement.shadowRoot;
        console.log("Shadow DOM ditemukan. Memulai ekstraksi.");
        tryExtract(shadowContent, extractedData);
        console.log("Data yang diekstrak:", extractedData);
        sendResponse({ data: extractedData, success: true });
        if (observer) {
          observer.disconnect();
          console.log("MutationObserver dihentikan.");
        }
      } else {
        console.warn("app-virtualdom atau Shadow DOM tidak ditemukan saat performExtraction dipanggil.");
        if (!observer || (observer && !observer.takeRecords().length)) { 
             sendResponse({ data: extractedData, success: false, message: "Target element not found." });
        }
      }
    };

    // cleanText remains the same as it's generally useful.
    // getTextFromTable is specific to the shadow DOM structure, so it will be used conditionally.

    // Function to extract data from the new standard HTML structure
    const extractDataFromStandardHTML = (data) => {
      console.log("Asisten NDE: Attempting extraction from standard HTML structure.");
      let success = true; // Assume success unless specific extractions fail to find key elements

      // Nomor Nota (ND SVP IA Nomor)
      try {
        const nomorLabel = Array.from(document.querySelectorAll('.grid .col-span-1.font-semibold'))
                                .find(el => el.textContent.trim() === "Nomor");
        if (nomorLabel && nomorLabel.nextElementSibling) {
          const nomorText = nomorLabel.nextElementSibling.textContent.replace(/^:\s*/, '').trim();
          data.nomorNdSvpIa = cleanText(nomorText);
        } else {
          data.nomorNdSvpIa = "Data belum ditemukan";
          console.warn("Nomor Nota not found in standard HTML.");
        }
      } catch (e) { data.nomorNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Nomor Nota (standard):", e); }

      // Perihal (Deskripsi ND SVP IA)
      try {
        const perihalEl = document.getElementById('perihal');
        if (perihalEl) {
          data.deskripsiNdSvpIa = cleanText(perihalEl.textContent.replace(/^:\s*/, '').trim());
        } else {
          data.deskripsiNdSvpIa = "Data belum ditemukan";
          console.warn("Perihal not found in standard HTML.");
        }
      } catch (e) { data.deskripsiNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Perihal (standard):", e); }
      
      // Dari (Pengirim)
      try {
        const pengirimEl = document.getElementById('pengirim');
        if (pengirimEl) {
          data.pengirim = cleanText(pengirimEl.textContent.replace(/^:\s*/, '').trim()); // Using 'pengirim' key
        } else {
          data.pengirim = "Data belum ditemukan";
          console.warn("Pengirim not found in standard HTML.");
        }
      } catch (e) { data.pengirim = "Data belum ditemukan"; console.warn("Error extracting Pengirim (standard):", e); }

      // Tanggal ND SVP IA (Document Date)
      try {
        const dateEl = document.querySelector('main > div.mt-8.text-right');
        if (dateEl) {
          const dateText = dateEl.textContent.trim();
          // Assuming format "Jakarta, 07 Juni 2024" or similar, extract the date part.
          const dateMatch = dateText.match(/(\d{1,2}\s+\w+\s+\d{4})/);
          if (dateMatch && dateMatch[1]) {
            data.tanggalNdSvpIa = cleanText(dateMatch[1]); // Will be like "07 Juni 2024"
          } else {
            data.tanggalNdSvpIa = "Data belum ditemukan";
            console.warn("Tanggal document not found or format mismatch in standard HTML.");
          }
        } else {
          data.tanggalNdSvpIa = "Data belum ditemukan";
        }
      } catch (e) { data.tanggalNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Tanggal Document (standard):", e); }

      // Temuan (OFI)
      try {
        let ofiText = "";
        const ofiHeaderElement = Array.from(document.querySelectorAll('ol.list-decimal > li > p > strong, ol.list-decimal > li'))
                                     .find(el => el.textContent.includes("opportunities for improvement (OFI)"));
        if (ofiHeaderElement) {
            // Find the parent <li> of the OFI header
            const ofiListItem = ofiHeaderElement.closest('li');
            if (ofiListItem) {
                const ofiList = ofiListItem.querySelector('ol.list-alpha');
                if (ofiList) {
                    const items = Array.from(ofiList.children)
                                       .map(li => li.textContent.trim())
                                       .filter(text => text.length > 0);
                    ofiText = items.join('\n');
                }
            }
        }
        data.temuanNdSvpIa = ofiText ? cleanText(ofiText.substring(0, 1000)) : "Data belum ditemukan"; // Increased limit
        if (!ofiText) console.warn("Temuan (OFI) not found in standard HTML.");
      } catch (e) { data.temuanNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Temuan (OFI) (standard):", e); }

      // Rekomendasi
      try {
        let rekomendasiText = "";
        const rekHeaderElement = Array.from(document.querySelectorAll('ol.list-decimal > li > p > strong, ol.list-decimal > li'))
                                    .find(el => el.textContent.includes("menyampaikan beberapa rekomendasi"));
        if (rekHeaderElement) {
            const rekListItem = rekHeaderElement.closest('li');
            if (rekListItem) {
                const rekList = rekListItem.querySelector('ol.list-alpha');
                if (rekList) {
                    const items = Array.from(rekList.children)
                                       .map(li => li.textContent.trim()) // Could be more sophisticated to handle nested lists
                                       .filter(text => text.length > 0);
                    rekomendasiText = items.join('\n');
                }
            }
        }
        data.rekomendasiNdSvpIa = rekomendasiText ? cleanText(rekomendasiText.substring(0,1000)) : "Data belum ditemukan"; // Increased limit
        if(!rekomendasiText) console.warn("Rekomendasi not found in standard HTML.");
      } catch (e) { data.rekomendasiNdSvpIa = "Data belum ditemukan"; console.warn("Error extracting Rekomendasi (standard):", e); }
      
      // Enhancement: Extract new fields from standard HTML
      // These are examples; actual selectors/logic would depend on common NDE HTML structures not using Shadow DOM.

      // Helper to find text by label in a definition list <dl><dt>Label</dt><dd>Value</dd></dl> or similar structure
      const getTextAfterLabel = (labelKeyword) => {
          try {
              const allElements = document.querySelectorAll('p, span, div, td, dt, dd');
              for (let el of allElements) {
                  if (el.textContent.toLowerCase().includes(labelKeyword.toLowerCase())) {
                      // Attempt to get next sibling, or parent's next sibling, or next dd if current is dt
                      let valueElement = el.nextElementSibling;
                      if (el.nodeName === 'DT' && el.nextElementSibling && el.nextElementSibling.nodeName === 'DD') {
                          valueElement = el.nextElementSibling;
                      } else if (!valueElement && el.parentElement.nextElementSibling) {
                          valueElement = el.parentElement.nextElementSibling.querySelector('dd, td, :scope > span, :scope > div') || el.parentElement.nextElementSibling;
                      }
                      if (valueElement) return cleanText(valueElement.textContent.replace(/^[:\s-]+/, ''));
                  }
              }
          } catch(e) { console.warn(`Error in getTextAfterLabel for ${labelKeyword}:`, e); }
          return "Data belum ditemukan";
      };

      if (data.code === "Data belum ditemukan") data.code = getTextAfterLabel("code");
      if (data.matriksProgram === "Data belum ditemukan") data.matriksProgram = getTextAfterLabel("matriks program");
      if (data.tanggalMatriks === "Data belum ditemukan") data.tanggalMatriks = getTextAfterLabel("tanggal matriks");

      if (data.nomorNdDirut === "Data belum ditemukan") data.nomorNdDirut = getTextAfterLabel("nomor nd dirut");
      if (data.deskripsiNdDirut === "Data belum ditemukan") data.deskripsiNdDirut = getTextAfterLabel("perihal nd dirut");
      if (data.tanggalNdDirut === "Data belum ditemukan") data.tanggalNdDirut = getTextAfterLabel("tanggal nd dirut");

      // Temuan/Rekomendasi/Duedate/PIC/UIC for Dirut might be in more complex structures
      // For now, these are less likely to be found with simple label searches in varied standard HTML
      // Placeholder for more specific logic if patterns emerge:
      // if (data.temuanNdDirut === "Data belum ditemukan") data.temuanNdDirut = getTextAfterLabel("temuan nd dirut");
      // if (data.rekomendasiNdDirut === "Data belum ditemukan") data.rekomendasiNdDirut = getTextAfterLabel("rekomendasi nd dirut");
      // if (data.duedateNdDirut === "Data belum ditemukan") data.duedateNdDirut = getTextAfterLabel("due date dirut");
      // if (data.picNdDirut === "Data belum ditemukan") data.picNdDirut = getTextAfterLabel("pic nd dirut");
      // if (data.uicNdDirut === "Data belum ditemukan") data.uicNdDirut = getTextAfterLabel("uic nd dirut");

      // More robust keyword-based extraction for standard HTML
      const allTextElements = Array.from(document.querySelectorAll('p, span, div, td, li, h1, h2, h3, h4, strong'));

      // Helper to find value after keyword in an element's text or subsequent text nodes/elements
      const extractValueAfterKeyword = (elements, keywords, regexPattern, contextKeywords = []) => {
          for (const el of elements) {
              const elText = el.innerText || el.textContent || "";
              if (!elText.trim()) continue;

              let relevantText = elText.toLowerCase();
              let foundContext = contextKeywords.length === 0; // True if no context needed
              if (contextKeywords.length > 0) {
                  if (contextKeywords.some(ck => relevantText.includes(ck.toLowerCase()))) {
                      foundContext = true;
                  } else { // Check parent elements for context too, up to 3 levels
                      let parent = el.parentElement;
                      for (let i = 0; i < 3 && parent; i++) {
                          if (parent.innerText && contextKeywords.some(ck => parent.innerText.toLowerCase().includes(ck.toLowerCase()))) {
                              foundContext = true;
                              relevantText = parent.innerText.toLowerCase(); // Use parent text if context found here
                              break;
                          }
                          parent = parent.parentElement;
                      }
                  }
              }

              if (!foundContext) continue;

              for (const keyword of keywords) {
                  const keywordRegex = new RegExp(keyword.toLowerCase() + regexPattern, "i");
                  const match = relevantText.match(keywordRegex);
                  if (match && match[1] && match[1].trim()) {
                      return cleanText(match[1]);
                  }
              }
          }
          return "Data belum ditemukan";
      };

      // Nomor ND SVP IA (fallback)
      if (data.nomorNdSvpIa === "Data belum ditemukan") {
        const nomorKeywords = ["nomor nd", "nota dinas", "no.", "nomor"];
        const generalPattern = "\\s*[:\\s]*([A-Z0-9\\/\\.\\-\\s]+[A-Z0-9])";
        const specificPatternForNomor = "\\s*[:\\s]*([A-Z0-9\\/\\.\\-\\s]*[A-Z0-9\\/][A-Z0-9\\/\\.\\-\\s]*)"; // Must contain letter or slash for generic "nomor"

        let foundNomor = "Data belum ditemukan";
        for(const keyword of nomorKeywords) {
            let pattern = (keyword === "nomor") ? specificPatternForNomor : generalPattern;
            foundNomor = extractValueAfterKeyword(allTextElements.slice(0, 30), [keyword], pattern);
            if (foundNomor !== "Data belum ditemukan" && foundNomor.length > 5) {
                 data.nomorNdSvpIa = cleanText(foundNomor.replace(/\s+/g, ' ').trim());
                 break;
            } else {
                foundNomor = "Data belum ditemukan"; // Reset if too short or not found
            }
        }
        if (foundNomor !== "Data belum ditemukan" && data.nomorNdSvpIa === "Data belum ditemukan") { // If loop finished with a short match not assigned
            data.nomorNdSvpIa = cleanText(foundNomor.replace(/\s+/g, ' ').trim());
        }
      }
      // Deskripsi ND SVP IA (fallback)
      if (data.deskripsiNdSvpIa === "Data belum ditemukan") {
         data.deskripsiNdSvpIa = extractValueAfterKeyword(allTextElements.slice(0,30), ["perihal", "subject", "hal"], "\\s*[:\\s]*([^\\n]+)");
      }
      // Tanggal ND SVP IA (fallback - search towards the end)
      if (data.tanggalNdSvpIa === "Data belum ditemukan") {
        const footerElements = allTextElements.slice(Math.max(0, allTextElements.length - 30));
        data.tanggalNdSvpIa = extractValueAfterKeyword(footerElements, ["tanggal", ""], "\\s*[:\\s]*(\\d{1,2}\\s+\\w+\\s+\\d{4})"); // Empty keyword to catch dates near end
      }

      // No SPK
      if (data.noSPK === "Data belum ditemukan") {
        data.noSPK = extractValueAfterKeyword(allTextElements, ["spk", "surat perintah kerja", "nomor spk"], "\\s*[:\\s]*([\\w\\/\\.\\-]+)");
      }
      // CODE
      if (data.code === "Data belum ditemukan") {
        data.code = extractValueAfterKeyword(allTextElements, ["kode", "code", "audit code", "kode temuan"], "\\s*[:\\s]*([\\w\\/\\.\\-]+)").toUpperCase();
      }
      // Matriks Program & Tanggal Matriks
      if (data.matriksProgram === "Data belum ditemukan") {
        data.matriksProgram = extractValueAfterKeyword(allTextElements, ["matriks program", "pkat", "pknat", "program kerja audit tahunan"], "\\s*[:\\s-]*([^\\n]+(?:(?:program|matriks)[^\\n]*)?)");
      }
      if (data.tanggalMatriks === "Data belum ditemukan") {
        data.tanggalMatriks = extractValueAfterKeyword(allTextElements, ["tanggal matriks", "tanggal pkat", "tanggal pknat"], "\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})", ["matriks", "pkat", "pknat"]);
      }
      // Kelompok
      if (data.kelompok === "Data belum ditemukan") {
        data.kelompok = extractValueAfterKeyword(allTextElements, ["kelompok temuan", "jenis temuan", "kategori temuan", "kelompok:"], "\\s*[:\\s-]*([^\\n]+)");
      }
      // Masa Penyelesaian Pekerjaan
      if (data.masaPenyelesaianPekerjaan === "Data belum ditemukan") {
        data.masaPenyelesaianPekerjaan = extractValueAfterKeyword(allTextElements, ["masa penyelesaian", "batas waktu", "selesai dalam"], "\\s*[:\\s-]*([^\\n]+(?:(?:minggu|bulan|hari)[^\\n]*)?)", ["due date", "target"]);
      }

      // ND Dirut Fields - using context keywords "ND Dirut", "Direktur Utama"
      const dirutContext = ["nd dirut", "direktur utama"];
      if (data.nomorNdDirut === "Data belum ditemukan") {
        data.nomorNdDirut = extractValueAfterKeyword(allTextElements, ["nomor"], "\\s*[:\\s-]*([\\w\\/\\.\\-]+)", dirutContext);
      }
      if (data.deskripsiNdDirut === "Data belum ditemukan") {
        data.deskripsiNdDirut = extractValueAfterKeyword(allTextElements, ["perihal", "hal"], "\\s*[:\\s-]*([^\\n]+)", dirutContext);
      }
      if (data.tanggalNdDirut === "Data belum ditemukan") {
        data.tanggalNdDirut = extractValueAfterKeyword(allTextElements, ["tanggal"], "\\s*[:\\s-]*(\\d{1,2}\\s+\\w+\\s+\\d{4})", dirutContext);
      }
      if (data.temuanNdDirut === "Data belum ditemukan") {
         data.temuanNdDirut = extractValueAfterKeyword(allTextElements, ["temuan", "ofi"], "\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:rekomendasi|tindak lanjut|\\n\\n[\\w\\s]{5,}|pic|uic|due date|$))", dirutContext);
         if (data.temuanNdDirut !== "Data belum ditemukan") data.temuanNdDirut = data.temuanNdDirut.substring(0,500);
      }
      if (data.rekomendasiNdDirut === "Data belum ditemukan") {
        data.rekomendasiNdDirut = extractValueAfterKeyword(allTextElements, ["rekomendasi", "kami menyampaikan rekomendasi"], "\\s*[:\\n\\s.-]*([\\s\\S]*?)(?=(?:pic|uic|due date|tindak lanjut|penutup|hormat kami|demikian|\\n\\n[\\w\\s]{5,}|$))", dirutContext);
        if (data.rekomendasiNdDirut !== "Data belum ditemukan") data.rekomendasiNdDirut = data.rekomendasiNdDirut.substring(0,500);
      }
      if (data.duedateNdDirut === "Data belum ditemukan") {
        data.duedateNdDirut = extractValueAfterKeyword(allTextElements, ["paling lambat", "due date", "target penyelesaian", "tindak lanjut.*(?:tanggal|target)"], "\\s*[:\\s-]*((?:\\d{1,2}\\s+\\w+\\s+\\d{4})|[^\\n\\.,]+(?:minggu|bulan|hari|triwulan|semester|tahun))", ["rencana tindak lanjut", "action plan"].concat(dirutContext));
      }
      if (data.picNdDirut === "Data belum ditemukan") {
        data.picNdDirut = extractValueAfterKeyword(allTextElements, ["pic", "penanggung jawab", "auditee"], "\\s*[:\\s-]*([^\\n,]+)", ["rekomendasi", "tindak lanjut"].concat(dirutContext));
      }
      if (data.uicNdDirut === "Data belum ditemukan") {
        // Search UIC in header context first
        data.uicNdDirut = extractValueAfterKeyword(allTextElements.slice(0,30), ["uic", "unit kerja", "divisi", "direktorat", "kepada yth"], "\\s*[:\\s-]*([^\\n,]+)", dirutContext.length > 0 ? dirutContext : []);
        if (data.uicNdDirut === "Data belum ditemukan") { // Fallback to general search if not in header context for dirut
             data.uicNdDirut = extractValueAfterKeyword(allTextElements, ["uic", "unit kerja", "divisi", "direktorat"], "\\s*[:\\s-]*([^\\n,]+)", dirutContext);
        }
      }
      // Status
      if (data.status === "Data belum ditemukan") {
        const footerElements = allTextElements.slice(Math.max(0, allTextElements.length - 20));
        data.status = extractValueAfterKeyword(footerElements, ["status"], "\\s*[:\\s-]*([^\\n]+)");
        if (data.status === "Data belum ditemukan") { // Fallback to simple keyword presence
            if (footerElements.some(el => el.textContent.toLowerCase().includes("closed") || el.textContent.toLowerCase().includes("sudah ditindaklanjuti"))) data.status = "Closed";
            else if (footerElements.some(el => el.textContent.toLowerCase().includes("reschedule"))) data.status = "Reschedule";
            else if (footerElements.some(el => el.textContent.toLowerCase().includes("overdue"))) data.status = "Overdue";
            else if (footerElements.some(el => el.textContent.toLowerCase().includes("on schedule"))) data.status = "OnSchedule";
        }
      }

      // For fields not in this HTML, they will retain "Data belum ditemukan"

      // --- Set flags based on textual cues in Standard HTML ---
      try {
        const closedKeywords = ["closed", "selesai", "sudah ditindaklanjuti", "telah diselesaikan"];
        // Check last few elements for closure status
        const footerElements = allTextElements.slice(Math.max(0, allTextElements.length - 20));
        if (footerElements.some(el => closedKeywords.some(kw => (el.innerText || el.textContent || "").toLowerCase().includes(kw)))) {
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
        const hasAnyData = Object.values(data).some(val => val !== "Data belum ditemukan" && val !== "" && val !== 0);
        if (hasAnyData && data.status === "Data belum ditemukan") {
             data.status = "OnSchedule";
             data.onSchedule = 1;
        }
      }
      // The old text search for status (using extractValueAfterKeyword for "status") is removed.
      // data.status is now derived.

      console.log("Asisten NDE: Standard HTML extraction attempt complete.");
      return success; // For now, always return true if it runs, popup handles "Data belum ditemukan"
    };


    // --- Detection and Execution Logic ---
    const appVirtualDomElement = document.querySelector('app-virtualdom');
    const standardHtmlPerihal = document.getElementById('perihal');
    const standardHtmlPengirim = document.getElementById('pengirim');

    if (appVirtualDomElement && appVirtualDomElement.shadowRoot) {
        // TYPE 1: Shadow DOM / app-virtualdom based MHTML
        console.log("Asisten NDE: app-virtualdom with Shadow DOM found. Proceeding with Shadow DOM extraction.");
        tryExtract(appVirtualDomElement.shadowRoot, extractedData); 
        console.log("Asisten NDE: Data extracted via Shadow DOM:", extractedData);
        sendResponse({ data: extractedData, success: true });
        return true; 

    } else if (standardHtmlPerihal && standardHtmlPengirim) {
        // TYPE 2: Standard HTML structure (found key elements immediately)
        console.log("Asisten NDE: Standard HTML structure detected upfront (found #perihal and #pengirim).");
        extractDataFromStandardHTML(extractedData);
        console.log("Asisten NDE: Data extracted via Standard HTML (upfront):", extractedData);
        sendResponse({ data: extractedData, success: true });
        return true; 

    } else {
        // Fallback: Neither structure found immediately.
        // This path will primarily observe for late-appearing app-virtualdom.
        // If app-virtualdom doesn't appear by timeout, it will then try standard HTML parsing as a last resort.
        console.log("Asisten NDE: Key markers for either structure not immediately found. Setting up MutationObserver for late-appearing app-virtualdom.");
        let observer = null;
        let observationTimeout = null;

        const finalizeExtractionAfterObserver = (appVirtualDomWasFound) => {
            if (!appVirtualDomWasFound) {
                // If app-virtualdom was NOT found by the observer/timeout, attempt standard HTML extraction.
                console.log("Asisten NDE: app-virtualdom not found by observer/timeout. Attempting standard HTML extraction as final fallback.");
                extractDataFromStandardHTML(extractedData);
            }
            // else if appVirtualDomWasFound, tryExtract would have already populated extractedData.

            const wasAnythingExtracted = Object.values(extractedData).some(
                val => val !== "Data belum ditemukan" && val !== "" && val !== 0 && val !== undefined && val !== null
            );

            if (wasAnythingExtracted) {
                console.log("Asisten NDE: Final extracted data after observer/fallback:", extractedData);
                sendResponse({ data: extractedData, success: true });
            } else {
                console.warn("Asisten NDE: No data extracted after all attempts (observer and fallback standard parse).");
                sendResponse({ 
                    data: extractedData, 
                    success: false, 
                    message: "Could not identify document structure or extract data after all attempts (20s)." 
                });
            }
        };
      
        observer = new MutationObserver((mutationsList, obs) => {
            const avdElementObserved = document.querySelector('app-virtualdom');
            if (avdElementObserved && avdElementObserved.shadowRoot) {
                console.log("Asisten NDE: app-virtualdom detected by MutationObserver.");
                if (observationTimeout) clearTimeout(observationTimeout);
                obs.disconnect(); 
                observer = null; 
                tryExtract(avdElementObserved.shadowRoot, extractedData); // Populate data
                finalizeExtractionAfterObserver(true); // Indicate app-virtualdom was found
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
        console.log("Asisten NDE: MutationObserver for app-virtualdom active.");

        observationTimeout = setTimeout(() => {
            if (observer) { // If observer is still active, it means app-virtualdom wasn't found
                console.warn("Asisten NDE: MutationObserver timeout (20s) reached for app-virtualdom.");
                observer.disconnect();
                observer = null;
                finalizeExtractionAfterObserver(false); // Indicate app-virtualdom was NOT found
            }
        }, 20000); 

        return true; // Indicates async response for the observer path
    }
    // Note: The final 'return true;' from the original code was removed as each path should handle its own sendResponse or async indication.
  }
});

console.log("Content script NDE 'content.js' dimuat dan listener aktif.");

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Ekstensi NDE berhasil diinstal/diupdate.');
  });
}