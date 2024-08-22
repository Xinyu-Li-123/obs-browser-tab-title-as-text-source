let ws;
let started = false;
let trackedHandler = null;
let trackedTabId = null;
let trackedTabName = null;
let targetObsInputName = "Playlist"; // Replace with your text source name in OBS
let refreshInterval = 5000; // Interval to check tab status (in milliseconds)


function connectToOBS() {
    const obsWebSocketUrl = "ws://localhost:4455";
    // const password = "your_obs_password"; // Replace with your OBS WebSocket password

    ws = new WebSocket(obsWebSocketUrl);

    ws.onopen = function() {
        console.log("Connected to OBS WebSocket");
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        console.log("OBS Message:", message);

        // Handle Hello and Reidentify message
        if (message.op === 0 || message.op === 3) {
            console.log("Received Hello or Reidentify message, responding with Identify");
            // Send OpCode 1 Identify as a response to OpCode 0 Hello
            // if there is an authentication field in Hello, we currently don't support that
            if (message.d.authentication) {
                console.error("Authentication is not supported in this example");
                return;
            } else {
                ws.send(JSON.stringify({
                    "op": 1,
                    "d": {
                        "rpcVersion": message.d.rpcVersion
                    }
                }));
            }
        }
        // Reception of OpCode 2 Identified indicates successful connection and authentication
        else if (message.op === 2) {
            console.log("Authenticated with OBS WebSocket");
			startTrackingAudioTabs();
        }
    };

    ws.onclose = function() {
        console.log("Disconnected from OBS WebSocket");
    };

    ws.onerror = function(error) {
        console.error("WebSocket Error:", error);
    };
}

// Track all tabs that are outputting audio
function trackAudioTabs() {
    chrome.tabs.query({audible: true}, function(tabs) {
        console.log("Tabs currently playing audio:");
        tabs.forEach(tab => {
            console.log(`Tab ID: ${tab.id}, Title: ${tab.title}, URL: ${tab.url}`);
			console.log(tab);
            // Here you could send the tab title or URL to OBS via WebSocket if needed
            // For example:
            // updateOBSTextSource(tab.title);
        });
    });
}

// Continuously track audio tabs
function startTrackingAudioTabs() {
	if (started) return;
	started = true;
	// Listen for messages from popup or other parts of the extension
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.action === "trackTab") {
			trackedTabId = request.tabId;
			console.log(`Started tracking tab ID: ${trackedTabId} (${request.tabTitle})`);
			if (trackedHandler) {
				clearInterval(trackedHandler);
			}
			trackedHandler = trackSpecificTab(trackedTabId);
		}
	});
}

// Function to track the specified tab (e.g., check if it's audible)
function trackSpecificTab(tabId) {
    console.log(`Tracking tab with ID: ${tabId}`);

    // Set an interval to regularly check the status of the tracked tab
	callbackFn = function() {
        chrome.tabs.get(tabId, function(tab) {
            if (chrome.runtime.lastError || !tab) {
                console.error(`Tab with ID ${tabId} no longer exists or an error occurred.`);
				trackedTabId = null;
				trackedTabName = null;
                return;
            }

			if (trackedTabName === tab.title) {
				// Tab hasn't changed, no need to update
				return;
			}
			trackedTabName = tab.title;

            // console.log(`Tab ${tab.title} is currently ${tab.audible ? 'audible' : 'not audible'}`);
            
			updateOBSTextSource(tab.title, targetObsInputName);
            // if (tab.audible) {
            //     // For example, send tab's title to OBS
            //     updateOBSTextSource(tab.title, targetObsInputName);
            // }
        });
    }
	callbackFn(); // Run once immediately
    return setInterval(callbackFn, refreshInterval); // Adjust the interval as needed (currently set to 5 seconds)
}

// Example function to update a text source in OBS
function updateOBSTextSource(text, obsInputName) {
	console.log(`Updating OBS text source "${obsInputName}" with text: ${text}`);
	// return;
    const request = {
        "op": 6, // Request command
        "d": {
            "requestType": "SetInputSettings",
            "requestId": "setTextSource",
            "requestData": {
                "inputName": obsInputName, // Replace with your text source name in OBS
                "inputSettings": {
                    "text": text
                }
            }
        }
    };
    ws.send(JSON.stringify(request));
}

// Start OBS connection and tracking
connectToOBS();
