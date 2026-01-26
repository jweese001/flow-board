#!/bin/bash

# FlowBoard Animation Export - PNG Sequence to Video
# Usage: ./sequence-to-video.sh <frames_folder> [fps] [output_name]

set -e

# Default values
FPS="${2:-24}"
OUTPUT="${3:-animation}"

# Check for frames folder argument
if [ -z "$1" ]; then
    echo "Usage: ./sequence-to-video.sh <frames_folder> [fps] [output_name]"
    echo ""
    echo "Arguments:"
    echo "  frames_folder  Path to folder containing frame_00000.png, frame_00001.png, etc."
    echo "  fps            Frames per second (default: 24)"
    echo "  output_name    Output filename without extension (default: animation)"
    echo ""
    echo "Examples:"
    echo "  ./sequence-to-video.sh ./frames"
    echo "  ./sequence-to-video.sh ./frames 30 my_animation"
    echo ""
    echo "Outputs:"
    echo "  - {output_name}.mp4  (H.264, web-compatible)"
    echo "  - {output_name}.webm (VP9, smaller file size)"
    exit 1
fi

FRAMES_DIR="$1"

# Check if frames directory exists
if [ ! -d "$FRAMES_DIR" ]; then
    echo "Error: Frames directory not found: $FRAMES_DIR"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed."
    echo ""
    echo "Install with:"
    echo "  macOS:  brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    exit 1
fi

# Count frames
FRAME_COUNT=$(ls -1 "$FRAMES_DIR"/frame_*.png 2>/dev/null | wc -l | tr -d ' ')

if [ "$FRAME_COUNT" -eq 0 ]; then
    echo "Error: No frame_*.png files found in $FRAMES_DIR"
    exit 1
fi

echo "Found $FRAME_COUNT frames at ${FPS}fps"
echo ""

# Calculate duration
DURATION=$(echo "scale=2; $FRAME_COUNT / $FPS" | bc)
echo "Animation duration: ${DURATION}s"
echo ""

# Export to MP4 (H.264 - widely compatible)
echo "Encoding MP4 (H.264)..."
ffmpeg -y -framerate "$FPS" \
    -i "$FRAMES_DIR/frame_%05d.png" \
    -c:v libx264 \
    -preset slow \
    -crf 18 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    "${OUTPUT}.mp4"
echo "Created: ${OUTPUT}.mp4"
echo ""

# Export to WebM (VP9 - smaller, modern browsers)
echo "Encoding WebM (VP9)..."
ffmpeg -y -framerate "$FPS" \
    -i "$FRAMES_DIR/frame_%05d.png" \
    -c:v libvpx-vp9 \
    -crf 30 \
    -b:v 0 \
    -pix_fmt yuv420p \
    "${OUTPUT}.webm"
echo "Created: ${OUTPUT}.webm"
echo ""

# Show file sizes
echo "Output files:"
ls -lh "${OUTPUT}.mp4" "${OUTPUT}.webm"
echo ""
echo "Done!"
