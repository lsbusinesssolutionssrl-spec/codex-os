/**
 * RAG Pipeline Architecture — Codex OS
 * ─────────────────────────────────────────────────────────────────
 * Internal RAG pipeline: chunking strategies, source type configs,
 * keyword extraction, scoring, and retrieval logic.
 *
 * UPGRADE PATH:
 *   Phase 1 (current): Keyword-based retrieval + LLM re-ranking
 *   Phase 2: Add OpenAI text-embedding-3-small → store in RAGDocument.embedding_vector
 *   Phase 3: Migrate to Pinecone/Weaviate/pgvector for ANN search
 */

// ── Source Type Registry ──────────────────────────────────────────
export const SOURCE_TYPE_CONFIG = {
  pdf:             { chunkSize: 800, overlap: 100, boostFactor: 1.2, extractText: true },
  contract:        { chunkSize: 600, overlap: 80,  boostFactor: 1.5, extractText: true },
  estimate:        { chunkSize: 500, overlap: 60,  boostFactor: 1.3, extractText: true },
  certification:   { chunkSize: 400, overlap: 50,  boostFactor: 1.4, extractText: true },
  manual:          { chunkSize: 1000, overlap: 150, boostFactor: 1.0, extractText: true },
  sop:             { chunkSize: 600, overlap: 80,  boostFactor: 1.2, extractText: true },
  home_passport:   { chunkSize: 400, overlap: 50,  boostFactor: 1.6, extractText: false },
  project_notes:   { chunkSize: 300, overlap: 40,  boostFactor: 1.1, extractText: false },
  comment:         { chunkSize: 200, overlap: 0,   boostFactor: 0.8, extractText: false },
  ticket:          { chunkSize: 300, overlap: 40,  boostFactor: 1.0, extractText: false },
  image_metadata:  { chunkSize: 200, overlap: 0,   boostFactor: 0.7, extractText: false },
  knowledge_base:  { chunkSize: 500, overlap: 60,  boostFactor: 1.5, extractText: false },
  checklist:       { chunkSize: 300, overlap: 40,  boostFactor: 0.9, extractText: false },
};

// ── Chunking Strategy ─────────────────────────────────────────────
/**
 * splitIntoChunks(text, sourceType)
 * Splits text into overlapping chunks based on source type config.
 * Respects sentence boundaries where possible.
 *
 * @param {string} text - Full document text
 * @param {string} sourceType - key of SOURCE_TYPE_CONFIG
 * @returns {string[]} array of text chunks
 */
