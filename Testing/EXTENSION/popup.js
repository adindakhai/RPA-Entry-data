// popup.js
// This script now primarily handles the browser action click to initiate data extraction
// and then sends the data to the custom_popup_injector.js on the target page.

document.addEventListener('DOMContentLoaded', () => {
    // This event listener is for when popup.html is actually opened.
    // Since we removed default_popup, this will only run if the user
    // explicitly opens popup.html (e.g., for debugging or future settings).
    // For now, we can keep the core logic for the "Extract Data" button if present.

    const getDataBtn = document.getElementById('get-data-btn');
    const statusError = document.getElementById('status-error'); // For displaying errors within popup.html
    const dataDisplayDiv = document.getElementById('data-display'); // The form area in popup.html

    // Function to display errors in popup.html (if it's open)
    const showPopupError = (message) => {
        if (statusError && dataDisplayDiv) {
            if (!message || message.trim() === "") {
                statusError.style.display = 'none';
                // dataDisplayDiv.style.display = 'block'; // Or hide it depending on flow
                return;
            }
            dataDisplayDiv.style.display = 'none';
            statusError.style.display = 'block';
            const errorText = statusError.querySelector('p:last-child');
            if (errorText) errorText.textContent = message;
        }
        console.error("Popup Error:", message); // Also log to console
    };

    const showPopupLoading = (isLoading) => {
        if (getDataBtn) {
            const icon = getDataBtn.querySelector('i');
            const text = getDataBtn.querySelector('span');
            if (isLoading) {
                if(icon) icon.className = 'fas fa-spinner animate-spin text-sm';
                if(text) text.textContent = 'Extracting...';
                getDataBtn.disabled = true;
            } else {
                if(icon) icon.className = 'fas fa-download text-sm';
                if(text) text.textContent = 'Extract Data';
                getDataBtn.disabled = false;
            }
        }
    };


    if (getDataBtn) {
        getDataBtn.addEventListener('click', async () => {
            triggerDataExtractionAndDisplay();
        });
    }

    // Hide form and error display in popup.html by default if it's opened.
    if (dataDisplayDiv) dataDisplayDiv.style.display = 'none';
    if (statusError) statusError.style.display = 'none';

    // The "Send Data" button in popup.html is no longer primary.
    // Its functionality is moved to custom_popup_injector.js.
    // We can disable or hide it if popup.html is somehow still accessed.
    const sendDataBtn = document.getElementById('send-data-btn');
    if (sendDataBtn) {
        sendDataBtn.disabled = true;
        // sendDataBtn.style.display = 'none'; // Optionally hide it
    }
});


