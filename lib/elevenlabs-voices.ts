export type ElevenLabsVoice = {
  id: string
  name: string
  description: string
  category: string
  language: string
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    name: "Roger",
    description: "Laid-back, casual, resonant male",
    category: "premade",
    language: "en",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Mature, reassuring, confident female",
    category: "premade",
    language: "en",
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    description: "Warm, captivating storyteller",
    category: "premade",
    language: "en",
  },
  {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    name: "Alice",
    description: "Clear, engaging educator",
    category: "premade",
    language: "en",
  },
  {
    id: "hpp4J3VqNfWAUOO0d1Us",
    name: "Bella",
    description: "Professional, bright, warm",
    category: "premade",
    language: "en",
  },
  {
    id: "3Th96YoTP1kEKxJroYo1",
    name: "Jeet",
    description: "Hindi voice with Bihari accent",
    category: "professional",
    language: "hi",
  },
]

export function getRandomElevenLabsVoice() {
  const randomIndex = Math.floor(Math.random() * ELEVENLABS_VOICES.length)
  return ELEVENLABS_VOICES[randomIndex]
}
