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
        // First check if the tab is recording
        const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_STATUS" });
        if (response && (response.status === 'recording' || response.status === 'paused')) {
            await chrome.tabs.sendMessage(tab.id, { action: "STOP_RECORDING" });
        } else {
            // Not recording, just toggle the dock visibility
            await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_UI" });
        }
    } catch (err) {
        // If it fails, the script isn't there yet. Inject it.
        console.log("[Screen Recorder] Script not found, injecting...", err);
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
        chrome.action.setBadgeText({ text: '' });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "UPDATE_STATUS") {
        const { status, time } = request;
        if (status === 'recording') {
            const mins = Math.floor(time / 60);
            const secs = time % 60;
            const text = `${mins}:${secs.toString().padStart(2, '0')}`;
            chrome.action.setBadgeText({ text });
            chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    }
});
