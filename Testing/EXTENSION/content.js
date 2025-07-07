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
      
      // For fields not in this HTML, they will retain "Data belum ditemukan"
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