const NodeMediaServer = require('node-media-server');
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};

console.log('Starting RTMP Server on port 1935...');
const nms = new NodeMediaServer(config);
nms.run();

console.log('RTMP server running at rtmp://localhost:1935');
console.log('HTTP server running at http://localhost:8000');

const activeStreams = new Map();

const apiServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'GET' && parsedUrl.pathname === '/streams') {
    const streams = Array.from(activeStreams.entries()).map(([id, stream]) => ({
      id,
      path: stream.path,
      rtmpUrl: `rtmp://localhost:1935/${stream.path}`
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(streams));
    return;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/streams') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const streamName = data.name || `stream_${Date.now().toString(36)}`;
        const streamPath = data.path || `live/${streamName}`;
        const streamId = Date.now().toString(36);
        
        const ffmpeg = spawn('ffmpeg', [
          '-re',
          '-f', 'lavfi',
          '-i', 'testsrc=size=640x480:rate=30',
          '-c:v', 'libx264',
          '-profile:v', 'baseline',
          '-pix_fmt', 'yuv420p',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-f', 'flv',
          `rtmp://localhost:1935/${streamPath}`
        ]);
        
        activeStreams.set(streamId, {
          process: ffmpeg,
          path: streamPath,
          name: streamName
        });
        
        ffmpeg.stderr.on('data', (data) => {
          console.log(`FFmpeg output: ${data}`);
        });
        
        ffmpeg.on('close', (code) => {
          console.log(`FFmpeg process exited with code ${code}`);
          activeStreams.delete(streamId);
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: streamId,
          path: streamPath,
          rtmpUrl: `rtmp://localhost:1935/${streamPath}`,
          name: streamName
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    return;
  }
  
  if (req.method === 'DELETE' && parsedUrl.pathname.startsWith('/streams/')) {
    const streamId = parsedUrl.pathname.split('/').pop();
    
    if (activeStreams.has(streamId)) {
      const stream = activeStreams.get(streamId);
      stream.process.kill();
      activeStreams.delete(streamId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Stream stopped successfully' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Stream not found' }));
    }
    
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const API_PORT = 8001;
apiServer.listen(API_PORT, () => {
  console.log(`API server running at http://localhost:${API_PORT}`);
  console.log('Available endpoints:');
  console.log('  GET    /streams - List all streams');
  console.log('  POST   /streams - Create a new test stream');
  console.log('  DELETE /streams/:id - Stop a test stream');
});

process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  for (const [id, stream] of activeStreams.entries()) {
    console.log(`Stopping stream ${id}`);
    stream.process.kill();
  }

  nms.stop();
  apiServer.close();
  
  console.log('Goodbye!');
  process.exit();
}); 