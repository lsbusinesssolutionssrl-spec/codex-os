/**
 * Embeddings Adapter
 *
 * Unified interface for generating and comparing text embeddings.
 * Currently delegates to the Base44 RAG pipeline (ragSearch / ragIndexDocument).
 *
 * Interface:
 *   embeddings.search(query, options?) → Promise<SearchResult[]>
 *   embeddings.index(doc, options?) → Promise<void>
 *   embeddings.embed(text, options?) → Promise<number[]>   [future]
 *   embeddings.similarity(a, b) → number                   [future]
 */
import { base44 } from '@/api/base44Client';

/**
 * Semantic search over indexed documents.
 * @param {string} query
 * @param {{ topK?, minScore?, projectId?, clientId?, propertyId? }} options
 */
async function search(query, options = {}) {
  const res = await base44.functions.invoke('ragSearch', {
    query,
    top_k: options.topK ?? 6,
    min_score: options.minScore ?? 0.12,
    project_id: options.projectId ?? null,
    client_id: options.clientId ?? null,
    property_id: options.propertyId ?? null,
  });
  return res?.data?.results ?? [];
}

/**
 * Index a document for semantic search.
 * @param {{ sourceType, sourceId, forceReindex? }} doc
 */
async function index(doc, options = {}) {
  await base44.functions.invoke('ragIndexDocument', {
    source_type: doc.sourceType,
    source_id: doc.sourceId,
    force_reindex: options.forceReindex ?? false,
  });
}

/**
 * [STUB] Generate raw embedding vector for a text.
 * Requires an active embeddings provider (openai, cohere, etc.)
 */
async function embed(text, options = {}) {
  const provider = options.provider ?? 'base44_rag';

  if (provider === 'openai_embeddings') {
    // TODO: invoke backend function `generateEmbedding` with model text-embedding-3-small
    throw new Error('OpenAI embeddings not yet activated. Create generateEmbedding backend function.');
  }

  throw new Error(`embed() requires a direct embeddings provider. Current active provider (${provider}) uses the RAG pipeline instead.`);
}

/**
 * [STUB] Cosine similarity between two embedding vectors.
 */
function similarity(vecA, vecB) {
  if (vecA.length !== vecB.length) throw new Error('Vector dimensions must match.');
  const dot = vecA.reduce((s, a, i) => s + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0));
  return dot / (magA * magB);
}

export const embeddings = { search, index, embed, similarity };