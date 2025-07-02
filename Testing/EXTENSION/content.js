// This script runs on all pages specified in manifest.json

console.log("Asisten NDE content script loaded in:", window.location.href);

// Function to safely get text content from an element by its ID
// It now accepts a document context (main document or iframe document)
const getTextById = (doc, id) => {
    if (!doc) {
        console.warn(`Cannot search for ID '${id}' in a null document.`);
        return null;
    }
    const element = doc.getElementById(id);
    if (!element) {
        console.warn(`Element with ID '${id}' not found in document:`, doc.location.href);
        return null;
    }
    return element.textContent.trim();
};

// Listener for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // IMPORTANT: Only the script in the main (top) frame should handle this message.
    // This prevents scripts in iframes from also trying to respond, which causes a race condition.
    if (window.self !== window.top) {
        // If this is an iframe, do nothing.
        console.log("Content script in iframe ignores the message.");
        return; 
    }

    // This part handles the data retrieval on the NDE page
    if (request.action === "getDataFromNDE") {
        console.log("Content script in TOP FRAME received request: getDataFromNDE");
        
        // Data from the main document
        const nomorNota = getTextById(document, 'nomor-nota');
        const perihal = getTextById(document, 'perihal');
        const pengirim = getTextById(document, 'pengirim');

        // Data from the i-frame
        const iframe = document.getElementById('lampiran-iframe');
        const iframeDoc = iframe ? iframe.contentDocument : null;
        const idLampiran = getTextById(iframeDoc, 'id-lampiran');
        
        const collectedData = {
            nomorNota,
            perihal,
            pengirim,
            idLampiran
        };

        console.log("Collected data from top frame:", collectedData);
        
        // Send the collected data back to the popup
        sendResponse({
            data: collectedData
        });
        // Must return true to indicate an asynchronous response.
        return true; 
    }
});


// This part runs automatically when the MTL page loads to fill the form
// We check the URL to make sure this code only runs on the target page
if (window.location.href.includes('mtl_mockup.html')) {
    // Use a DOMContentLoaded listener to ensure the form is ready
    window.addEventListener('DOMContentLoaded', () => {
        chrome.storage.local.get('dataForMTL', (result) => {
            const data = result.dataForMTL;
            if (data) {
                console.log("Found data in storage to fill MTL form:", data);
                
                // Fill the form fields
                document.getElementById('input-no-spk').value = data.nomorNota || '';
                document.getElementById('input-nomor-nd-svp-ia').value = data.pengirim || '';
                document.getElementById('input-deskripsi-nd-svp-ia').value = data.perihal || '';
                document.getElementById('input-id-lampiran').value = data.idLampiran || '';

                // Show a success message
                const statusMessage = document.getElementById('status-message');
                statusMessage.textContent = 'Data telah diisi secara otomatis dari NDE!';
                statusMessage.classList.remove('hidden');
                statusMessage.classList.add('bg-green-500');

                // IMPORTANT: Remove the data from storage so it doesn't get used again
                chrome.storage.local.remove('dataForMTL', () => {
                    console.log("Data has been cleared from storage.");
                });
            }
        });
    });
}