export function splitIntoChunks(text, sourceType = 'pdf') {
  const config = SOURCE_TYPE_CONFIG[sourceType] || SOURCE_TYPE_CONFIG.pdf;
  const { chunkSize, overlap } = config;

  if (!text || text.length === 0) return [];
  if (text.length <= chunkSize) return [text.trim()];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary (. ! ?) within last 100 chars of chunk
    if (end < text.length) {
      const window = text.slice(Math.max(end - 100, start), end);
      const lastSentence = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf('\n'),
      );
      if (lastSentence > 0) {
        end = Math.max(end - 100, start) + lastSentence + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) chunks.push(chunk); // skip tiny fragments

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

// ── Keyword Extractor ─────────────────────────────────────────────
const STOPWORDS_IT = new Set([
  'il','la','lo','le','gli','i','un','una','uno','di','del','della','dei','delle',
  'a','ad','da','in','con','su','per','tra','fra','e','o','ma','se','che','non',
  'è','sono','ha','hanno','ho','questo','questa','questi','queste','si','ci','ne',
  'mi','ti','lui','lei','noi','voi','loro','anche','più','già','ancora','come',
]);

/**
 * extractKeywords(text, maxKeywords)
 * Simple TF-based keyword extraction with Italian stopword removal.
 */
export function extractKeywords(text, maxKeywords = 20) {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-zàáâãäåèéêëìíîïòóôõöùúûü\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS_IT.has(w));

  // TF counting
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// ── Keyword Scorer ────────────────────────────────────────────────
/**
 * scoreChunkRelevance(chunk, queryKeywords)
 * Scores a RAGDocument chunk against query keywords.
 * Returns 0-1 relevance score.
 *
 * UPGRADE: Replace this with cosine_similarity(chunk.embedding, queryEmbedding)
 */
export function scoreChunkRelevance(chunk, queryKeywords) {
  if (!chunk.chunk_text || queryKeywords.length === 0) return 0;

  const chunkWords = new Set(
    chunk.chunk_text.toLowerCase().split(/\s+/)
  );
  const chunkKeywords = new Set(chunk.keywords || []);

  let hits = 0;
  for (const kw of queryKeywords) {
    if (chunkWords.has(kw) || chunkKeywords.has(kw)) hits++;
    // Partial match bonus
    for (const cw of chunkWords) {
      if (cw.includes(kw) || kw.includes(cw)) { hits += 0.3; break; }
    }
  }

  const rawScore = hits / queryKeywords.length;
  const boost = chunk.relevance_boost || 1.0;
  return Math.min(1, rawScore * boost);
}

// ── Retrieval Pipeline ────────────────────────────────────────────
/**
 * retrieveRelevantChunks(query, allChunks, options)
 *
 * Phase 1: keyword-based retrieval with re-ranking.
 * Phase 2 UPGRADE: replace with ANN vector search.
 *
 * @param {string} query - User query
 * @param {Object[]} allChunks - Array of RAGDocument records
 * @param {Object} options - { topK, minScore, sourceTypes, projectId, clientId }
 * @returns {Object[]} Top-K ranked chunks
 */
export function retrieveRelevantChunks(query, allChunks, options = {}) {
  const {
    topK = 8,
    minScore = 0.1,
    sourceTypes = null,
    projectId = null,
    clientId = null,
    propertyId = null,
  } = options;

  const queryKeywords = extractKeywords(query, 15);
  if (queryKeywords.length === 0 || allChunks.length === 0) return [];

  let candidates = allChunks;

  // Filter by source type if specified
  if (sourceTypes?.length > 0) {
    candidates = candidates.filter(c => sourceTypes.includes(c.source_type));
  }

  // Context-scoped filtering (prefer entity-linked chunks)
  const contextScored = candidates.map(chunk => {
    let score = scoreChunkRelevance(chunk, queryKeywords);

    // Boost for context match
    if (projectId && chunk.project_id === projectId) score *= 1.5;
    if (clientId && chunk.client_id === clientId) score *= 1.3;
    if (propertyId && chunk.property_id === propertyId) score *= 1.4;

    return { ...chunk, _score: score };
  });

  return contextScored
    .filter(c => c._score >= minScore)
    .sort((a, b) => b._score - a._score)
    .slice(0, topK);
}

// ── Document Text Builder (for non-file entities) ─────────────────
/**
 * buildTextFromEntity(entity, sourceType)
 * Converts structured entity data into indexable text.
 */
export function buildTextFromEntity(entity, sourceType) {
  switch (sourceType) {
    case 'home_passport':
      return [
        entity.property_name,
        entity.address,
        `Tipo: ${entity.type}`,
        `Anno: ${entity.year_built}`,
        `Elettrico: ${entity.electrical_notes || ''}`,
        `Idraulico: ${entity.plumbing_notes || ''}`,
        `Riscaldamento: ${entity.heating_cooling_notes || ''}`,
        `Networking: ${entity.networking_notes || ''}`,
        `Sicurezza: ${entity.security_notes || ''}`,
        `Porte/Finestre: ${entity.windows_doors_notes || ''}`,
      ].filter(Boolean).join('\n');

    case 'estimate':
      return [
        entity.title,
        `Tipo: ${entity.estimate_type} | Qualità: ${entity.quality_level}`,
        `Stato: ${entity.status}`,
        `Sommario: ${entity.project_summary || ''}`,
        `Lavori inclusi: ${entity.included_works || ''}`,
        `Lavori esclusi: ${entity.excluded_works || ''}`,
        `Assunzioni: ${entity.assumptions || ''}`,
        `Termini pagamento: ${entity.payment_terms || ''}`,
        `Note: ${entity.notes || ''}`,
      ].filter(Boolean).join('\n');

    case 'ticket':
      return [
        entity.title,
        `Tipo: ${entity.issue_type} | Priorità: ${entity.priority} | Stato: ${entity.status}`,
        `Note: ${entity.notes || ''}`,
      ].filter(Boolean).join('\n');

    case 'project_notes':
      return [
        entity.title,
        `Stato: ${entity.status}`,
        `Note: ${entity.notes || ''}`,
        entity.milestones?.map(m => `Milestone: ${m.title || ''}`).join(', ') || '',
      ].filter(Boolean).join('\n');

    case 'knowledge_base':
      return [
        entity.title,
        `Categoria: ${entity.category}`,
        `Problema: ${entity.problem || ''}`,
        `Causa: ${entity.cause || ''}`,
        `Soluzione: ${entity.solution || ''}`,
        `Lezioni: ${entity.lessons_learned || ''}`,
        `Raccomandazioni: ${entity.recommendations || ''}`,
      ].filter(Boolean).join('\n');

    case 'checklist':
      return [
        entity.title,
        `Categoria: ${entity.category} | Stato: ${entity.status}`,
        `Descrizione: ${entity.description || ''}`,
        `Note: ${entity.notes || ''}`,
      ].filter(Boolean).join('\n');

    case 'sop':
      return [
        entity.title,
        `Categoria: ${entity.category || ''}`,
        entity.content || entity.description || '',
      ].filter(Boolean).join('\n');

    default:
      return Object.values(entity)
        .filter(v => typeof v === 'string' && v.length > 5)
        .join('\n');
  }
}

// ── Pipeline Entry Point ──────────────────────────────────────────
/**
 * UPGRADE CHECKLIST for Phase 2 (Vector Embeddings):
 *
 * 1. Add OpenAI embeddings:
 *    const embedding = await openai.embeddings.create({ model: 'text-embedding-3-small', input: chunk })
 *    Store result in RAGDocument.embedding_vector (as JSON string)
 *    Set RAGDocument.embedding_model = 'text-embedding-3-small'
 *
 * 2. Replace scoreChunkRelevance with cosine similarity:
 *    function cosineSim(a, b) { ... }
 *    const queryEmbedding = await openai.embeddings.create({ input: query })
 *    chunks.sort by cosineSim(chunk.embedding_vector, queryEmbedding)
 *
 * 3. For Phase 3 (external vector DB):
 *    - Replace RAGDocument entity with Pinecone/Weaviate index
 *    - Keep same retrieveRelevantChunks API signature
 *    - Only change the internals of this function
 */
export const RAG_VERSION = '1.0.0-keyword';
export const RAG_UPGRADE_STATUS = {
  phase: 1,
  embedding: false,
  vectorDB: false,
  reranking: false,
  nextUpgrade: 'Add text-embedding-3-small for semantic similarity',
};