// uses: https://github.com/joewalnes/reconnecting-websocket
const ws = new ReconnectingWebSocket('ws://localhost:8099', null, { automaticOpen: true, reconnectDecay: 1, reconnectInterval: 100 });
const openedTabs = {};

ws.addEventListener('message', function(event) {
	let message;

	try {
		message = JSON.parse(event.data);
	}
	catch (err) {
		console.error('Error when parsing incoming data:', err);
	}

	if (message) {
		if (message.action === 'open') {
			chrome.tabs.create({ url: message.url }, (tab) => {
				openedTabs[message.url] = tab;
			});
		}
		else if (message.action === 'close' && openedTabs[message.url]) {
			chrome.tabs.remove(openedTabs[message.url].id);
			delete openedTabs[message.url];
		}
	}
});

ws.addEventListener('close', function () {
	Object.keys(openedTabs).forEach(function(url) {
		chrome.tabs.remove(openedTabs[url].id);
		delete openedTabs[url];
	});
});
