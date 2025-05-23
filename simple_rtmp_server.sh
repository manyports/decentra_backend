

STREAM_NAME=${1:-"test"}

echo "Starting RTMP test stream for stream name: $STREAM_NAME"

ffmpeg -re \
    -f lavfi \
    -i testsrc=size=640x480:rate=30 \
    -c:v libx264 \
    -profile:v baseline \
    -pix_fmt yuv420p \
    -preset ultrafast \
    -tune zerolatency \
    -f flv \
    "rtmp://localhost:1935/$STREAM_NAME" 