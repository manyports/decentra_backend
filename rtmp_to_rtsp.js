const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');

class RtmpToRtspConverter extends EventEmitter {
  constructor() {
    super();
    this.conversions = new Map();
    this.mediaMtxProcess = null;
  }

  /**
   * Check if MediaMTX RTSP server is running
   * @param {number} rtspPort - The RTSP port to check (default 8554)
   * @returns {Promise<boolean>} - Whether the MediaMTX RTSP server is running
   */
  checkMediaMtxRunning(rtspPort = 8554) {
    return new Promise((resolve) => {
      const client = new net.Socket();
      const timeout = 1000; 
      
      client.setTimeout(timeout);
      
      client.on('connect', () => {
        client.destroy();
        resolve(true);
      });
      
      client.on('timeout', () => {
        client.destroy();
        resolve(false);
      });
      
      client.on('error', () => {
        client.destroy();
        resolve(false);
      });
      
      client.connect(rtspPort, 'localhost');
    });
  }

  /**
   * Start MediaMTX server
   * @returns {Promise<boolean>} - Whether MediaMTX was started successfully
   */
  startMediaMtx() {
    return new Promise((resolve) => {
      try {
        const mediaMtxDir = path.join(process.cwd(), 'mediamtx');
        
        if (!fs.existsSync(mediaMtxDir)) {
          console.error('MediaMTX directory not found:', mediaMtxDir);
          return resolve(false);
        }
        
        let executable = 'mediamtx';
        if (process.platform === 'win32') {
          executable = 'mediamtx.exe';
        }
        
        const mediaMtxPath = path.join(mediaMtxDir, executable);
        
        if (!fs.existsSync(mediaMtxPath)) {
          console.error('MediaMTX executable not found:', mediaMtxPath);
          return resolve(false);
        }
        
        console.log('Starting MediaMTX from', mediaMtxPath);
        
        this.mediaMtxProcess = spawn(mediaMtxPath, [], {
          cwd: mediaMtxDir,
          detached: true,
          stdio: 'ignore'
        });
        
        this.mediaMtxProcess.unref();
        
        setTimeout(async () => {
          const running = await this.checkMediaMtxRunning();
          resolve(running);
        }, 2000);
        
      } catch (error) {
        console.error('Error starting MediaMTX:', error);
        resolve(false);
      }
    });
  }

  /**
   * Ensure MediaMTX is running, start it if needed
   * @returns {Promise<boolean>} - Whether MediaMTX is running
   */
  async ensureMediaMtxRunning() {
    let isRunning = await this.checkMediaMtxRunning();
    
    if (!isRunning) {
      console.log('MediaMTX not running, attempting to start it...');
      isRunning = await this.startMediaMtx();
      
      if (isRunning) {
        console.log('MediaMTX started successfully');
      } else {
        console.error('Failed to start MediaMTX');
      }
    } else {
      console.log('MediaMTX is already running');
    }
    
    return isRunning;
  }

  /**
   * Start a new RTMP to RTSP conversion
   * @param {string} rtmpUrl - The RTMP URL to convert from
   * @param {number} rtspPort - The RTSP port to stream to
   * @param {string} streamPath - The RTSP stream path
   * @returns {Object} - Conversion details
   */
  async startConversion(rtmpUrl, rtspPort = 8554, streamPath = 'stream') {
    const isMediaMtxRunning = await this.ensureMediaMtxRunning();
    
    if (!isMediaMtxRunning) {
      throw new Error('Could not start MediaMTX RTSP server automatically. Please check if MediaMTX is installed correctly.');
    }
    
    const id = Date.now().toString(36);
    const rtspUrl = `rtsp://localhost:${rtspPort}/${streamPath}`;
    
    console.log(`Starting RTMP to RTSP conversion for ${rtmpUrl} to ${rtspUrl}`);
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', rtmpUrl,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-f', 'rtsp',
      '-rtsp_transport', 'tcp',
      rtspUrl
    ]);
    
    const conversionInfo = {
      id,
      rtmpUrl,
      rtspUrl,
      rtspPort,
      streamPath,
      process: ffmpeg,
      status: 'running',
      startTime: new Date(),
      logs: []
    };
    
    this.conversions.set(id, conversionInfo);
    
    ffmpeg.stderr.on('data', (data) => {
      const log = data.toString();
      console.log(`[${id}] FFmpeg: ${log}`);
      conversionInfo.logs.push({
        timestamp: new Date(),
        message: log
      });
      
      this.emit('log', {
        id,
        log,
        timestamp: new Date()
      });
    });
    
    ffmpeg.on('close', (code) => {
      console.log(`[${id}] FFmpeg process exited with code ${code}`);
      conversionInfo.status = code === 0 ? 'completed' : 'failed';
      conversionInfo.endTime = new Date();
      
      this.emit('ended', {
        id,
        exitCode: code,
        status: conversionInfo.status
      });
    });
    
    const result = { ...conversionInfo };
    delete result.process;
    delete result.logs;
    
    return result;
  }
  
  /**
   * Stop a running conversion
   * @param {string} id - The conversion ID
   * @returns {boolean} - Whether the conversion was stopped
   */
  stopConversion(id) {
    if (!this.conversions.has(id)) {
      return false;
    }
    
    const conversion = this.conversions.get(id);
    if (conversion.process) {
      conversion.process.kill();
      conversion.status = 'stopped';
      conversion.endTime = new Date();
      this.emit('stopped', { id });
    }
    
    return true;
  }
  
  /**
   * Get all conversions
   * @returns {Array} - List of conversions
   */
  getConversions() {
    return Array.from(this.conversions.entries()).map(([id, conversion]) => {
      const result = { ...conversion };
      delete result.process; // Don't expose the process object
      return result;
    });
  }
  
  /**
   * Get a specific conversion
   * @param {string} id - The conversion ID
   * @returns {Object|null} - Conversion details or null if not found
   */
  getConversion(id) {
    if (!this.conversions.has(id)) {
      return null;
    }
    
    const conversion = this.conversions.get(id);
    const result = { ...conversion };
    delete result.process; // Don't expose the process object
    
    return result;
  }
  
  /**
   * Get logs for a specific conversion
   * @param {string} id - The conversion ID
   * @returns {Array|null} - Array of logs or null if conversion not found
   */
  getLogs(id) {
    if (!this.conversions.has(id)) {
      return null;
    }
    
    return this.conversions.get(id).logs;
  }
  
  stopAll() {
    for (const [id, conversion] of this.conversions.entries()) {
      if (conversion.process && conversion.status === 'running') {
        conversion.process.kill();
        conversion.status = 'stopped';
        conversion.endTime = new Date();
        this.emit('stopped', { id });
      }
    }
    
    if (this.mediaMtxProcess) {
      try {
        process.kill(-this.mediaMtxProcess.pid);
      } catch (error) {
        console.error('Error stopping MediaMTX:', error);
      }
      this.mediaMtxProcess = null;
    }
  }
}

module.exports = RtmpToRtspConverter; 