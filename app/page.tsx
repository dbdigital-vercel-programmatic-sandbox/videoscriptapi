"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  AudioLines,
  Captions,
  FileAudio,
  Sparkles,
  WandSparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  voiceName?: string
  modelId?: string
}

type View = "home" | "script" | "enhance" | "subtitle" | "speech"

type ToolCardProps = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}

const starterPrompt = `Launching a new AI product for small business owners who feel overwhelmed by automation tools. The tone should be confident, modern, and easy to understand.`

function ToolCard({ title, description, icon: Icon, onClick }: ToolCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-44 flex-col justify-between rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <span className="space-y-2">
        <span className="block text-lg font-semibold tracking-tight">{title}</span>
        <span className="block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  )
}

function ToolShell({
  title,
  description,
  onBack,
  children,
}: {
  title: string
  description: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button
        variant="ghost"
        className="w-fit gap-2 px-0 hover:bg-transparent"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      {children}
    </section>
  )
}

function VideoScriptVoiceOverPage() {
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
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Input</h2>
          <p className="text-sm text-muted-foreground">
            Describe the topic, tone, audience, emotion, or goal for the
            voice-over script.
          </p>
        </header>

        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe the video you want..."
          className="min-h-72 resize-y border-border bg-background shadow-none"
        />

        <Button
          size="lg"
          onClick={handleGenerateScript}
          disabled={isGeneratingScript}
          className="w-full sm:w-auto"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGeneratingScript ? "Generating..." : "Generate Video Script"}
        </Button>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Output</h2>
          <p className="text-sm text-muted-foreground">
            Review the generated script, then turn it into an MP3 voice-over.
          </p>
        </header>

        {scriptResult ? (
          <section className="space-y-4">
            <p className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
              <span>
                <span className="font-medium">Status:</span> {scriptResult.status}
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
                  <span className="font-medium">Model:</span> {scriptResult.model}
                </span>
              ) : null}
              {typeof scriptResult.durationMs === "number" ? (
                <span>
                  <span className="font-medium">Duration:</span>{" "}
                  {scriptResult.durationMs}ms
                </span>
              ) : null}
            </p>

            {scriptResult.usage ? (
              <p className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
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
              </p>
            ) : null}

            <section className="space-y-2">
              <h3 className="text-sm font-medium">Response</h3>
              <p className="rounded-2xl bg-muted/70 p-4 text-sm leading-7 whitespace-pre-wrap">
                {scriptResult.ok
                  ? scriptResult.script
                  : (scriptResult.error ?? "Unknown API error.")}
              </p>
            </section>

            {canGenerateVoice ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleGenerateVoiceOver}
                disabled={isGeneratingVoice}
                className="w-full sm:w-auto"
              >
                <AudioLines className="mr-2 h-4 w-4" />
                {isGeneratingVoice
                  ? "Generating voice-over..."
                  : "Generate Voice over"}
              </Button>
            ) : null}
          </section>
        ) : (
          <section className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Generate a script to see the response and voice-over options here.
          </section>
        )}

        {voiceResult ? (
          <section className="space-y-4 border-t border-border pt-6">
            <p className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
              <span>
                <span className="font-medium">Voice status:</span> {voiceResult.status}
              </span>
              <span>
                <span className="font-medium">Success:</span>{" "}
                {voiceResult.ok ? "true" : "false"}
              </span>
              {voiceResult.voiceId ? (
                <span>
                  <span className="font-medium">Voice:</span>{" "}
                  {voiceResult.voiceName
                    ? `${voiceResult.voiceName} (${voiceResult.voiceId})`
                    : voiceResult.voiceId}
                </span>
              ) : null}
              {voiceResult.modelId ? (
                <span>
                  <span className="font-medium">Model:</span> {voiceResult.modelId}
                </span>
              ) : null}
              {typeof voiceResult.durationMs === "number" ? (
                <span>
                  <span className="font-medium">Duration:</span>{" "}
                  {voiceResult.durationMs}ms
                </span>
              ) : null}
            </p>

            {voiceResult.ok && audioUrl ? (
              <section className="space-y-3">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support audio playback.
                </audio>
                <Button asChild variant="outline">
                  <a href={audioUrl} download={downloadName}>
                    Download MP3
                  </a>
                </Button>
              </section>
            ) : (
              <p className="rounded-2xl bg-muted/70 p-4 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                {voiceResult.error ?? "Unknown voice-over API error."}
              </p>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function VideoQualityEnhancePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/8 via-background to-background text-center">
          <div className="space-y-2">
            <WandSparkles className="mx-auto h-10 w-10 text-primary" />
            <p className="text-lg font-semibold">Upload a video to enhance</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Improve sharpness, lighting, and resolution from one clean workflow.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40">
            <p className="font-medium">HD Restore</p>
            <p className="mt-1 text-sm text-muted-foreground">Balanced cleanup for standard footage.</p>
          </button>
          <button className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40">
            <p className="font-medium">4K Upscale</p>
            <p className="mt-1 text-sm text-muted-foreground">Boost detail for premium exports.</p>
          </button>
          <button className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40">
            <p className="font-medium">Low-Light Fix</p>
            <p className="mt-1 text-sm text-muted-foreground">Lift shadows and reduce noise.</p>
          </button>
        </div>

        <Button size="lg" className="w-full sm:w-auto">
          <WandSparkles className="mr-2 h-4 w-4" />
          Start Enhancement
        </Button>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Enhancement Settings</h2>
        <div className="space-y-3">
          <label className="block text-sm font-medium">Output quality</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="rounded-2xl border border-primary bg-primary/10 p-4 text-left text-sm font-medium text-primary">
              High quality
            </button>
            <button className="rounded-2xl border border-border bg-background p-4 text-left text-sm font-medium">
              Fast render
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <p>Expected improvements</p>
          <p>Resolution boost, contrast cleanup, sharper edges, and clearer playback.</p>
        </div>
      </section>
    </section>
  )
}

function VideoSubtitleGenPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Subtitle Setup</h2>
          <p className="text-sm text-muted-foreground">
            Upload your video, choose the language, and create styled subtitles.
          </p>
        </header>

        <Input type="file" className="cursor-pointer" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source language</label>
            <Input defaultValue="English" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subtitle style</label>
            <Input defaultValue="Bold social captions" />
          </div>
        </div>

        <Textarea
          placeholder="Optional notes: highlight keywords, keep captions short, add punctuation..."
          className="min-h-40 resize-y"
        />

        <Button size="lg" className="w-full sm:w-auto">
          <Captions className="mr-2 h-4 w-4" />
          Generate Subtitles
        </Button>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="flex min-h-72 items-end rounded-3xl bg-gradient-to-b from-muted to-card p-5">
          <div className="w-full rounded-2xl bg-black/85 p-4 text-center text-sm font-medium text-white shadow-lg">
            Your generated subtitles will preview here.
          </div>
        </div>
      </section>
    </section>
  )
}

function SpeechToTextPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Audio Source</h2>
          <p className="text-sm text-muted-foreground">
            Upload audio or video and convert spoken content into clean text.
          </p>
        </header>

        <Input type="file" className="cursor-pointer" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language hint</label>
            <Input defaultValue="English" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Speaker labels</label>
            <Input defaultValue="Enable speaker separation" />
          </div>
        </div>

        <Button size="lg" className="w-full sm:w-auto">
          <FileAudio className="mr-2 h-4 w-4" />
          Start Transcription
        </Button>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Transcript</h2>
        <Textarea
          readOnly
          value={`Speaker 1: Welcome back. This panel will show the generated transcript once processing is complete.\n\nSpeaker 2: You can use it as a starting point for summaries, captions, or editing notes.`}
          className="min-h-80 resize-none bg-muted/40"
        />
      </section>
    </section>
  )
}

export default function Page() {
  const [view, setView] = useState<View>("home")

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(255,132,0,0.16),_transparent_35%),linear-gradient(to_bottom,_var(--background),_var(--muted))] px-4 py-8 sm:px-6 sm:py-10">
      {view === "home" ? (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <header className="space-y-3 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Creative AI Toolkit
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Build, enhance, subtitle, and transcribe from one workspace.
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Choose a tool below to work inside a single page flow. Each tool opens
              in place, and the back button returns you to this home screen.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ToolCard
              title="Video Script + Voice over"
              description="Use the current script generation and voice-over flow."
              icon={Sparkles}
              onClick={() => setView("script")}
            />
            <ToolCard
              title="Video Quality Enhance"
              description="Prepare videos for quality repair and upscale workflows."
              icon={WandSparkles}
              onClick={() => setView("enhance")}
            />
            <ToolCard
              title="Video subtitle Gen"
              description="Configure subtitle generation with styling and preview."
              icon={Captions}
              onClick={() => setView("subtitle")}
            />
            <ToolCard
              title="Speech to text"
              description="Upload spoken media and convert it into transcript text."
              icon={FileAudio}
              onClick={() => setView("speech")}
            />
          </section>
        </section>
      ) : null}

      {view === "script" ? (
        <ToolShell
          title="Video Script + Voice over"
          description="Turn a rough idea into a stronger script, then generate a voice-over audio file from it."
          onBack={() => setView("home")}
        >
          <VideoScriptVoiceOverPage />
        </ToolShell>
      ) : null}

      {view === "enhance" ? (
        <ToolShell
          title="Video Quality Enhance"
          description="A dedicated page for improving resolution, clarity, and overall video quality."
          onBack={() => setView("home")}
        >
          <VideoQualityEnhancePage />
        </ToolShell>
      ) : null}

      {view === "subtitle" ? (
        <ToolShell
          title="Video subtitle Gen"
          description="A separate subtitle workflow for language selection, styling, and caption preview."
          onBack={() => setView("home")}
        >
          <VideoSubtitleGenPage />
        </ToolShell>
      ) : null}

      {view === "speech" ? (
        <ToolShell
          title="Speech to text"
          description="A separate transcription page for turning spoken content into text."
          onBack={() => setView("home")}
        >
          <SpeechToTextPage />
        </ToolShell>
      ) : null}
    </main>
  )
}
