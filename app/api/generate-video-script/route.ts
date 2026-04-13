import { createGateway } from "@ai-sdk/gateway"
import { generateText } from "ai"

export const runtime = "nodejs"

const DEFAULT_MODEL = process.env.VIDEO_SCRIPT_MODEL || "openai/gpt-4o-mini"

export async function POST(request: Request) {
  const startedAt = Date.now()

  try {
    const body = (await request.json()) as { input?: string }
    const input = body.input?.trim()

    if (!input) {
      return Response.json(
        {
          ok: false,
          error: "Missing input text.",
          status: 400,
        },
        { status: 400 }
      )
    }

    const gatewayApiKey = process.env.APP_BUILDER_VERCEL_AI_GATEWAY

    if (!gatewayApiKey) {
      return Response.json(
        {
          ok: false,
          error:
            "APP_BUILDER_VERCEL_AI_GATEWAY is not set. Add it to your environment before generating scripts.",
          status: 500,
        },
        { status: 500 }
      )
    }

    const gateway = createGateway({
      apiKey: gatewayApiKey,
    })

    const result = await generateText({
      model: gateway(DEFAULT_MODEL),
      system:
        "You are an expert voice-over script writer. Generate a high-quality narration script based on the user's input. The script will be recorded as a voice-over and later attached to a video, so focus on spoken delivery instead of visual shot directions or scene instructions. Understand the topic, tone, sentiment, intent, and likely audience, and reflect them naturally in the wording. Requirements: Write in clear, engaging, emotionally aware spoken-language style. Make the sentiment feel human, natural, and appropriate to the topic. Keep the pacing smooth and easy to narrate aloud. Include a strong opening hook, a clear middle, and a satisfying ending. Avoid robotic wording, filler, repetition, bullet points, stage directions, camera notes, or formatting that sounds unnatural when spoken. Return only the final plain-text narration script.",
      prompt: input,
    })

    return Response.json({
      ok: true,
      script: result.text,
      status: 200,
      provider: "vercel-ai-gateway",
      model: DEFAULT_MODEL,
      finishReason: result.finishReason ?? null,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            totalTokens:
              (result.usage.inputTokens ?? 0) +
              (result.usage.outputTokens ?? 0),
          }
        : undefined,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate video script.",
        status: 500,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    )
  }
}
