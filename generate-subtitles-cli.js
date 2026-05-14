#!/usr/bin/env node

import fs from 'fs'
import fetch from 'node-fetch'

// Simple AssemblyAI client for CLI
class AssemblyAIClient {
  constructor(apiKey, baseUrl = 'https://api.assemblyai.com/v2') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async uploadFile(filePath) {
    const fileBuffer = fs.readFileSync(filePath)
    
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createTranscript(audioUrl) {
    const response = await fetch(`${this.baseUrl}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audio_url: audioUrl })
    })

    if (!response.ok) {
      throw new Error(`Transcript creation failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getTranscript(transcriptId) {
    const response = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get transcript: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getSubtitles(transcriptId, format = 'srt', charsPerCaption) {
    const params = new URLSearchParams()
    if (charsPerCaption) {
      params.append('chars_per_caption', charsPerCaption.toString())
    }

    const url = `${this.baseUrl}/transcript/${transcriptId}/${format}${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get subtitles: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  async pollTranscriptCompletion(transcriptId, pollingInterval = 5000) {
    while (true) {
      const transcript = await this.getTranscript(transcriptId)
      
      if (transcript.status === 'completed' || transcript.status === 'error') {
        return transcript
      }

      console.log(`Status: ${transcript.status}`)
      await new Promise(resolve => setTimeout(resolve, pollingInterval))
    }
  }
}

async function extractSubtitles(options) {
  const client = new AssemblyAIClient(options.apiKey, options.baseUrl || 'https://api.assemblyai.com/v2')

  console.log(`Uploading ${options.file}...`)

  try {
    // Step 1: Upload file
    const uploadData = await client.uploadFile(options.file)
    const audioUrl = uploadData.upload_url

    console.log(`File uploaded. Starting transcription...`)

    // Step 2: Create transcription request
    const transcript = await client.createTranscript(audioUrl)

    console.log(`Transcription started with ID: ${transcript.id}`)

    // Step 3: Poll for completion
    console.log(`Polling for completion...`)
    const completedTranscript = await client.pollTranscriptCompletion(transcript.id)

    if (completedTranscript.status === 'error') {
      throw new Error(`Transcription failed: ${completedTranscript.error}`)
    }

    console.log(`Transcription completed!`)

    // Step 4: Download subtitles
    console.log(`Downloading ${options.format} subtitles...`)
    const subtitles = await client.getSubtitles(
      transcript.id, 
      options.format, 
      options.charsPerCaption
    )

    // Step 5: Save output
    const outputPath = options.output || `subtitles.${options.format}`
    fs.writeFileSync(outputPath, subtitles)
    
    console.log(`\n✅ Subtitles saved to: ${outputPath}`)
    console.log(`📝 Transcript ID: ${transcript.id}`)
    console.log(`🔤 Transcript characters: ${completedTranscript.text?.length || 0}`)

    return { 
      success: true, 
      outputPath,
      transcriptId: transcript.id
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    format: 'srt'
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--file':
      case '-f':
        options.file = args[++i]
        break
      case '--api-key':
      case '-k':
        options.apiKey = args[++i]
        break
      case '--format':
        options.format = args[++i]
        break
      case '--output':
      case '-o':
        options.output = args[++i]
        break
      case '--chars-per-caption':
      case '-c':
        options.charsPerCaption = parseInt(args[++i])
        break
      case '--eu':
        options.baseUrl = 'https://api.eu.assemblyai.com/v2'
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
    }
  }

  // Try to get API key from environment if not provided
  if (!options.apiKey && process.env.ASSEMBLYAI_API_KEY) {
    options.apiKey = process.env.ASSEMBLYAI_API_KEY
  }

  return options
}

function printHelp() {
  console.log(`
Video Subtitle Generator using AssemblyAI

Usage: node generate-subtitles-cli.js [options]

Options:
  -f, --file <path>          Path to video file (mp4, mkv, mov, etc.) [Required]
  -k, --api-key <key>        AssemblyAI API key [Required or set ASSEMBLYAI_API_KEY env]
  -o, --output <path>        Output file path (default: subtitles.srt)
  --format <srt|vtt>         Subtitles format (default: srt)
  -c, --chars-per-caption <n> Character limit per caption
  --eu                       Use EU data residency endpoint
  -h, --help                 Show this help message

Examples:
  node generate-subtitles-cli.js --file video.mp4 --api-key YOUR_API_KEY
  node generate-subtitles-cli.js --file video.mp4 --api-key YOUR_API_KEY --format vtt
  node generate-subtitles-cli.js --file video.mp4 --api-key YOUR_API_KEY --chars-per-caption 32

Environment variables:
  ASSEMBLYAI_API_KEY         AssemblyAI API key (alternative to --api-key)

Note: You can get an API key at https://www.assemblyai.com/dashboard
`)
}

async function main() {
  const options = parseArgs()

  if (!options.file) {
    console.error('Error: --file option is required')
    printHelp()
    process.exit(1)
  }

  if (!options.apiKey) {
    console.error('Error: API key is required. Use --api-key or set ASSEMBLYAI_API_KEY environment variable')
    printHelp()
    process.exit(1)
  }

  if (!fs.existsSync(options.file)) {
    console.error(`Error: File not found: ${options.file}`)
    process.exit(1)
  }

  console.log('='.repeat(50))
  console.log('AssemblyAI Video Subtitle Generator')
  console.log('='.repeat(50))

  const result = await extractSubtitles(options)
  
  if (!result.success) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error(`\n💥 Fatal error: ${error.message}`)
  process.exit(1)
})