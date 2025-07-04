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
      kelompok: "", // Akan diisi dari popup atau DB
      code: "Data belum ditemukan",
      masaPenyelesaianPekerjaan: "Data belum ditemukan",
      matriksProgram: "Data belum ditemukan",
      tanggalMatriks: "Data belum ditemukan",
      nomorNdSvpIa: "Data belum ditemukan",
      deskripsiNdSvpIa: "Data belum ditemukan",
      tanggalNdSvpIa: "Data belum ditemukan",
      temuanNdSvpIa: "Data belum ditemukan",
      rekomendasiNdSvpIa: "Data belum ditemukan",
      nomorNdDirut: "Data belum ditemukan",
      deskripsiNdDirut: "Data belum ditemukan",
      tanggalNdDirut: "Data belum ditemukan",
      temuanNdDirut: "Data belum ditemukan",
      rekomendasiNdDirut: "Data belum ditemukan",
      duedateNdDirut: "", // Akan diisi dari popup
      picNdDirut: "Data belum ditemukan",
      uicNdDirut: "Data belum ditemukan",
      mtlClosed: 0,
      reschedule: 0,
      overdue: 0,
      onSchedule: 0,
      status: "Data belum ditemukan"
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
      
      if (data.mtlClosed === 1) data.status = "Closed";
      else if (data.reschedule === 1) data.status = "Reschedule";
      else if (data.overdue === 1) data.status = "Overdue";
      else if (data.onSchedule === 1) data.status = "OnSchedule";

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

    const appVirtualDomInitial = document.querySelector('app-virtualdom');
    if (appVirtualDomInitial && appVirtualDomInitial.shadowRoot) {
      console.log("Shadow DOM ditemukan secara langsung.");
      performExtractionAndSendResponse();
    } else {
      console.log("app-virtualdom tidak langsung ditemukan, menyiapkan MutationObserver.");
      let observationTimeout = null;

      observer = new MutationObserver((mutationsList, obs) => {
        const appVirtualDomObserved = document.querySelector('app-virtualdom');
        if (appVirtualDomObserved && appVirtualDomObserved.shadowRoot) {
          console.log("app-virtualdom terdeteksi oleh MutationObserver.");
          if (observationTimeout) clearTimeout(observationTimeout);
          obs.disconnect(); 
          observer = null; 
          console.log("MutationObserver dihentikan setelah elemen ditemukan.");
          performExtractionAndSendResponse();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      console.log("MutationObserver aktif.");

      observationTimeout = setTimeout(() => {
        if (observer) { 
          console.warn("Batas waktu MutationObserver (5s) tercapai, app-virtualdom masih tidak siap.");
          observer.disconnect();
          observer = null;
          console.log("MutationObserver dihentikan karena timeout.");
          sendResponse({ data: extractedData, success: false, message: "Timeout waiting for target element." });
        }
      }, 5000); 

      return true; 
    }
    return true; 
  }
});

console.log("Content script NDE 'content.js' dimuat dan listener aktif.");

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Ekstensi NDE berhasil diinstal/diupdate.');
  });
}