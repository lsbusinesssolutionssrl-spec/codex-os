/**
 * AI Provider Registry
 *
 * Central configuration for all AI providers.
 * Toggle providers here without changing calling code.
 *
 * Status values:
 *   'active'    — currently in use
 *   'ready'     — implemented, not yet activated
 *   'stub'      — interface defined, implementation pending
 *   'planned'   — architecture slot reserved
 */

export const PROVIDERS = {

  // ── LLM Providers ───────────────────────────────────────────────
  llm: {
    active: 'base44',
    providers: {
      base44: {
        name: 'Base44 InvokeLLM',
        status: 'active',
        models: ['automatic', 'gpt_5_mini', 'gpt_5_4', 'claude_sonnet_4_6', 'gemini_3_flash'],
        notes: 'Managed API — no key required. Covers most use cases.',
      },
      openai: {
        name: 'OpenAI API',
        status: 'stub',
        models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3'],
        secretKey: 'OPENAI_API_KEY',
        baseUrl: 'https://api.openai.com/v1',
        notes: 'Direct OpenAI API. Use for custom fine-tuning or streaming.',
      },
      claude: {
        name: 'Anthropic Claude',
        status: 'stub',
        models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'],
        secretKey: 'ANTHROPIC_API_KEY',
        baseUrl: 'https://api.anthropic.com/v1',
        notes: 'Best for long-context reasoning and document analysis.',
      },
      ollama: {
        name: 'Ollama (Local)',
        status: 'planned',
        models: ['llama3.3', 'mistral', 'qwen2.5', 'phi4'],
        baseUrl: 'http://localhost:11434',
        notes: 'Self-hosted models. No data leaves the infrastructure.',
      },
    },
  },

  // ── Embeddings Providers ─────────────────────────────────────────
  embeddings: {
    active: 'base44_rag',
    providers: {
      base44_rag: {
        name: 'Base44 RAG Pipeline',
        status: 'active',
        dimensions: 1536,
        notes: 'Built-in RAG via ragSearch / ragIndexDocument functions.',
      },
      openai_embeddings: {
        name: 'OpenAI text-embedding-3',
        status: 'stub',
        models: ['text-embedding-3-small', 'text-embedding-3-large'],
        dimensions: 1536,
        secretKey: 'OPENAI_API_KEY',
        notes: 'High quality semantic search. Pair with pgvector or Pinecone.',
      },
      cohere: {
        name: 'Cohere Embed',
        status: 'planned',
        models: ['embed-multilingual-v3.0'],
        dimensions: 1024,
        notes: 'Strong multilingual embeddings including Italian.',
      },
    },
  },

  // ── Vector Database Providers ────────────────────────────────────
  vectordb: {
    active: 'base44_internal',
    providers: {
      base44_internal: {
        name: 'Base44 RAGDocument store',
        status: 'active',
        notes: 'Entity-based vector store using RAGDocument entity.',
      },
      pinecone: {
        name: 'Pinecone',
        status: 'stub',
        secretKey: 'PINECONE_API_KEY',
        notes: 'Managed vector DB. Best for large-scale similarity search.',
      },
      supabase_pgvector: {
        name: 'Supabase pgvector',
        status: 'planned',
        notes: 'Postgres-native vector search. No extra infrastructure.',
      },
      qdrant: {
        name: 'Qdrant',
        status: 'planned',
        notes: 'Self-hostable. Supports filters + vectors in a single query.',
      },
    },
  },

  // ── OCR Providers ────────────────────────────────────────────────
  ocr: {
    active: null,
    providers: {
      base44_llm_vision: {
        name: 'Base44 LLM Vision (GPT-4o)',
        status: 'stub',
        notes: 'Use InvokeLLM with file_urls to extract text from images/PDFs.',
      },
      google_document_ai: {
        name: 'Google Document AI',
        status: 'planned',
        secretKey: 'GOOGLE_CLOUD_KEY',
        notes: 'Best for structured document extraction (invoices, contracts).',
      },
      azure_form_recognizer: {
        name: 'Azure Form Recognizer',
        status: 'planned',
        secretKey: 'AZURE_FORM_KEY',
        notes: 'Prebuilt models for invoices, receipts, business cards.',
      },
      tesseract: {
        name: 'Tesseract (local)',
        status: 'planned',
        notes: 'Open-source OCR. Run in Deno via WASM or subprocess.',
      },
    },
  },

  // ── Vision / Image Analysis Providers ──────────────────────────
  vision: {
    active: null,
    providers: {
      base44_llm_vision: {
        name: 'Base44 LLM Vision',
        status: 'stub',
        capabilities: ['describe', 'classify', 'detect_anomaly', 'read_text'],
        notes: 'Pass image URLs to InvokeLLM via file_urls. Works today.',
      },
      openai_vision: {
        name: 'OpenAI GPT-4o Vision',
        status: 'stub',
        secretKey: 'OPENAI_API_KEY',
        capabilities: ['describe', 'classify', 'detect_anomaly', 'measure', 'compare'],
        notes: 'Direct API for construction site photo analysis.',
      },
      google_vision: {
        name: 'Google Cloud Vision',
        status: 'planned',
        secretKey: 'GOOGLE_CLOUD_KEY',
        capabilities: ['label_detection', 'object_detection', 'safe_search', 'ocr'],
        notes: 'Best for batch image classification pipelines.',
      },
    },
  },

  // ── Voice / Audio Providers ──────────────────────────────────────
  voice: {
    active: 'base44_tts',
    providers: {
      base44_tts: {
        name: 'Base44 GenerateSpeech',
        status: 'active',
        capabilities: ['tts'],
        voices: ['river', 'honey', 'sunny', 'storm', 'spark'],
        notes: 'Built-in TTS. High quality, multilingual.',
      },
      base44_stt: {
        name: 'Base44 TranscribeAudio',
        status: 'active',
        capabilities: ['stt'],
        notes: 'Whisper-based transcription via Base44 integration.',
      },
      openai_realtime: {
        name: 'OpenAI Realtime API',
        status: 'planned',
        secretKey: 'OPENAI_API_KEY',
        capabilities: ['voice_assistant', 'stt', 'tts', 'realtime_conversation'],
        notes: 'Full duplex voice assistant. WebSocket-based streaming.',
      },
      elevenlabs: {
        name: 'ElevenLabs',
        status: 'planned',
        secretKey: 'ELEVENLABS_API_KEY',
        capabilities: ['tts', 'voice_cloning'],
        notes: 'Best-in-class TTS with custom voice cloning.',
      },
      browser_speech: {
        name: 'Web Speech API (browser)',
        status: 'stub',
        capabilities: ['stt', 'tts'],
        notes: 'Free, zero-latency. No server needed. Limited accuracy.',
      },
    },
  },
};

/**
 * Get the active provider config for a capability.
 * @param {'llm'|'embeddings'|'vectordb'|'ocr'|'vision'|'voice'} capability
 */
export function getActiveProvider(capability) {
  const cap = PROVIDERS[capability];
  if (!cap || !cap.active) return null;
  return { id: cap.active, ...cap.providers[cap.active] };
}

/**
 * List all providers for a capability with their status.
 */
export function listProviders(capability) {
  const cap = PROVIDERS[capability];
  if (!cap) return [];
  return Object.entries(cap.providers).map(([id, p]) => ({
    id,
    ...p,
    isActive: cap.active === id,
  }));
}

export const registry = { PROVIDERS, getActiveProvider, listProviders };