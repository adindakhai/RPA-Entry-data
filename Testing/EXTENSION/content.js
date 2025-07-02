// This script runs on all pages specified in manifest.json
console.log("Asisten NDE content script loaded in:", window.location.href);

/**
 * Parses the text content of the NDE page to extract structured data.
 * This is the "smart" logic that replaces simple element ID grabbing.
 * @param {string} textContent The full text content of the page body.
 * @returns {object} The extracted data.
 */
function parseNdeContent(textContent) {
    const data = {
        nomorNota: null,
        perihal: null,
        auditee: null,
        dueDate: null,
        rekomendasi: []
    };

    // Regex to find key information
    const regex = {
        nomor: /Nomor\s*:\s*(C\.Tel\.\S+|Tel\.\S+)/,
        perihal: /Perihal\s*:\s*([\s\S]*?)(?=\n\d\.\s|Menunjuk)/,
        auditee: /Kepada\s*:\s*([\s\S]*?)(?=\n)/,
        dueDate: /paling lambat (Triwulan \w+ Tahun \d{4})/,
        ofiStart: /opportunities for improvement\(OFI\) yang perlu mendapat perhatian Manajemen, sebagai berikut:/
    };

    // Extract simple fields
    data.nomorNota = textContent.match(regex.nomor)?.[1] || null;
    data.perihal = textContent.match(regex.perihal)?.[1]?.trim() || null;
    data.auditee = textContent.match(regex.auditee)?.[1]?.trim() || null;
    data.dueDate = textContent.match(regex.dueDate)?.[1] || null;

    // Extract recommendations (OFI)
    const ofiStartIndex = textContent.search(regex.ofiStart);
    if (ofiStartIndex > -1) {
        const recommendationsText = textContent.substring(ofiStartIndex);
        const recommendationsLines = recommendationsText.split('\n');
        
        // Find lines that start with a letter and a dot (e.g., "a.", "b.")
        recommendationsLines.forEach(line => {
            if (/^[a-z]\.\s/.test(line.trim())) {
                data.rekomendasi.push(line.trim().substring(2).trim());
            }
        });
    }

    // Fallback if regex fails (e.g. for simpler mockups)
    if (!data.nomorNota) data.nomorNota = document.getElementById('nomor-nota')?.textContent.trim();
    if (!data.perihal) data.perihal = document.getElementById('perihal')?.textContent.trim();


    return data;
}


// Listener for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (window.self !== window.top) {
        return; // Ignore messages in iframes
    }

    if (request.action === "getDataFromNDE") {
        console.log("Parsing NDE content...");
        // Instead of getting by ID, get the whole body's text and parse it
        const pageText = document.body.innerText;
        const collectedData = parseNdeContent(pageText);
        
        console.log("Collected data:", collectedData);
        sendResponse({ data: collectedData });
        return true; // Asynchronous response
    }
});


// This part runs on the MTL page to fill the form
if (window.location.href.includes('mtl_mockup.html')) {
    window.addEventListener('DOMContentLoaded', () => {
        chrome.storage.local.get('dataForMTL', (result) => {
            const data = result.dataForMTL;
            if (data) {
                console.log("Found data to fill MTL form:", data);

                // Fill the standard form fields
                document.getElementById('input-nomor-nota').value = data.nomorNota || '';
                document.getElementById('input-perihal').value = data.perihal || '';
                document.getElementById('input-auditee').value = data.auditee || '';
                document.getElementById('input-due-date').value = data.dueDate || '';

                // Dynamically add and fill recommendation fields
                const rekomendasiContainer = document.getElementById('rekomendasi-container');
                const addBtn = document.getElementById('add-rekomendasi-btn');
                
                // Clear any existing recommendation fields
                rekomendasiContainer.innerHTML = '';

                if (data.rekomendasi && data.rekomendasi.length > 0) {
                    data.rekomendasi.forEach((text, index) => {
                        addBtn.click(); // Simulate clicking the "add" button
                        const newTextarea = document.getElementById(`rekomendasi-${index + 1}`);
                        if(newTextarea) newTextarea.value = text;
                    });
                }
                
                // Show a success message
                const statusMessage = document.getElementById('status-message');
                statusMessage.textContent = 'Data telah diisi secara otomatis dari NDE!';
                statusMessage.classList.remove('hidden');
                statusMessage.classList.add('bg-green-500');

                // Clear the data from storage
                chrome.storage.local.remove('dataForMTL', () => {
                    console.log("Data has been cleared from storage.");
                });
            }
        });
    });
}