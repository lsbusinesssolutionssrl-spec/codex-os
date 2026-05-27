/**
 * ragIndexDocument — Indexes a document or entity into RAGDocument chunks.
 *
 * Supports:
 *   - Text entities (estimate, ticket, home_passport, project_notes, knowledge_base, checklist, sop)
 *   - File documents (pdf, contract, certification, manual) — text extracted via LLM
 *   - Image metadata
 *
 * Payload:
 *   source_type: string (required) — see SOURCE_TYPE_CONFIG
 *   source_id: string (required) — ID of the source entity/document
 *   company_id: string
 *   client_id, property_id, project_id: optional context links
 *   force_reindex: boolean — re-index even if already indexed
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Inline pipeline utils (no local imports allowed in Deno functions)
const STOPWORDS_IT = new Set([
  'il','la','lo','le','gli','i','un','una','uno','di','del','della','dei','delle',
  'a','ad','da','in','con','su','per','tra','fra','e','o','ma','se','che','non',
  'è','sono','ha','hanno','questo','questa','come','anche','più','già','ancora',
]);

function extractKeywords(text, max = 20) {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-zàáèéìíòóùú\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS_IT.has(w));
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
}

function splitIntoChunks(text, chunkSize = 600, overlap = 80) {
  if (!text || text.length === 0) return [];
  if (text.length <= chunkSize) return [text.trim()];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const window = text.slice(Math.max(end - 100, start), end);
      const last = Math.max(window.lastIndexOf('. '), window.lastIndexOf('\n'));
      if (last > 0) end = Math.max(end - 100, start) + last + 1;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) chunks.push(chunk);
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks;
}

const SOURCE_TYPE_CONFIG = {
  pdf:           { chunkSize: 800, overlap: 100, boostFactor: 1.2, needsLLMExtract: true },
  contract:      { chunkSize: 600, overlap: 80,  boostFactor: 1.5, needsLLMExtract: true },
  estimate:      { chunkSize: 500, overlap: 60,  boostFactor: 1.3, needsLLMExtract: false },
  certification: { chunkSize: 400, overlap: 50,  boostFactor: 1.4, needsLLMExtract: true },
  manual:        { chunkSize: 1000, overlap: 150, boostFactor: 1.0, needsLLMExtract: true },
  sop:           { chunkSize: 600, overlap: 80,  boostFactor: 1.2, needsLLMExtract: false },
  home_passport: { chunkSize: 400, overlap: 50,  boostFactor: 1.6, needsLLMExtract: false },
  project_notes: { chunkSize: 300, overlap: 40,  boostFactor: 1.1, needsLLMExtract: false },
  comment:       { chunkSize: 200, overlap: 0,   boostFactor: 0.8, needsLLMExtract: false },
  ticket:        { chunkSize: 300, overlap: 40,  boostFactor: 1.0, needsLLMExtract: false },
  image_metadata:{ chunkSize: 200, overlap: 0,   boostFactor: 0.7, needsLLMExtract: false },
  knowledge_base:{ chunkSize: 500, overlap: 60,  boostFactor: 1.5, needsLLMExtract: false },
  checklist:     { chunkSize: 300, overlap: 40,  boostFactor: 0.9, needsLLMExtract: false },
};

function buildTextFromEntity(entity, sourceType) {
  const parts = [];
  switch (sourceType) {
    case 'home_passport':
      parts.push(entity.property_name, entity.address, `Tipo: ${entity.type}`, `Anno: ${entity.year_built}`);
      if (entity.electrical_notes) parts.push(`Elettrico: ${entity.electrical_notes}`);
      if (entity.plumbing_notes) parts.push(`Idraulico: ${entity.plumbing_notes}`);
      if (entity.heating_cooling_notes) parts.push(`Riscaldamento: ${entity.heating_cooling_notes}`);
      if (entity.networking_notes) parts.push(`Networking: ${entity.networking_notes}`);
      if (entity.security_notes) parts.push(`Sicurezza: ${entity.security_notes}`);
      if (entity.windows_doors_notes) parts.push(`Porte/Finestre: ${entity.windows_doors_notes}`);
      break;
    case 'estimate':
      parts.push(entity.title, `${entity.estimate_type} | ${entity.quality_level} | ${entity.status}`);
      if (entity.project_summary) parts.push(entity.project_summary);
      if (entity.included_works) parts.push(`Incluso: ${entity.included_works}`);
      if (entity.excluded_works) parts.push(`Escluso: ${entity.excluded_works}`);
      if (entity.assumptions) parts.push(`Assunzioni: ${entity.assumptions}`);
      if (entity.payment_terms) parts.push(`Pagamento: ${entity.payment_terms}`);
      if (entity.notes) parts.push(entity.notes);
      break;
    case 'ticket':
      parts.push(entity.title, `${entity.issue_type} | ${entity.priority} | ${entity.status}`);
      if (entity.notes) parts.push(entity.notes);
      break;
    case 'project_notes':
      parts.push(entity.title, entity.status);
      if (entity.notes) parts.push(entity.notes);
      (entity.milestones || []).forEach(m => parts.push(`Milestone: ${m.title || ''}`));
      break;
    case 'knowledge_base':
      parts.push(entity.title, `Categoria: ${entity.category}`);
      if (entity.problem) parts.push(`Problema: ${entity.problem}`);
      if (entity.cause) parts.push(`Causa: ${entity.cause}`);
      if (entity.solution) parts.push(`Soluzione: ${entity.solution}`);
      if (entity.lessons_learned) parts.push(`Lezioni: ${entity.lessons_learned}`);
      if (entity.recommendations) parts.push(`Raccomandazioni: ${entity.recommendations}`);
      break;
    case 'checklist':
      parts.push(entity.title, `${entity.category} | ${entity.status}`);
      if (entity.description) parts.push(entity.description);
      if (entity.notes) parts.push(entity.notes);
      break;
    case 'image_metadata':
      parts.push(entity.title || 'Immagine', entity.type || 'photo');
      if (entity.notes) parts.push(entity.notes);
      if (entity.metadata?.image_description) parts.push(entity.metadata.image_description);
      break;
    default:
      Object.values(entity).filter(v => typeof v === 'string' && v.length > 5).forEach(v => parts.push(v));
  }
  return parts.filter(Boolean).join('\n');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    source_type, source_id, source_title, source_url,
    client_id, property_id, project_id,
    force_reindex = false,
    text_override = null, // direct text injection (for testing or pre-extracted text)
  } = body;

  if (!source_type || !source_id) {
    return Response.json({ error: 'source_type and source_id are required' }, { status: 400 });
  }

  const config = SOURCE_TYPE_CONFIG[source_type];
  if (!config) return Response.json({ error: `Unknown source_type: ${source_type}` }, { status: 400 });

  const companyId = user.company_id;

  // Check if already indexed (unless forced)
  if (!force_reindex) {
    const existing = await base44.asServiceRole.entities.RAGDocument.filter({
      company_id: companyId,
      source_id,
      source_type,
      is_indexed: true,
    }, '-created_date', 1).catch(() => []);
    if (existing.length > 0) {
      return Response.json({ status: 'already_indexed', chunks: existing.length, source_id });
    }
  } else {
    // Delete existing chunks for this source
    const oldChunks = await base44.asServiceRole.entities.RAGDocument.filter({ company_id: companyId, source_id }, '-created_date', 50).catch(() => []);
    await Promise.all(oldChunks.map(c => base44.asServiceRole.entities.RAGDocument.delete(c.id).catch(() => {})));
  }

  // ── Step 1: Get text content ──────────────────────────────────
  let fullText = text_override;

  if (!fullText) {
    if (config.needsLLMExtract && source_url) {
      // Phase 1: Use LLM to extract text from file URL
      // UPGRADE Phase 2: Use dedicated PDF parser (pdf-parse, AWS Textract, etc.)
      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: `Estrai il testo completo da questo documento. Mantieni la struttura logica (sezioni, titoli, elenchi). Non aggiungere commenti. Solo il testo estratto.\nURL documento: ${source_url}`,
        file_urls: [source_url],
      }).catch(() => null);
      fullText = typeof extracted === 'string' ? extracted : null;
    } else {
      // Fetch entity and build text from structured fields
      let entity = null;
      const entityMap = {
        estimate: 'Estimate', ticket: 'SupportTicket', home_passport: 'Property',
        project_notes: 'Project', knowledge_base: 'KnowledgeBase', checklist: 'ChecklistItem',
        sop: 'SOPTemplates', comment: 'Comment', image_metadata: 'Document',
      };
      const entityName = entityMap[source_type];
      if (entityName) {
        entity = await base44.asServiceRole.entities[entityName].get(source_id).catch(() => null);
      }
      if (entity) {
        fullText = buildTextFromEntity(entity, source_type);
        // Auto-detect links from entity
        if (!client_id && entity.client_id) body.client_id = entity.client_id;
        if (!property_id && entity.property_id) body.property_id = entity.property_id;
        if (!project_id && entity.project_id) body.project_id = entity.project_id;
      }
    }
  }

  if (!fullText || fullText.trim().length < 10) {
    return Response.json({ status: 'no_text', message: 'Could not extract text from source', source_id });
  }

  // ── Step 2: Chunk text ─────────────────────────────────────────
  const chunks = splitIntoChunks(fullText, config.chunkSize, config.overlap);

  // ── Step 3: Index chunks ───────────────────────────────────────
  const indexDate = new Date().toISOString();
  const created = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const keywords = extractKeywords(chunk, 20);

    const doc = await base44.asServiceRole.entities.RAGDocument.create({
      company_id: companyId,
      source_type,
      source_id,
      source_title: source_title || source_id,
      source_url: source_url || null,
      chunk_index: i,
      chunk_total: chunks.length,
      chunk_text: chunk,
      keywords,
      embedding_vector: null,      // Phase 2: populate with text-embedding-3-small
      embedding_model: 'none',     // Phase 2: 'text-embedding-3-small'
      client_id: client_id || body.client_id || null,
      property_id: property_id || body.property_id || null,
      project_id: project_id || body.project_id || null,
      language: 'it',
      relevance_boost: config.boostFactor,
      is_indexed: true,
      index_date: indexDate,
      metadata: { section: null, doc_date: null, author: null },
    }).catch(() => null);

    if (doc) created.push(doc.id);
  }

  return Response.json({
    status: 'indexed',
    source_id,
    source_type,
    chunks_created: created.length,
    total_chars: fullText.length,
    upgrade_note: 'Phase 2: run embeddings on each chunk with text-embedding-3-small',
  });
});