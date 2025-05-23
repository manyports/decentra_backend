const NodeMediaServer = require('node-media-server');
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');
const RtmpToRtspConverter = require('./rtmp_to_rtsp');

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
const converter = new RtmpToRtspConverter();

converter.on('log', (data) => {
  console.log(`Conversion ${data.id} log: ${data.log}`);
});

converter.on('ended', (data) => {
  console.log(`Conversion ${data.id} ended with status: ${data.status}`);
});

converter.on('stopped', (data) => {
  console.log(`Conversion ${data.id} was stopped`);
});

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
  const path = parsedUrl.pathname;
  
  if (req.method === 'GET' && path === '/streams') {
    const streams = Array.from(activeStreams.entries()).map(([id, stream]) => ({
      id,
      path: stream.path,
      rtmpUrl: `rtmp://localhost:1935/${stream.path}`
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(streams));
    return;
  }
  
  if (req.method === 'POST' && path === '/streams') {
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
  
  if (req.method === 'DELETE' && path.startsWith('/streams/')) {
    const streamId = path.split('/').pop();
    
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
  
  if (req.method === 'GET' && path === '/conversions') {
    const conversions = converter.getConversions();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(conversions));
    return;
  }
  
  if (req.method === 'POST' && path === '/conversions') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        
        if (!data.rtmpUrl) {
          throw new Error('rtmpUrl is required');
        }
        
        const rtspPort = data.rtspPort || 8554;
        const streamPath = data.streamPath || `stream_${Date.now().toString(36)}`;
        
        const conversion = converter.startConversion(
          data.rtmpUrl,
          rtspPort,
          streamPath
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(conversion));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    return;
  }
  
  if (req.method === 'GET' && path.startsWith('/conversions/')) {
    const parts = path.split('/');
    if (parts.length === 3) {
      const conversionId = parts[2];
      const conversion = converter.getConversion(conversionId);
      
      if (conversion) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(conversion));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Conversion not found' }));
      }
    } else if (parts.length === 4 && parts[3] === 'logs') {
      const conversionId = parts[2];
      const logs = converter.getLogs(conversionId);
      
      if (logs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Conversion not found' }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid path' }));
    }
    
    return;
  }
  
  if (req.method === 'DELETE' && path.startsWith('/conversions/')) {
    const conversionId = path.split('/').pop();
    const success = converter.stopConversion(conversionId);
    
    if (success) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Conversion stopped successfully' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Conversion not found' }));
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
  console.log('  GET    /conversions - List all RTMP to RTSP conversions');
  console.log('  POST   /conversions - Start a new RTMP to RTSP conversion');
  console.log('  GET    /conversions/:id - Get a specific conversion');
  console.log('  GET    /conversions/:id/logs - Get logs for a specific conversion');
  console.log('  DELETE /conversions/:id - Stop a conversion');
});

process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  for (const [id, stream] of activeStreams.entries()) {
    console.log(`Stopping stream ${id}`);
    stream.process.kill();
  }

  console.log('Stopping all conversions...');
  converter.stopAll();

  nms.stop();
  apiServer.close();
  
  console.log('Goodbye!');
  process.exit();
}); 