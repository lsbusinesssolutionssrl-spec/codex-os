/**
 * ragSearch — Retrieval-Augmented Generation search endpoint.
 *
 * Phase 1: Keyword-based retrieval with context boosting + LLM re-ranking.
 * Phase 2 UPGRADE: Replace keyword scoring with cosine_similarity(embedding, queryEmbedding).
 *
 * Payload:
 *   query: string (required) — user question / search query
 *   top_k: number — max chunks to return (default: 8)
 *   min_score: number — min relevance threshold (default: 0.1)
 *   source_types: string[] — filter by source type (null = all)
 *   project_id, client_id, property_id — context scope
 *   include_text: boolean — include full chunk_text in response (default: true)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Inline utils (no local imports in Deno) ───────────────────────
const STOPWORDS_IT = new Set([
  'il','la','lo','le','gli','i','un','una','uno','di','del','della','dei','delle',
  'a','ad','da','in','con','su','per','tra','fra','e','o','ma','se','che','non',
  'è','sono','ha','hanno','questo','questa','come','anche','più','già','ancora',
]);

function extractKeywords(text, max = 15) {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-zàáèéìíòóùú\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS_IT.has(w));
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
}

function scoreChunkRelevance(chunk, queryKeywords) {
  if (!chunk.chunk_text || queryKeywords.length === 0) return 0;
  const chunkWords = new Set(chunk.chunk_text.toLowerCase().split(/\s+/));
  const chunkKws = new Set(chunk.keywords || []);
  let hits = 0;
  for (const kw of queryKeywords) {
    if (chunkWords.has(kw) || chunkKws.has(kw)) { hits += 1; continue; }
    for (const cw of chunkWords) {
      if ((cw.includes(kw) && kw.length > 4) || (kw.includes(cw) && cw.length > 4)) {
        hits += 0.3; break;
      }
    }
  }
  const base = hits / queryKeywords.length;
  return Math.min(1, base * (chunk.relevance_boost || 1.0));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    query,
    top_k = 8,
    min_score = 0.1,
    source_types = null,
    project_id = null,
    client_id = null,
    property_id = null,
    include_text = true,
    use_llm_rerank = false, // Phase 1.5: LLM re-ranking option
  } = body;

  if (!query) return Response.json({ error: 'query is required' }, { status: 400 });

  const companyId = user.company_id;

  // ── Step 1: Load candidate chunks ────────────────────────────────
  // Build scoped filters — fetch broader pool then score locally
  const filterBase = { company_id: companyId, is_indexed: true };

  let allChunks = [];

  if (project_id || client_id || property_id) {
    // Scoped fetch: entity-specific chunks first
    const scopedFilters = [];
    if (project_id) scopedFilters.push({ ...filterBase, project_id });
    if (client_id) scopedFilters.push({ ...filterBase, client_id });
    if (property_id) scopedFilters.push({ ...filterBase, property_id });

    const batches = await Promise.all(
      scopedFilters.map(f => base44.asServiceRole.entities.RAGDocument.filter(f, '-relevance_boost', 50).catch(() => []))
    );

    // Deduplicate
    const seen = new Set();
    for (const batch of batches) {
      for (const c of batch) {
        if (!seen.has(c.id)) { seen.add(c.id); allChunks.push(c); }
      }
    }

    // Top up with general tenant chunks if we have room
    if (allChunks.length < 20) {
      const general = await base44.asServiceRole.entities.RAGDocument.filter(
        filterBase, '-relevance_boost', 30
      ).catch(() => []);
      for (const c of general) {
        if (!seen.has(c.id)) { seen.add(c.id); allChunks.push(c); }
      }
    }
  } else {
    allChunks = await base44.asServiceRole.entities.RAGDocument.filter(
      filterBase, '-relevance_boost', 80
    ).catch(() => []);
  }

  // ── Step 2: Filter by source_types ────────────────────────────────
  if (source_types?.length > 0) {
    allChunks = allChunks.filter(c => source_types.includes(c.source_type));
  }

  // ── Step 3: Score chunks ──────────────────────────────────────────
  // Phase 1: keyword scoring
  // Phase 2 UPGRADE: const queryVec = await embed(query); chunks.sort by cosineSim(c.embedding_vector, queryVec)
  const queryKeywords = extractKeywords(query, 15);

  const scored = allChunks.map(chunk => {
    let score = scoreChunkRelevance(chunk, queryKeywords);
    // Context boosting
    if (project_id && chunk.project_id === project_id) score *= 1.5;
    if (client_id && chunk.client_id === client_id) score *= 1.3;
    if (property_id && chunk.property_id === property_id) score *= 1.4;
    return { ...chunk, _score: Math.min(1, score) };
  });

  let topChunks = scored
    .filter(c => c._score >= min_score)
    .sort((a, b) => b._score - a._score)
    .slice(0, top_k * 2); // fetch 2x for optional re-ranking

  // ── Step 4: Optional LLM re-ranking ──────────────────────────────
  // Phase 1.5: LLM can re-rank for better precision
  if (use_llm_rerank && topChunks.length > 0) {
    const rerankPrompt = `Devi classificare questi ${topChunks.length} frammenti di testo per rilevanza rispetto alla domanda.
Domanda: "${query}"
Frammenti (indice | testo):
${topChunks.map((c, i) => `${i}: ${c.chunk_text?.slice(0, 200)}`).join('\n')}

Rispondi con JSON: {"ranking": [indice_più_rilevante, ..., indice_meno_rilevante]}`;

    const reranked = await base44.integrations.Core.InvokeLLM({
      prompt: rerankPrompt,
      response_json_schema: { type: 'object', properties: { ranking: { type: 'array', items: { type: 'number' } } } },
    }).catch(() => null);

    if (reranked?.ranking?.length > 0) {
      topChunks = reranked.ranking
        .filter(i => i >= 0 && i < topChunks.length)
        .map(i => topChunks[i])
        .slice(0, top_k);
    }
  }

  const results = topChunks.slice(0, top_k).map(c => ({
    id: c.id,
    source_type: c.source_type,
    source_id: c.source_id,
    source_title: c.source_title,
    chunk_index: c.chunk_index,
    chunk_total: c.chunk_total,
    score: Math.round(c._score * 100) / 100,
    keywords: c.keywords,
    project_id: c.project_id,
    client_id: c.client_id,
    property_id: c.property_id,
    ...(include_text ? { chunk_text: c.chunk_text } : {}),
  }));

  // ── Step 5: Build RAG context string for LLM ─────────────────────
  const ragContext = results.length > 0
    ? results.map((c, i) =>
        `[${i + 1}] [${c.source_type}] "${c.source_title}" (score: ${c.score})\n${c.chunk_text || ''}`
      ).join('\n\n---\n\n')
    : null;

  return Response.json({
    query,
    results,
    total_candidates: allChunks.length,
    query_keywords: queryKeywords,
    rag_context: ragContext,
    debug: {
      tenant_isolated: true,
      company_id_filter: companyId,
      scoped_filters: { project_id: project_id || null, client_id: client_id || null, property_id: property_id || null },
      applied_min_score: min_score,
      applied_top_k: top_k,
      retrieval_method: 'keyword_tfidf_v1',
      upgrade_path: 'Phase 2: cosine_similarity on text-embedding-3-small',
    },
    upgrade_note: 'Phase 2: replace keyword scoring with cosine_similarity on text-embedding-3-small vectors',
  });
});