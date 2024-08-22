document.getElementById('trackTabButton').addEventListener('click', function() {
    // Query the active tab in the current window
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        // Send a message to the background script to start tracking this tab
        chrome.runtime.sendMessage({action: "trackTab", tabId: activeTab.id, tabTitle: activeTab.title});
        // Update the popup UI
        document.getElementById('status').textContent = `Tracking tab: ${activeTab.title}`;
    });
});
