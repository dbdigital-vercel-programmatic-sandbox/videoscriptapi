#!/bin/bash

# Debug script for testing the subtitle generation API
echo "Testing /api/generate-subtitles endpoint..."

# Create a small test file (empty 1KB file)
dd if=/dev/zero of=test_video.mp4 bs=1024 count=1 2>/dev/null

# Test 1: Check endpoint with HEAD
echo -e "\n1. Testing endpoint with HEAD request:"
curl -I http://localhost:3000/api/generate-subtitles 2>/dev/null | grep -E "(HTTP|Content-Type|Allow)"

# Test 2: Try POST without API key (should fail gracefully)
echo -e "\n2. Testing POST without API key (should show error message):"
curl -X POST \
  -F "file=@test_video.mp4" \
  -F "format=srt" \
  -F "languageCode=hi" \
  -w "\nStatus: %{http_code}\nContent-Type: %{content_type}\n" \
  http://localhost:3000/api/generate-subtitles 2>/dev/null | head -50

# Test 3: Check if API key is set
echo -e "\n3. Checking if ASSEMBLYAI_API_KEY is set:"
if [ -z "$ASSEMBLYAI_API_KEY" ]; then
  echo "ASSEMBLYAI_API_KEY is not set in environment"
  echo "Set it with: export ASSEMBLYAI_API_KEY=your_key"
else
  echo "API key is set (first 10 chars: ${ASSEMBLYAI_API_KEY:0:10}...)"
fi

# Test 4: Direct test to AssemblyAI
echo -e "\n4. Testing direct AssemblyAI API (without your server):"
if [ -n "$ASSEMBLYAI_API_KEY" ]; then
  echo "Testing AssemblyAI upload endpoint..."
  curl -s \
    -X POST \
    -H "Authorization: $ASSEMBLYAI_API_KEY" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @test_video.mp4 \
    https://api.assemblyai.com/v2/upload 2>/dev/null | head -5
else
  echo "Skipping - no API key"
fi

# Clean up
rm -f test_video.mp4

echo -e "\nDebug complete. Check output above for issues."