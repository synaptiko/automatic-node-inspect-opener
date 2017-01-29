#!/usr/bin/env node

// How to use?
// 1. ./ws.js
// 2. node --inspect --debug run.js 2>&1 > /dev/null | ./pipe-to-me.js
// or
// 2. npm install -g forever
// 3. forever -c "node --inspect --debug-brk" run.js 2>&1 > /dev/null | ./pipe-to-me.js

const WebSocket = require('ws');
const byline = require('byline');
const async = require('async');
const ws = new WebSocket('ws://localhost:8099', {
	perMessageDeflate: false
});
let connected = false;
const openedUrls = [];
const messages = [];

ws.on('open', function open() {
	connected = true;

	if (messages.length > 0) {
		messages.splice(0, messages.length).forEach(function(message) {
			ws.send(message);
		});
	}
});

ws.on('close', function() {
	connected = false;
	end();
});

ws.on('error', function(error) {
	console.log('an error occured while connecting/connected to the websocket');
	connected = false;
	end();
});

function publish(message, callback) {
	message = JSON.stringify(message);
	if (connected) {
		ws.send(message, callback);
	}
	else {
		messages.push(message);
	}
}

function end() {
	if (connected) {
		if (openedUrls.length > 0) {
			async.every(openedUrls.splice(0, openedUrls.length), function(url, callback) {
				publish({ action: 'close', url: url }, function (err) {
					callback(err, !err);
				});
			}, function(err, result) {
				ws.close();
			});
		}
		else {
			ws.close();
		}
	}
	else {
		process.exit(0);
	}
}

byline.createStream(process.stdin).on('data', function(line) {
	let url;

	line = line.toString('utf-8').trim();

	if (/^chrome-devtools:\/\/devtools/.test(line)) {
		url = line;
		openedUrls.push(url);
		publish({ action: 'open', url: url });
	}
	else if (line === 'Waiting for the debugger to disconnect...' && openedUrls.length > 0) {
		url = openedUrls.pop();
		publish({ action: 'close', url: url });
	}
});
process.stdin.pipe(process.stdout);

process.stdin.on('end', end);
process.on('SIGINT', end);
process.on('SIGTERM', end);
