/**
 * Codex AI Architecture — Modular Provider Layer
 *
 * Usage:
 *   import { llm, embeddings, vectordb, ocr, vision, voice } from '@/lib/ai';
 *
 * Each module exposes a clean interface. Swap providers by changing the
 * active provider in the registry — no changes needed in calling code.
 */
export { llm } from './llm';
export { embeddings } from './embeddings';
export { vectordb } from './vectordb';
export { ocr } from './ocr';
export { vision } from './vision';
export { voice } from './voice';
export { registry } from './registry';