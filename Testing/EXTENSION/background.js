// Testing/EXTENSION/background.js

// Listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("NDE Data Assistant (IA Telkom mode) installed/updated.");
});

// This background script doesn't need to do much for the current IA Telkom functionality
// as popup.js directly opens the new tab and ia_telkom_filler.js reads from storage.

// If we were to implement a more complex data passing mechanism (e.g., message passing
// initiated by ia_telkom_filler.js to request data), then this background script
// would play a more active role in relaying messages or managing data.

// For now, it's mostly a placeholder to ensure the extension loads correctly,
// as manifest.json declares a background service worker.
// It can also be used for future features or debugging.
console.log("Background service worker for NDE Data Assistant (IA Telkom mode) started.");
