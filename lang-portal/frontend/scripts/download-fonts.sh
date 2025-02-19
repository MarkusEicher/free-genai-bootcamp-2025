#!/bin/bash

# Directory setup
FONT_DIR="public/fonts"
INTER_DIR="$FONT_DIR/inter"
ROBOTO_DIR="$FONT_DIR/roboto"

# Create directories if they don't exist
mkdir -p "$INTER_DIR"
mkdir -p "$ROBOTO_DIR"

# Download Inter fonts
echo "Downloading Inter fonts..."
curl -L -o "$INTER_DIR/Inter-Regular.woff2" "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2"
curl -L -o "$INTER_DIR/Inter-Medium.woff2" "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.woff2"
curl -L -o "$INTER_DIR/Inter-Bold.woff2" "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.woff2"

# Download Roboto fonts (directly in WOFF2 format)
echo "Downloading Roboto fonts..."
curl -L -o "$ROBOTO_DIR/Roboto-Regular.woff2" "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.woff2"
curl -L -o "$ROBOTO_DIR/Roboto-Medium.woff2" "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vBQ.woff2"
curl -L -o "$ROBOTO_DIR/Roboto-Bold.woff2" "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvBQ.woff2"

echo "Font download complete!" 