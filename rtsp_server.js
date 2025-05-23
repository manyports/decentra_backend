const { spawn } = require('child_process');
const http = require('http');

const RTSP_PORT = 8554;

console.log(`Starting RTSP server on port ${RTSP_PORT}...`);

const ffmpeg = spawn('ffmpeg', [
  '-f', 'rtsp',
  '-rtsp_transport', 'tcp',
  '-i', `rtsp://0.0.0.0:${RTSP_PORT}/stream`,
  '-c', 'copy',
  '-f', 'rtsp',
  '-rtsp_transport', 'tcp',
  `rtsp://0.0.0.0:${RTSP_PORT}/output`
]);

ffmpeg.stderr.on('data', (data) => {
  console.log(`RTSP Server: ${data.toString()}`);
});

ffmpeg.on('close', (code) => {
  console.log(`RTSP server exited with code ${code}`);
});

const API_PORT = 8555;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      rtspPort: RTSP_PORT,
      message: 'RTSP server is ready to accept connections'
    }));
    return;
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RTSP Server Status</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>RTSP Server Status</h1>
            <p>RTSP server is running on port ${RTSP_PORT}.</p>
            
            <h2>Connection Information</h2>
            <p>RTSP URL: <code>rtsp://localhost:${RTSP_PORT}/stream</code></p>
            
            <h2>How to view the stream</h2>
            <p>You can view the RTSP stream using VLC or FFplay:</p>
            
            <h3>Using VLC:</h3>
            <pre>vlc rtsp://localhost:${RTSP_PORT}/stream</pre>
            
            <h3>Using FFplay:</h3>
            <pre>ffplay -rtsp_transport tcp rtsp://localhost:${RTSP_PORT}/stream</pre>
            
            <h2>API Endpoints</h2>
            <p>Server status: <a href="/status">/status</a></p>
          </div>
        </body>
      </html>
    `);
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(API_PORT, () => {
  console.log(`RTSP status server running at http://localhost:${API_PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down RTSP server...');
  ffmpeg.kill();
  server.close();
  process.exit();
}); 