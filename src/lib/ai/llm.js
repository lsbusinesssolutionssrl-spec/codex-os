/**
 * LLM Adapter
 *
 * Unified interface for calling any LLM provider.
 * Currently routes to Base44 InvokeLLM.
 * Swap `activeProvider` in registry.js to route elsewhere.
 *
 * Interface:
 *   llm.complete(prompt, options?) → Promise<string>
 *   llm.completeJSON(prompt, schema, options?) → Promise<object>
 *   llm.chat(messages, options?) → Promise<string>      [future]
 *   llm.stream(prompt, onChunk, options?) → Promise<void> [future]
 */
import { base44 } from '@/api/base44Client';

const DEFAULT_OPTIONS = {
  model: 'automatic',          // see registry.js for available models
  temperature: null,            // provider default
  maxTokens: null,              // provider default
  provider: 'base44',           // override to use a different provider
};

/**
 * Complete a prompt and return a string response.
 */
async function complete(prompt, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.provider === 'base44' || opts.provider === 'automatic') {
    return base44.integrations.Core.InvokeLLM({
      prompt,
      model: opts.model,
      add_context_from_internet: opts.webSearch ?? false,
      file_urls: opts.fileUrls ?? null,
    });
  }

  // ── Future providers ─────────────────────────────────────────────
  if (opts.provider === 'openai') {
    // TODO: invoke backend function `openaiChat` with the prompt
    throw new Error('OpenAI provider not yet activated. Set up OPENAI_API_KEY and create openaiChat function.');
  }

  if (opts.provider === 'claude') {
    // TODO: invoke backend function `claudeChat` with the prompt
    throw new Error('Claude provider not yet activated. Set up ANTHROPIC_API_KEY and create claudeChat function.');
  }

  if (opts.provider === 'ollama') {
    // TODO: invoke backend function `ollamaChat` pointing to local Ollama instance
    throw new Error('Ollama provider not yet activated. Configure OLLAMA_BASE_URL in backend.');
  }

  throw new Error(`Unknown LLM provider: ${opts.provider}`);
}

/**
 * Complete a prompt and return a structured JSON object.
 */
async function completeJSON(prompt, schema, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.provider === 'base44' || opts.provider === 'automatic') {
    return base44.integrations.Core.InvokeLLM({
      prompt,
      model: opts.model,
      response_json_schema: schema,
      file_urls: opts.fileUrls ?? null,
    });
  }

  throw new Error(`Provider ${opts.provider}: JSON completion not yet implemented.`);
}

/**
 * [STUB] Multi-turn chat interface.
 * messages: Array<{ role: 'user'|'assistant'|'system', content: string }>
 */
async function chat(messages, options = {}) {
  // For now, flatten messages into a single prompt and use complete()
  const flattened = messages
    .map(m => `${m.role === 'system' ? '[Sistema]' : m.role === 'assistant' ? '[AI]' : '[Utente]'}: ${m.content}`)
    .join('\n\n');
  return complete(flattened, options);
}

/**
 * [STUB] Streaming completion — fires onChunk for each token.
 * Requires a streaming-capable backend function.
 */
async function stream(prompt, onChunk, options = {}) {
  // Placeholder: fall back to non-streaming, emit as single chunk
  const result = await complete(prompt, options);
  onChunk(result);
}

export const llm = { complete, completeJSON, chat, stream };