// This function will be called when the browser action (toolbar icon) is clicked.
// It's also called by the button inside popup.html if it's opened.
async function triggerDataExtractionAndDisplay() {
    // Update UI in popup.html if it's open and the button was clicked from there.
    const getDataBtn = document.getElementById('get-data-btn'); // Check if popup.html context
    if (getDataBtn) { // implies popup.html is open
         const statusError = document.getElementById('status-error');
         if (statusError) statusError.style.display = 'none'; // Clear previous errors in popup.html
         showPopupLoading(true);
    }

    try {
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!currentTab) {
            const errorMsg = "No active tab found.";
            if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
            if (getDataBtn) showPopupLoading(false);
            return;
        }

        // Check if the current tab is the NDE page (where data extraction happens)
        // This check might need to be adjusted based on actual NDE page URLs
        const isNdePage = currentTab.url && (
            currentTab.url.includes('nde_mockup.html') ||
            currentTab.url.toLowerCase().endsWith('.mhtml') || // Assuming NDE can be MHTML
            currentTab.url.toLowerCase().includes('notadinas') // Or other NDE identifiers
        );

        if (!isNdePage) {
            const errorMsg = 'Not on a supported NDE page. Please navigate to an NDE document.';
            if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
            if (getDataBtn) showPopupLoading(false);
            return;
        }

        // 1. Send message to content.js on the NDE page to get data
        chrome.tabs.sendMessage(currentTab.id, { action: "getDataFromNDE" }, async (ndeResponse) => {
            if (getDataBtn) showPopupLoading(false); // Stop loading indicator in popup.html

            if (chrome.runtime.lastError) {
                const errorMsg = `Error communicating with NDE page: ${chrome.runtime.lastError.message}. Ensure "Allow access to file URLs" is enabled if it's a local file.`;
                if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                return;
            }

            if (ndeResponse && ndeResponse.success && ndeResponse.data) {
                const extractedData = ndeResponse.data;
                console.log("Data extracted from NDE:", extractedData);

                // 2. Find the "IA Telkom.mhtml" tab
                chrome.tabs.query({ url: "file:///*IA%20Telkom.mhtml" }, (mtlTabs) => {
                    let mtlTab = null;
                    if (mtlTabs && mtlTabs.length > 0) {
                        mtlTab = mtlTabs[0];
                    } else {
                        // Fallback: try finding with space if %20 didn't work (less common for file URLs but good to have)
                        chrome.tabs.query({ url: "file:///*IA Telkom.mhtml" }, (mtlTabsWithSpace) => {
                            if (mtlTabsWithSpace && mtlTabsWithSpace.length > 0) {
                                mtlTab = mtlTabsWithSpace[0];
                            }

                            if (mtlTab) {
                                // 3. Send data to custom_popup_injector.js on the IA Telkom.mhtml page
                                chrome.tabs.sendMessage(mtlTab.id, {
                                    action: "displayCustomPopup",
                                    data: extractedData
                                }, (injectorResponse) => {
                                    if (chrome.runtime.lastError) {
                                        const errorMsg = `Error sending data to IA Telkom page (custom popup): ${chrome.runtime.lastError.message}`;
                                        if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                                        return;
                                    }
                                    if (injectorResponse && injectorResponse.success) {
                                        console.log("Custom popup display initiated on IA Telkom page.");
                                        if (getDataBtn) { // If popup.html is open, maybe show a success message or close it
                                            const dataDisplayDiv = document.getElementById('data-display');
                                            if(dataDisplayDiv) dataDisplayDiv.style.display = 'none'; // Hide form
                                            showPopupError("Data sent to IA Telkom page for confirmation."); // Use error display for status
                                        }
                                        // Optionally close the extension's own popup.html if it was open
                                        // window.close();
                                    } else {
                                        const errorMsg = `IA Telkom page (custom popup) reported an issue: ${injectorResponse ? injectorResponse.message : "Unknown issue."}`;
                                        if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                                    }
                                });
                            } else {
                                const errorMsg = 'IA Telkom.mhtml tab not found. Please open it.';
                                if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                            }
                        });
                        return; // Exit from first callback to avoid processing mtlTab=null if it was found by second query
                    }

                    // This part is reached if the first query for mtlTabs found a tab
                     if (mtlTab) {
                        chrome.tabs.sendMessage(mtlTab.id, {
                            action: "displayCustomPopup",
                            data: extractedData
                        }, (injectorResponse) => {
                            if (chrome.runtime.lastError) {
                                const errorMsg = `Error sending data to IA Telkom page (custom popup): ${chrome.runtime.lastError.message}`;
                                if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                                return;
                            }
                            if (injectorResponse && injectorResponse.success) {
                                console.log("Custom popup display initiated on IA Telkom page.");
                                 if (getDataBtn) {
                                    const dataDisplayDiv = document.getElementById('data-display');
                                    if(dataDisplayDiv) dataDisplayDiv.style.display = 'none';
                                    showPopupError("Data sent to IA Telkom page for confirmation.");
                                }
                                // window.close();
                            } else {
                                const errorMsg = `IA Telkom page (custom popup) reported an issue: ${injectorResponse ? injectorResponse.message : "Unknown issue."}`;
                                if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                            }
                        });
                    } else {
                         const errorMsg = 'IA Telkom.mhtml tab not found. Please open it.';
                         if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
                    }

                });

            } else {
                const errorMsg = `Failed to extract data from NDE page: ${ndeResponse ? ndeResponse.message : "No response or data."}`;
                if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
            }
        });
    } catch (error) {
        if (getDataBtn) showPopupLoading(false);
        const errorMsg = `An unexpected error occurred: ${error.message}`;
        if (getDataBtn) showPopupError(errorMsg); else alert(errorMsg);
        console.error("Unexpected error in popup.js:", error);
    }
}

// Listen for clicks on the browser action icon.
// This is the primary trigger now that default_popup is removed.
chrome.action.onClicked.addListener((tab) => {
    console.log("Browser action icon clicked.");
    triggerDataExtractionAndDisplay();
});
