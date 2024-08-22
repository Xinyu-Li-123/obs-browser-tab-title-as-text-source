function updateUI() {
	// send a message to the background script to get the current tab
	chrome.runtime.sendMessage({action: "getTab"}, function(response) {
		if (response.tabId) {
			document.getElementById('status').textContent = `Tracking tab: ${response.tabTitle}`;
		} else {
			document.getElementById('status').textContent = "No tab currently being tracked";
		}
	});
}

document.getElementById('trackTabButton').addEventListener('click', function() {
    // Query the active tab in the current window
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        // Send a message to the background script to start tracking this tab
        chrome.runtime.sendMessage({action: "trackTab", tabId: activeTab.id, tabTitle: activeTab.title}, function(response) {
			// Update the popup UI
			updateUI();
		});
    });
});

// Initialize the popup UI
updateUI();