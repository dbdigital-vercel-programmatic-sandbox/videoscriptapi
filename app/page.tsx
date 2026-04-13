"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type ScriptResponse = {
  ok: boolean
  script?: string
  error?: string
  status: number
  model?: string
  provider?: string
  finishReason?: string | null
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
  durationMs?: number
}

type VoiceResponse = {
  ok: boolean
  error?: string
  status: number
  fileName?: string
  contentType?: string
  audioBase64?: string
  durationMs?: number
  voiceId?: string
  modelId?: string
}

const starterPrompt = `Launching a new AI product for small business owners who feel overwhelmed by automation tools. The tone should be confident, modern, and easy to understand.`

export default function Page() {
  const [input, setInput] = useState(starterPrompt)
  const [scriptResult, setScriptResult] = useState<ScriptResponse | null>(null)
  const [voiceResult, setVoiceResult] = useState<VoiceResponse | null>(null)
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const canGenerateVoice = Boolean(scriptResult?.ok && scriptResult.script)

  const downloadName = useMemo(() => {
    return voiceResult?.fileName ?? "voice-over.mp3"
  }, [voiceResult?.fileName])

  async function handleGenerateScript() {
    if (!input.trim()) {
      setScriptResult({
        ok: false,
        error: "Please enter some text before generating a video script.",
        status: 400,
      })
      setVoiceResult(null)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      return
    }

    setIsGeneratingScript(true)
    setScriptResult(null)
    setVoiceResult(null)

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    try {
      const response = await fetch("/api/generate-video-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      })

      const data = (await response.json()) as ScriptResponse
      setScriptResult({
        ...data,
        status: response.status,
      })
    } catch (error) {
      setScriptResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to call the video script API.",
        status: 500,
      })
    } finally {
      setIsGeneratingScript(false)
    }
  }

  async function handleGenerateVoiceOver() {
    if (!scriptResult?.script) {
      return
    }

    setIsGeneratingVoice(true)
    setVoiceResult(null)

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    try {
      const response = await fetch("/api/generate-voice-over", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: scriptResult.script }),
      })

      const data = (await response.json()) as VoiceResponse

      if (data.ok && data.audioBase64) {
        const binaryString = atob(data.audioBase64)
        const bytes = Uint8Array.from(binaryString, (char) =>
          char.charCodeAt(0)
        )
        const blob = new Blob([bytes], {
          type: data.contentType ?? "audio/mpeg",
        })

        setAudioUrl(URL.createObjectURL(blob))
      }

      setVoiceResult({
        ...data,
        status: response.status,
      })
    } catch (error) {
      setVoiceResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to call the voice-over API.",
        status: 500,
      })
    } finally {
      setIsGeneratingVoice(false)
    }
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(255,132,0,0.18),_transparent_30%),linear-gradient(to_bottom,_var(--background),_var(--color-muted))] px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight">
            Video Script Generator
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Turn a rough idea into a strong voice-over script with better
            sentiment and natural narration flow, then generate an MP3 from it.
          </p>
        </div>

        <Card className="border-primary/20 bg-card/95 shadow-[0_24px_80px_-36px_rgba(255,132,0,0.55)] backdrop-blur">
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>
              Describe the topic, tone, audience, emotion, or goal for the
              voice-over script.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe the video you want..."
              className="min-h-52 resize-y border-primary/20 focus-visible:ring-primary/30"
            />

            <Button
              size="lg"
              onClick={handleGenerateScript}
              disabled={isGeneratingScript}
              className="w-full sm:w-auto"
            >
              {isGeneratingScript ? "Generating..." : "Generate Video Script"}
            </Button>

            {scriptResult ? (
              <section className="space-y-4 rounded-xl border border-primary/20 bg-[color:color-mix(in_srgb,var(--color-background)_82%,#ff8400_18%)] p-4">
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
                  <span>
                    <span className="font-medium">Status:</span>{" "}
                    {scriptResult.status}
                  </span>
                  <span>
                    <span className="font-medium">Success:</span>{" "}
                    {scriptResult.ok ? "true" : "false"}
                  </span>
                  {scriptResult.provider ? (
                    <span>
                      <span className="font-medium">Provider:</span>{" "}
                      {scriptResult.provider}
                    </span>
                  ) : null}
                  {scriptResult.model ? (
                    <span>
                      <span className="font-medium">Model:</span>{" "}
                      {scriptResult.model}
                    </span>
                  ) : null}
                  {typeof scriptResult.durationMs === "number" ? (
                    <span>
                      <span className="font-medium">Duration:</span>{" "}
                      {scriptResult.durationMs}ms
                    </span>
                  ) : null}
                </div>

                {scriptResult.usage ? (
                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
                    {typeof scriptResult.usage.inputTokens === "number" ? (
                      <span>
                        <span className="font-medium">Input tokens:</span>{" "}
                        {scriptResult.usage.inputTokens}
                      </span>
                    ) : null}
                    {typeof scriptResult.usage.outputTokens === "number" ? (
                      <span>
                        <span className="font-medium">Output tokens:</span>{" "}
                        {scriptResult.usage.outputTokens}
                      </span>
                    ) : null}
                    {typeof scriptResult.usage.totalTokens === "number" ? (
                      <span>
                        <span className="font-medium">Total tokens:</span>{" "}
                        {scriptResult.usage.totalTokens}
                      </span>
                    ) : null}
                    {scriptResult.finishReason ? (
                      <span>
                        <span className="font-medium">Finish reason:</span>{" "}
                        {scriptResult.finishReason}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h2 className="text-sm font-medium">Response</h2>
                  <div className="rounded-lg bg-background p-4 text-sm leading-7 whitespace-pre-wrap ring-1 ring-primary/20">
                    {scriptResult.ok
                      ? scriptResult.script
                      : (scriptResult.error ?? "Unknown API error.")}
                  </div>
                </div>

                {canGenerateVoice ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleGenerateVoiceOver}
                    disabled={isGeneratingVoice}
                    className="w-full sm:w-auto"
                  >
                    {isGeneratingVoice
                      ? "Generating voice-over..."
                      : "Generate Voice over"}
                  </Button>
                ) : null}
              </section>
            ) : null}

            {voiceResult ? (
              <section className="space-y-4 rounded-xl border border-primary/20 bg-background p-4 shadow-[0_18px_48px_-34px_rgba(255,132,0,0.6)]">
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
                  <span>
                    <span className="font-medium">Voice status:</span>{" "}
                    {voiceResult.status}
                  </span>
                  <span>
                    <span className="font-medium">Success:</span>{" "}
                    {voiceResult.ok ? "true" : "false"}
                  </span>
                  {voiceResult.voiceId ? (
                    <span>
                      <span className="font-medium">Voice ID:</span>{" "}
                      {voiceResult.voiceId}
                    </span>
                  ) : null}
                  {voiceResult.modelId ? (
                    <span>
                      <span className="font-medium">Model:</span>{" "}
                      {voiceResult.modelId}
                    </span>
                  ) : null}
                  {typeof voiceResult.durationMs === "number" ? (
                    <span>
                      <span className="font-medium">Duration:</span>{" "}
                      {voiceResult.durationMs}ms
                    </span>
                  ) : null}
                </div>

                {voiceResult.ok && audioUrl ? (
                  <div className="space-y-3">
                    <audio controls className="w-full" src={audioUrl}>
                      Your browser does not support audio playback.
                    </audio>
                    <Button asChild variant="outline">
                      <a href={audioUrl} download={downloadName}>
                        Download MP3
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/40 p-4 text-sm leading-7 whitespace-pre-wrap ring-1 ring-primary/20">
                    {voiceResult.error ?? "Unknown voice-over API error."}
                  </div>
                )}
              </section>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
