#!/bin/bash

STREAM_NAME="test"

if [ ! -z "$1" ]; then
  STREAM_NAME="$1"
fi

echo "Starting test RTMP stream with name: $STREAM_NAME"
echo "Using ffmpeg to generate a test pattern and send it to the server..."
echo ""
echo "RTMP URL: rtmp://localhost:1936/$STREAM_NAME"
echo "RTSP URL: rtsp://localhost:8554/$STREAM_NAME"
echo ""
echo "To view the RTSP stream, run in another terminal:"
echo "ffplay -rtsp_transport tcp rtsp://localhost:8554/$STREAM_NAME"
echo ""
echo "To stop the test stream, press Ctrl+C"

ffmpeg -re \
  -f lavfi \
  -i testsrc=size=640x480:rate=30 \
  -c:v libx264 \
  -profile:v baseline \
  -pix_fmt yuv420p \
  -preset ultrafast \
  -tune zerolatency \
  -f flv \
  "rtmp://localhost:1936/$STREAM_NAME" 