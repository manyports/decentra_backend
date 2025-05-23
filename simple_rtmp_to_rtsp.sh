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

echo "Starting RTMP to RTSP conversion with the following parameters:"
echo "  RTMP URL: $RTMP_URL"
echo "  RTSP Port: $RTSP_PORT"
echo "  Stream Path: $STREAM_PATH"

ffmpeg -i "$RTMP_URL" \
       -c copy \
       -f rtsp \
       -rtsp_transport tcp \
       -rtsp_flags listen \
       rtsp://0.0.0.0:$RTSP_PORT/$STREAM_PATH
