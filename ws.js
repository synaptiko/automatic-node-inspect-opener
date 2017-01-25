#!/usr/bin/env node

// How to use?
// npm install -g forever
// forever -c "node --inspect --debug-brk" run.js 2>&1 > /dev/null | ./ws.js

var
	byline = require('byline'),
	WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({ port: 8099 }),
	wsList = [],
	unsentMessage;

function removeMe() {
	if (wsList.indexOf(this) !== -1) {
		wsList.splice(wsList.indexOf(this), 1);
	}
}

function pushToAll(message) {
	if (wsList.length > 0) {
		wsList.forEach(function(ws) {
			ws.send(message);
		});
	}
	else {
		unsentMessage = message;
	}
}

wss.on('connection', function connection(ws) {
	ws.on('close', removeMe.bind(ws));
	ws.on('error', removeMe.bind(ws));
	ws.on('unexpected-response', removeMe.bind(ws));

	wsList.push(ws);

	if (unsentMessage) {
		pushToAll(unsentMessage);
		unsentMessage = undefined;
	}
});

byline.createStream(process.stdin).on('data', function(line) {
	line = line.toString('utf-8').trim();
	if (/^chrome-devtools:\/\/devtools/.test(line)) {
		pushToAll(line.trim());
	}
	else if (line === 'Waiting for the debugger to disconnect...') {
		pushToAll('close');
	}
});
process.stdin.pipe(process.stdout);
