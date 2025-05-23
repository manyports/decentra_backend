#!/bin/bash

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

JSON_DATA="{\"rtmpUrl\":\"$RTMP_URL\",\"rtspPort\":$RTSP_PORT,\"streamPath\":\"$STREAM_PATH\"}"

echo "Starting RTMP to RTSP conversion with the following parameters:"
echo "  RTMP URL: $RTMP_URL"
echo "  RTSP Port: $RTSP_PORT"
echo "  Stream Path: $STREAM_PATH"

echo "Sending request to API..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$JSON_DATA" http://localhost:8001/conversions)

CONVERSION_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CONVERSION_ID" ]; then
  echo "Failed to start conversion. Response:"
  echo $RESPONSE
  exit 1
fi

echo "Conversion started with ID: $CONVERSION_ID"
echo "RTSP URL: rtsp://localhost:$RTSP_PORT/$STREAM_PATH"
echo ""
echo "To view the stream with FFplay, run:"
echo "  ffplay -rtsp_transport tcp rtsp://localhost:$RTSP_PORT/$STREAM_PATH"
echo ""
echo "To view the stream with VLC, run:"
echo "  vlc rtsp://localhost:$RTSP_PORT/$STREAM_PATH"
echo ""
echo "To stop the conversion, press Ctrl+C"

trap "echo 'Stopping conversion...'; curl -s -X DELETE http://localhost:8001/conversions/$CONVERSION_ID; echo 'Conversion stopped.'; exit 0" INT

while true; do
  sleep 1
done 