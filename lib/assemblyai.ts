export interface AssemblyAIConfig {
  apiKey: string
  baseUrl?: string
}

export interface UploadResponse {
  upload_url: string
}

export interface TranscriptResponse {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text?: string
  error?: string
}

export interface TranscriptOptions {
  audio_url: string
  language_code?: string
  speaker_labels?: boolean
}

export class AssemblyAIClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: AssemblyAIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.assemblyai.com/v2'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`
    const headers = {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AssemblyAI API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  async uploadFile(_filePath: string): Promise<UploadResponse> {
    // In a real implementation, we would read and send the file
    // For web APIs, we'd need to handle file uploads differently
    throw new Error('File upload through this method not implemented. Use multipart form upload for API routes.')
  }

  async createTranscript(options: TranscriptOptions): Promise<TranscriptResponse> {
    // Set Hindi as default language if not specified
    const transcriptOptions = {
      ...options,
      language_code: options.language_code || 'hi' // Hindi as default
    }
    
    return this.request<TranscriptResponse>('transcript', {
      method: 'POST',
      body: JSON.stringify(transcriptOptions)
    })
  }

  async getTranscript(transcriptId: string): Promise<TranscriptResponse> {
    return this.request<TranscriptResponse>(`transcript/${transcriptId}`)
  }

  async getSubtitles(transcriptId: string, format: 'srt' | 'vtt', charsPerCaption?: number): Promise<string> {
    const params = new URLSearchParams()
    if (charsPerCaption) {
      params.append('chars_per_caption', charsPerCaption.toString())
    }

    const endpoint = `transcript/${transcriptId}/${format}${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      headers: {
        'Authorization': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get subtitles: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  async pollTranscriptCompletion(transcriptId: string, pollingInterval = 5000): Promise<TranscriptResponse> {
    while (true) {
      const transcript = await this.getTranscript(transcriptId)
      
      if (transcript.status === 'completed' || transcript.status === 'error') {
        return transcript
      }

      await new Promise(resolve => setTimeout(resolve, pollingInterval))
    }
  }
}