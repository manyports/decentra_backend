const NodeMediaServer = require('node-media-server');

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

process.on('SIGINT', () => {
  console.log('Shutting down RTMP server...');
  nms.stop();
  process.exit();
}); 