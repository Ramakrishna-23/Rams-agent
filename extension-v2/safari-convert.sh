#!/bin/bash
# Convert the Chrome extension to a Safari extension via Xcode
# Prerequisites: macOS with Xcode installed
#
# Usage: ./safari-convert.sh
#
# This script:
# 1. Builds the Chrome extension to dist/
# 2. Runs Apple's safari-web-extension-converter
# 3. Outputs an Xcode project in safari/ that you can open, sign, and build

set -e

echo "Building Chrome extension..."
npm run build

echo "Converting to Safari..."
xcrun safari-web-extension-converter dist/ \
  --project-location safari/ \
  --app-name "Rams Agent" \
  --bundle-identifier com.ramsagent.extension \
  --no-open

echo ""
echo "Safari extension project created in safari/"
echo "Open safari/Rams Agent/Rams Agent.xcodeproj in Xcode, sign, and build."
echo ""
echo "Note: chrome.sidePanel is not available in Safari."
echo "The chat will automatically open in a new tab instead."
