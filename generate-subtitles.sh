#!/bin/bash

# Video Subtitle Generator using AssemblyAI
# Usage: ./generate-subtitles.sh video.mp4 [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    echo -e "${BLUE}Video Subtitle Generator using AssemblyAI${NC}"
    echo ""
    echo "Usage:"
    echo "  export ASSEMBLYAI_API_KEY=your_api_key"
    echo "  ./generate-subtitles.sh video.mp4 [options]"
    echo ""
    echo "Options:"
    echo "  -o, --output <path>        Output file path (default: subtitles.srt)"
    echo "  --format <srt|vtt>         Subtitles format (default: srt)"
    echo "  -c, --chars-per-caption <n> Character limit per caption"
    echo "  -l, --language <code>     Language code (default: hi - Hindi)"
    echo "  --eu                       Use EU data residency endpoint"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./generate-subtitles.sh video.mp4"
    echo "  ./generate-subtitles.sh video.mp4 --format vtt"
    echo "  ./generate-subtitles.sh video.mp4 -c 32 -o output.srt"
    echo "  ./generate-subtitles.sh video.mp4 --language en"
    echo ""
    echo "Note: Get API key at https://www.assemblyai.com/dashboard"
}

# Parse arguments
FILE=""
OUTPUT="subtitles.srt"
FORMAT="srt"
CHARS_PER_CAPTION=""
LANGUAGE="hi"  # Hindi as default
BASE_URL="https://api.assemblyai.com"

# Check for API key
if [ -z "$ASSEMBLYAI_API_KEY" ]; then
    echo -e "${RED}Error: ASSEMBLYAI_API_KEY environment variable is not set${NC}"
    echo "Set it with: export ASSEMBLYAI_API_KEY=your_api_key"
    exit 1
fi

if [ $# -eq 0 ]; then
    print_help
    exit 0
fi

FILE="$1"
shift

# Parse options
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            print_help
            exit 0
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            if [ "$FORMAT" != "srt" ] && [ "$FORMAT" != "vtt" ]; then
                echo -e "${RED}Error: Format must be 'srt' or 'vtt'${NC}"
                exit 1
            fi
            shift 2
            ;;
        -c|--chars-per-caption)
            CHARS_PER_CAPTION="$2"
            shift 2
            ;;
        -l|--language)
            LANGUAGE="$2"
            shift 2
            ;;
        --eu)
            BASE_URL="https://api.eu.assemblyai.com/v2"
            shift
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            print_help
            exit 1
            ;;
    esac
done

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo -e "${RED}Error: File not found: $FILE${NC}"
    exit 1
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}📺 AssemblyAI Video Subtitle Generator${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}📁 File:${NC} $FILE"
echo -e "${YELLOW}🔑 API Key:${NC} ${ASSEMBLYAI_API_KEY:0:10}..."
echo -e "${YELLOW}🌍 Endpoint:${NC} $BASE_URL"
echo -e "${YELLOW}📄 Format:${NC} $FORMAT"
if [ -n "$CHARS_PER_CAPTION" ]; then
    echo -e "${YELLOW}🔤 Chars per caption:${NC} $CHARS_PER_CAPTION"
fi
echo ""

# Step 1: Upload the video file
echo -e "${BLUE}[1/4] Uploading video file...${NC}"
UPLOAD_RESPONSE=$(curl --silent --request POST \
  --url "$BASE_URL/v2/upload" \
  --header "Authorization: $ASSEMBLYAI_API_KEY" \
  --header "Content-Type: application/octet-stream" \
  --data-binary @"$FILE")

UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload_url')

if [ -z "$UPLOAD_URL" ] || [ "$UPLOAD_URL" = "null" ]; then
    echo -e "${RED}Error: Failed to upload file${NC}"
    echo "$UPLOAD_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Upload successful!${NC}"
echo "Upload URL: ${UPLOAD_URL:0:50}..."

# Step 2: Create transcription request
echo -e "${BLUE}[2/4] Creating transcription request...${NC}"
TRANSCRIPT_JSON="{\"audio_url\": \"$UPLOAD_URL\"}"
TRANSCRIPT_RESPONSE=$(curl --silent --request POST \
  --url "$BASE_URL/v2/transcript" \
  --header "Authorization: $ASSEMBLYAI_API_KEY" \
  --header "Content-Type: application/json" \
  --data "$TRANSCRIPT_JSON")

TRANSCRIPT_ID=$(echo "$TRANSCRIPT_RESPONSE" | jq -r '.id')

if [ -z "$TRANSCRIPT_ID" ] || [ "$TRANSCRIPT_ID" = "null" ]; then
    echo -e "${RED}Error: Failed to create transcript${NC}"
    echo "$TRANSCRIPT_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Transcription started!${NC}"
echo "Transcript ID: $TRANSCRIPT_ID"

# Step 3: Poll for completion
echo -e "${BLUE}[3/4] Waiting for transcription to complete...${NC}"
echo -e "${YELLOW}This may take a while depending on video length${NC}"

while true; do
    STATUS_RESPONSE=$(curl --silent \
      --url "$BASE_URL/v2/transcript/$TRANSCRIPT_ID" \
      --header "Authorization: $ASSEMBLYAI_API_KEY")
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    echo -n -e "\rStatus: $STATUS"
    
    if [ "$STATUS" = "completed" ] || [ "$STATUS" = "error" ]; then
        echo ""
        if [ "$STATUS" = "error" ]; then
            ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.error')
            echo -e "${RED}Error: Transcription failed: $ERROR${NC}"
            exit 1
        fi
        break
    fi
    
    sleep 5
done

echo -e "${GREEN}✅ Transcription completed!${NC}"

# Step 4: Download subtitles
echo -e "${BLUE}[4/4] Downloading $FORMAT subtitles...${NC}"

PARAMS=""
if [ -n "$CHARS_PER_CAPTION" ]; then
    PARAMS="?chars_per_caption=$CHARS_PER_CAPTION"
fi

curl --silent --request GET \
  --url "$BASE_URL/transcript/$TRANSCRIPT_ID/$FORMAT$PARAMS" \
  --header "Authorization: $ASSEMBLYAI_API_KEY" \
  --output "$OUTPUT"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Subtitles saved to: $OUTPUT${NC}"
    
    # Show preview of subtitles
    echo ""
    echo -e "${BLUE}📝 Subtitles preview:${NC}"
    head -20 "$OUTPUT"
else
    echo -e "${RED}Error: Failed to download subtitles${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}🎉 All done! You can now use the subtitles file:${NC}"
echo -e "${YELLOW}$OUTPUT${NC}"
echo -e "${BLUE}==================================================${NC}"