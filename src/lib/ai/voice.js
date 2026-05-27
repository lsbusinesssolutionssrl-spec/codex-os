/**
 * Voice / Audio Adapter
 *
 * Unified interface for speech-to-text, text-to-speech, and voice assistants.
 *
 * Interface:
 *   voice.speak(text, options?) → Promise<string>         — returns audio URL
 *   voice.transcribe(audioUrl, options?) → Promise<string>
 *   voice.startListening(onResult, options?) → StopFn     — browser mic input
 *   voice.stopListening(stopFn)
 *   voice.createVoiceAssistant(config) → VoiceAssistant   [future]
 */
import { base44 } from '@/api/base44Client';

/**
 * Convert text to speech. Returns a URL to the generated audio MP3.
 * Uses Base44 GenerateSpeech by default.
 */
async function speak(text, options = {}) {
  const provider = options.provider ?? 'base44_tts';

  if (provider === 'base44_tts') {
    const res = await base44.integrations.Core.GenerateSpeech({
      text,
      voice: options.voice ?? 'river',
      language_code: options.language ?? 'it',
    });
    return res?.url ?? null;
  }

  if (provider === 'browser_speech') {
    // Browser TTS — no URL returned, plays immediately
    if (typeof window === 'undefined') throw new Error('Browser Speech API requires a browser environment.');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.language ?? 'it-IT';
    utterance.rate = options.rate ?? 1.0;
    window.speechSynthesis.speak(utterance);
    return null;
  }

  if (provider === 'elevenlabs') {
    // TODO: invoke backend function `elevenLabsTTS`
    // Requires: ELEVENLABS_API_KEY, voice ID
    throw new Error('ElevenLabs TTS not yet activated. Create elevenLabsTTS backend function.');
  }

  throw new Error(`Unknown TTS provider: ${provider}`);
}

/**
 * Transcribe an audio file to text.
 * Uses Base44 TranscribeAudio (Whisper) by default.
 */
async function transcribe(audioUrl, options = {}) {
  const provider = options.provider ?? 'base44_stt';

  if (provider === 'base44_stt') {
    return base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
  }

  throw new Error(`Transcription provider ${provider} not yet activated.`);
}

/**
 * Start browser microphone recording using Web Speech API.
 * Returns a stop function. Calls onResult(transcript) with interim/final results.
 *
 * @param {(transcript: string, isFinal: boolean) => void} onResult
 * @returns {() => void} stopFn
 */
function startListening(onResult, options = {}) {
  if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    throw new Error('Web Speech API not supported in this browser.');
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = options.language ?? 'it-IT';
  recognition.continuous = options.continuous ?? true;
  recognition.interimResults = options.interim ?? true;

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    onResult(result[0].transcript, result.isFinal);
  };

  recognition.onerror = (e) => {
    if (options.onError) options.onError(e.error);
  };

  recognition.start();
  return () => recognition.stop();
}

/**
 * [STUB] Create a persistent voice assistant session.
 * Future: wraps OpenAI Realtime API WebSocket for full duplex voice.
 *
 * @param {{ systemPrompt, voice, onMessage, onAudio }} config
 */
function createVoiceAssistant(config) {
  // TODO: Implement with OpenAI Realtime API (WebSocket)
  // wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
  // Requires: OPENAI_API_KEY via ephemeral token from backend
  throw new Error('Voice Assistant not yet activated. Requires OpenAI Realtime API integration.');
}

export const voice = { speak, transcribe, startListening, createVoiceAssistant };