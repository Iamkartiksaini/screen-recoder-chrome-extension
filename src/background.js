import contentScriptPath from './content.jsx?script'

let activeTabId = null;

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id || !tab.url || !tab.url.startsWith('http')) return;

    // Cleanup previous tab if different
    if (activeTabId && activeTabId !== tab.id) {
        try {
            await chrome.tabs.sendMessage(activeTabId, { action: "REMOVE_UI" });
        } catch (e) {
            // Ignore error if previous tab is closed or script unavailable
        }
    }

    activeTabId = tab.id;

    try {
        // 1. Try to send a toggle message to see if it's already there
        await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_UI" });
    } catch (err) {
        // 2. If it fails, the script isn't there yet. Inject it.
        console.log("[Screen Recorder] Script not found, injecting...");
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [contentScriptPath]
            });
        } catch (injectErr) {
            console.error("Injection failed:", injectErr);
        }
    }
});

// Optional: Listen for tab removal to clear state
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        activeTabId = null;
    }
});
