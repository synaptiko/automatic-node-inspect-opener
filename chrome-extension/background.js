// uses: https://github.com/joewalnes/reconnecting-websocket
var ws = new ReconnectingWebSocket('ws://localhost:8099', null, { automaticOpen: true, reconnectDecay: 1, reconnectInterval: 100 });
var lastOpenedTab;

ws.addEventListener('message', function(event) {
	if (/^chrome-devtools:\/\/devtools/.test(event.data)) {
		chrome.tabs.create({ url: event.data }, (tab) => { lastOpenedTab = tab });
	}
	else if (event.data === 'close' && lastOpenedTab) {
		chrome.tabs.remove(lastOpenedTab.id);
		lastOpenedTab = undefined;
	}
});

ws.addEventListener('close', function () {
	if (lastOpenedTab) {
		chrome.tabs.remove(lastOpenedTab.id);
		lastOpenedTab = undefined;
	}
});
