#!/bin/bash

# Default values
RTMP_URL="rtmp://localhost:1935/live/test"
RTSP_PORT=8554
STREAM_PATH="stream"

while getopts ":i:p:s:" opt; do
  case $opt in
    i) RTMP_URL="$OPTARG" ;;
    p) RTSP_PORT="$OPTARG" ;;
    s) STREAM_PATH="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2; exit 1 ;;
  esac
done

echo "Starting RTMP to RTSP conversion with the following parameters:"
echo "  RTMP URL: $RTMP_URL"
echo "  RTSP Port: $RTSP_PORT"
echo "  Stream Path: $STREAM_PATH"

echo "First, make sure to start a source RTMP stream (in another terminal):"
echo "  ./simple_rtmp_server.sh live/test"
echo ""

cleanup() {
  echo "Stopping FFmpeg..."
  if [ ! -z "$PID" ]; then
    kill $PID 2>/dev/null
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting RTSP server on port $RTSP_PORT..."
ffmpeg -f rtsp -rtsp_transport tcp -rtsp_flags listen \
       -i rtsp://0.0.0.0:$RTSP_PORT/$STREAM_PATH \
       -f null - &
PID=$!

sleep 2

echo "RTSP server is listening at rtsp://localhost:$RTSP_PORT/$STREAM_PATH"
echo "Use this URL in your RTSP client (VLC or ffplay)"
echo ""
echo "Starting RTMP to RTSP conversion..."
echo "To stop, press Ctrl+C"
echo ""

ffmpeg -i "$RTMP_URL" \
       -c copy \
       -f rtsp \
       -rtsp_transport tcp \
       rtsp://localhost:$RTSP_PORT/$STREAM_PATH

cleanup 