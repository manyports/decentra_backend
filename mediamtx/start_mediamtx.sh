#!/bin/bash

echo "Starting MediaMTX RTMP/RTSP server..."
cd "$(dirname "$0")"
./mediamtx ./mediamtx.yml 