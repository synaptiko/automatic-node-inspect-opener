#!/usr/bin/env node
const WebSocket = require('ws');
const wss = new WebSocket.Server({
	perMessageDeflate: false,
	port: 8099
});

wss.on('connection', function connection(ws) {
	console.log('new websocket connection');
	ws.on('message', function incoming(data) {
		console.log('new incoming message:', data);

		// Broadcast to everyone else.
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	});
});
