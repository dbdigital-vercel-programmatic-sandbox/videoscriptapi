import { AssemblyAIClient } from "@/lib/assemblyai"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const startedAt = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const format = formData.get("format") as string || "srt"
    const charsPerCaption = formData.get("charsPerCaption") as string
    const languageCode = formData.get("languageCode") as string
    const speakerLabels = formData.get("speakerLabels") === "true"

    if (!file) {
      return Response.json(
        {
          ok: false,
          error: "Missing video file.",
          status: 400,
        },
        { status: 400 }
      )
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY

    if (!apiKey) {
      return Response.json(
        {
          ok: false,
          error: "ASSEMBLYAI_API_KEY is not set. Add it to your environment before generating subtitles.",
          status: 500,
        },
        { status: 500 }
      )
    }

    const client = new AssemblyAIClient({ apiKey })

    // Step 1: Upload file to AssemblyAI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/octet-stream"
      },
      body: Buffer.from(await file.arrayBuffer())
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      return Response.json(
        {
          ok: false,
          error: `Failed to upload file: ${errorText}`,
          status: uploadResponse.status,
        },
        { status: uploadResponse.status }
      )
    }

    const uploadData = await uploadResponse.json()
    const audioUrl = uploadData.upload_url

    // Step 2: Create transcription request
    const transcript = await client.createTranscript({
      audio_url: audioUrl,
      language_code: languageCode,
      speaker_labels: speakerLabels
    })

    const transcriptId = transcript.id

    // Step 3: Poll for completion
    let completedTranscript
    try {
      completedTranscript = await client.pollTranscriptCompletion(transcriptId)
    } catch (pollError) {
      return Response.json(
        {
          ok: false,
          error: `Failed to poll for transcript completion: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`,
          status: 500,
          transcriptId,
        },
        { status: 500 }
      )
    }

    if (completedTranscript.status === 'error') {
      return Response.json(
        {
          ok: false,
          error: completedTranscript.error || 'Transcript processing failed',
          status: 500,
          transcriptId,
        },
        { status: 500 }
      )
    }

    // Step 4: Download subtitles
    const subtitleFormat = format === 'vtt' ? 'vtt' : 'srt'
    const subtitleOptions = charsPerCaption ? parseInt(charsPerCaption) : undefined
    const subtitles = await client.getSubtitles(transcriptId, subtitleFormat, subtitleOptions)

    return Response.json({
      ok: true,
      status: 200,
      subtitles,
      format: subtitleFormat,
      transcriptId,
      transcriptText: completedTranscript.text || '',
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate subtitles.",
        status: 500,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    )
  }
}