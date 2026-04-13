export const runtime = "nodejs"

const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"
const DEFAULT_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"

export async function POST(request: Request) {
  const startedAt = Date.now()

  try {
    const body = (await request.json()) as { text?: string }
    const text = body.text?.trim()

    if (!text) {
      return Response.json(
        {
          ok: false,
          error: "Missing text for voice-over generation.",
          status: 400,
        },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return Response.json(
        {
          ok: false,
          error:
            "ELEVENLABS_API_KEY is not set. Add it to your environment before generating voice-over.",
          status: 500,
        },
        { status: 500 }
      )
    }

    const elevenResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: DEFAULT_MODEL_ID,
          output_format: "mp3_44100_128",
        }),
      }
    )

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text()

      return Response.json(
        {
          ok: false,
          error: errorText || "ElevenLabs request failed.",
          status: elevenResponse.status,
          durationMs: Date.now() - startedAt,
          voiceId: DEFAULT_VOICE_ID,
          modelId: DEFAULT_MODEL_ID,
        },
        { status: elevenResponse.status }
      )
    }

    const arrayBuffer = await elevenResponse.arrayBuffer()
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64")

    return Response.json({
      ok: true,
      status: 200,
      fileName: "voice-over.mp3",
      contentType: elevenResponse.headers.get("content-type") || "audio/mpeg",
      audioBase64,
      durationMs: Date.now() - startedAt,
      voiceId: DEFAULT_VOICE_ID,
      modelId: DEFAULT_MODEL_ID,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate voice-over.",
        status: 500,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    )
  }
}
