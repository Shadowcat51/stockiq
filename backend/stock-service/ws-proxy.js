const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
  ws: true,
  target: 'http://127.0.0.1:8000'
});

proxy.on('error', function (err, req, res) {
  console.log('Proxy HTTP error:', err.message);
  if (res && res.writeHead) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Proxy error.');
  }
});

const server = http.createServer(function(req, res) {
  proxy.web(req, res);
});

// Listen to the `upgrade` event and proxy the WebSocket requests
server.on('upgrade', function (req, socket, head) {
  socket.on('error', (err) => console.log('Socket error:', err.message));
  proxy.ws(req, socket, head, (err) => {
    console.log('Proxy WS error:', err.message);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

console.log("Starting Node.js Proxy on port 8001...");
console.log("This bypasses the Windows Firewall block on python.exe");
server.listen(8001, '0.0.0.0');
