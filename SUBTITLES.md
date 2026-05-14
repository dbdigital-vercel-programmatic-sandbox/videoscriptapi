# Video Subtitle Generation with AssemblyAI

This feature provides both a web API and a CLI tool to extract subtitles (SRT/VTT format) from video files using AssemblyAI's speech-to-text service.

## Setup

### 1. Get an AssemblyAI API Key
1. Sign up at [assemblyai.com](https://www.assemblyai.com)
2. Get your API key from the [dashboard](https://www.assemblyai.com/dashboard)
3. Free tier provides **185 hours** of transcription

### 2. Configure Environment Variables
Add this to your `.env.local` file:
```bash
ASSEMBLYAI_API_KEY=your_api_key_here
```

## Usage

### Web API Endpoint

**Endpoint:** `POST /api/generate-subtitles`

**Form Data:**
- `file`: Video file (mp4, mkv, mov, webm, etc.)
- `format`: Subtitle format ('srt' or 'vtt', default: 'srt')
- `charsPerCaption`: Character limit per caption (optional)
- `languageCode`: Language code (default: 'hi' - Hindi)
- `speakerLabels`: Enable speaker diarization ('true' or 'false')

**Example using curl:**
```bash
curl -X POST \
  -F "file=@/path/to/video.mp4" \
  -F "format=srt" \
  -F "charsPerCaption=32" \
  http://localhost:3000/api/generate-subtitles
```

**Response:**
```json
{
  "ok": true,
  "status": 200,
  "subtitles": "1\n00:00:00,000 --> 00:00:03,500\nWelcome to the video...",
  "format": "srt",
  "transcriptId": "abc123def456",
  "transcriptText": "Welcome to the video tutorial...",
  "durationMs": 45000
}
```

### Bash CLI Tool

**Available commands:**
```bash
# Set API key
export ASSEMBLYAI_API_KEY=your_api_key

# Basic usage (automatically uses Hindi as default)
./generate-subtitles.sh video.mp4

# With options
./generate-subtitles.sh video.mp4 --format vtt
./generate-subtitles.sh video.mp4 -c 32 -o output.srt

# EU data residency
export ASSEMBLYAI_EU=1
./generate-subtitles.sh video.mp4
```

**Note:** By default, Hindi (`hi`) is used for transcription. The bash tool doesn't currently support changing languages, but you can modify the script or use the web API if you need a different language.

**Full CLI help:**
```bash
./generate-subtitles.sh --help
```

**Full CLI help:**
```bash
node generate-subtitles.js --help
```

## Features

- **Direct Video Processing**: Uploads video files directly - no audio extraction needed
- **Multiple Formats**: SRT and VTT subtitle formats
- **Customizable**: Character limits, language selection, speaker labels
- **Error Handling**: Comprehensive error handling with detailed messages
- **EU Data Residency**: Option to use EU endpoint (`api.eu.assemblyai.com`)

## Languages Supported

**Default language: Hindi (`hi`)**

AssemblyAI supports over 100 languages including:
- Hindi (`hi`) - Default
- English (`en`)
- Spanish (`es`)
- French (`fr`)
- German (`de`)
- Japanese (`ja`)
- Chinese (`zh`)
- Arabic (`ar`)
- [Full list](https://www.assemblyai.com/docs/api-reference/transcription-languages)

## Pricing

| Tier | Cost |
|---|---|
| Base (Batch) | ~$0.15/hr |
| Universal-3 Pro (Batch) | ~$0.21/hr |
| Streaming | ~$0.45/hr |

Free tier: 185 hours per month

## Implementation Details

### Files Created:
- `lib/assemblyai.ts`: AssemblyAI API client
- `app/api/generate-subtitles/route.ts`: Next.js API route
- `generate-subtitles.sh`: Bash CLI tool

### API Flow:
1. **Upload**: Video file uploaded to AssemblyAI
2. **Transcription**: Speech-to-text conversion
3. **Polling**: Wait for completion (5-second intervals)
4. **Download**: Retrieve subtitles in requested format

### Error Handling:
- Missing API key
- Invalid video files
- Network failures
- Transcription errors
- Invalid parameters

## Examples

**SRT Output:**
```
1
00:00:00,000 --> 00:00:03,500
Welcome to the video tutorial.

2
00:00:03,500 --> 00:00:07,200
Today we will learn about subtitles.
```

**VTT Output:**
```
WEBVTT

00:00:00.000 --> 00:00:03.500
Welcome to the video tutorial.

00:00:03.500 --> 00:00:07.200
Today we will learn about subtitles.
```

## Testing

Test with a short video file (< 30 seconds for quick results):

```bash
# Set API key
export ASSEMBLYAI_API_KEY=your_api_key

# Test with sample video
./generate-subtitles.sh sample.mp4
```

Check output file `subtitles.srt` for results.

## Notes

- **Authorization**: Uses bare API key (no "Bearer" prefix)
- **Supported formats**: mp4, mkv, mov, webm, avi, m4a, wav, mp3
- **Polling interval**: Default 5 seconds
- **Status values**: `queued` → `processing` → `completed` (or `error`)
- **Max file size**: 5GB for API uploads