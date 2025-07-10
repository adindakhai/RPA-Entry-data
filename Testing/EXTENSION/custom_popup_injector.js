// custom_popup_injector.js
console.log("Custom Popup Injector Script Loaded.");

// Variable to keep track of the popup DOM element
let popupOverlay = null;

// Function to create and display the popup
function displayDataPopup(data) {
    // If a popup already exists, remove it before creating a new one
    if (popupOverlay) {
        popupOverlay.remove();
    }

    // Create the overlay
    popupOverlay = document.createElement('div');
    popupOverlay.className = 'custom-popup-overlay';

    // Create the dialog
    const dialog = document.createElement('div');
    dialog.className = 'custom-popup-dialog';

    // Popup Title
    const title = document.createElement('h2');
    title.textContent = 'Extracted Data Confirmation';
    dialog.appendChild(title);

    // Data items container
    const dataContainer = document.createElement('div');
    dataContainer.className = 'data-items-container'; // For scrolling if content overflows

    // Create and append data items
    // This list should match the fields in popup.html and the data object structure
    const fieldOrder = [
        { key: 'noSPK', label: 'No SPK' },
        { key: 'kelompok', label: 'Kelompok' },
        { key: 'code', label: 'CODE' },
        { key: 'masaPenyelesaianPekerjaan', label: 'Masa Penyelesaian Pekerjaan' },
        { key: 'matriksProgram', label: 'Matriks Program' },
        { key: 'tanggalMatriks', label: 'Tanggal Matriks' },
        { key: 'nomorNdSvpIa', label: 'Nomor ND SVP IA' },
        { key: 'deskripsiNdSvpIa', label: 'Deskripsi ND SVP IA' },
        { key: 'tanggalNdSvpIa', label: 'Tanggal ND SVP IA' },
        { key: 'temuanNdSvpIa', label: 'Temuan ND SVP IA' },
        { key: 'rekomendasiNdSvpIa', label: 'Rekomendasi ND SVP IA' },
        { key: 'nomorNdDirut', label: 'Nomor ND Dirut' },
        { key: 'deskripsiNdDirut', label: 'Deskripsi ND Dirut' },
        { key: 'tanggalNdDirut', label: 'Tanggal ND Dirut' },
        { key: 'temuanNdDirut', label: 'Temuan ND Dirut' },
        { key: 'rekomendasiNdDirut', label: 'Rekomendasi ND Dirut' },
        { key: 'duedateNdDirut', label: 'Duedate ND Dirut' },
        { key: 'picNdDirut', label: 'PIC ND Dirut' },
        { key: 'uicNdDirut', label: 'UIC ND Dirut' },
        { key: 'mtlClosed', label: 'MTL Closed' },
        { key: 'reschedule', label: 'Reschedule' },
        { key: 'overdue', label: 'Overdue' },
        { key: 'onSchedule', label: 'OnSchedule' },
        { key: 'status', label: 'Status' }
    ];

    fieldOrder.forEach(field => {
        const item = document.createElement('div');
        item.className = 'data-item';
        const strong = document.createElement('strong');
        strong.textContent = field.label + ':';
        const span = document.createElement('span');
        const value = data[field.key];
        span.textContent = (value !== undefined && value !== null && value !== "Data belum ditemukan") ? String(value) : 'N/A';
        item.appendChild(strong);
        item.appendChild(span);
        dataContainer.appendChild(item);
    });

    dialog.appendChild(dataContainer);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'popup-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn';
    confirmBtn.textContent = 'Confirm & Send to MTL';
    confirmBtn.onclick = () => {
        console.log("Confirm button clicked. Sending data to ia_telkom_filler.js");
        // Prepare data for MTL, mapping from the received data structure
        // This structure should match what ia_telkom_filler.js expects
        const dataForMTL = {
            no_spk: data.noSPK,
            kelompok: data.kelompok,
            CODE: data.code,
            masaPenyelesaianPekerjaan: data.masaPenyelesaianPekerjaan,
            Matriks_Program: data.matriksProgram,
            Matriks_Tgl: data.tanggalMatriks, // Ensure date format is handled if necessary
            ND_SVP_IA_Nomor: data.nomorNdSvpIa,
            Desc_ND_SVP_IA: data.deskripsiNdSvpIa,
            ND_SVP_IA_Tanggal: data.tanggalNdSvpIa, // Ensure date format
            ND_SVP_IA_Temuan: data.temuanNdSvpIa,
            ND_SVP_IA_Rekomendasi: data.rekomendasiNdSvpIa,
            ND_Dirut_Nomor: data.nomorNdDirut,
            Desc_ND_Dirut: data.deskripsiNdDirut,
            ND_Dirut_Tgl: data.tanggalNdDirut, // Ensure date format
            ND_Dirut_Temuan: data.temuanNdDirut,
            ND_Dirut_Rekomendasi: data.rekomendasiNdDirut,
            ND_Dirut_Duedate1: data.duedateNdDirut, // Ensure date format/select value
            ND_Dirut_Duedate2: '', // Assuming this is not captured or needed for now
            ND_Dirut_PIC: data.picNdDirut,
            ND_Dirut_UIC: data.uicNdDirut,
            MTL_Closed: data.mtlClosed !== undefined ? Number(data.mtlClosed) : 0,
            Reschedule: data.reschedule !== undefined ? Number(data.reschedule) : 0,
            Overdue: data.overdue !== undefined ? Number(data.overdue) : 0,
            OnSchedule: data.onSchedule !== undefined ? Number(data.onSchedule) : 1, // Default to 1 if not specified
            Status: data.status
        };

        // Send message to ia_telkom_filler.js
        chrome.runtime.sendMessage({
            action: "fillMTLForm",
            data: dataForMTL
        }, response => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message to ia_telkom_filler:", chrome.runtime.lastError.message);
                alert("Error sending data to MTL filler: " + chrome.runtime.lastError.message);
            } else if (response && response.success) {
                alert("Data sent to MTL form successfully!");
            } else {
                alert("Failed to send data to MTL form. " + (response ? response.message : "No response."));
            }
        });
        popupOverlay.remove(); // Close popup
        popupOverlay = null;
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
        popupOverlay.remove();
        popupOverlay = null;
    };

    // TODO: Add an Edit button if needed
    // const editBtn = document.createElement('button');
    // editBtn.className = 'edit-btn';
    // editBtn.textContent = 'Edit Data';
    // editBtn.onclick = () => {
    //     // Logic to handle editing - perhaps re-open the original extension popup
    //     // or build an inline editing form. For now, just closes.
    //     console.log("Edit button clicked - functionality not implemented yet.");
    //     popupOverlay.remove();
    //     popupOverlay = null;
    // };

    actions.appendChild(cancelBtn);
    // actions.appendChild(editBtn); // Uncomment when edit functionality is considered
    actions.appendChild(confirmBtn);
    dialog.appendChild(actions);

    popupOverlay.appendChild(dialog);
    document.body.appendChild(popupOverlay);

    // Inject CSS - no longer needed as it's injected via manifest.json
    // if (!document.getElementById('custom-popup-styles')) {
    //     const link = document.createElement('link');
    //     link.id = 'custom-popup-styles';
    //     link.rel = 'stylesheet';
    //     link.type = 'text/css';
    //     link.href = chrome.runtime.getURL('custom_popup.css');
    //     document.head.appendChild(link);
    // }
}

// Listen for messages from popup.js (or background script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "displayCustomPopup") {
        if (request.data) {
            console.log("Received data to display in custom popup:", request.data);
            displayDataPopup(request.data);
            sendResponse({ success: true, message: "Popup displayed." });
        } else {
            console.error("No data received for custom popup.");
            sendResponse({ success: false, message: "No data provided for popup." });
        }
        return true; // Indicates async response if needed
    }
});

console.log("Custom Popup Injector script fully initialized and listener active.");
