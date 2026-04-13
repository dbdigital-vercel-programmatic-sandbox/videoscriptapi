export type ElevenLabsVoice = {
  id: string
  name: string
  description: string
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: "EtEf6yOMlronn3UoIDrF",
    name: "Ankit",
    description: "Professional Male",
  },
  {
    id: "RpiHVNPKGBg7UmgmrKrN",
    name: "Aashish",
    description: "Natural Male",
  },
  {
    id: "LQ2auZHpAQ9h4azztqMT",
    name: "Parveen",
    description: "Natural Male",
  },
  {
    id: "zFLlkq72ysbq1TWC0Mlx",
    name: "Anushri",
    description: "Natural Young Female",
  },
  {
    id: "2F1KINpxsttim2WfMbVs",
    name: "DB",
    description: "Indian Hindi Female",
  },
]

export function getRandomElevenLabsVoice() {
  const randomIndex = Math.floor(Math.random() * ELEVENLABS_VOICES.length)
  return ELEVENLABS_VOICES[randomIndex]
}
