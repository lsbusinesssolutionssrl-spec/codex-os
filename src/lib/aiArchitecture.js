/**
 * CODEX AI ARCHITECTURE LAYER
 * Future-ready modular AI infrastructure for Codex OS.
 *
 * Architecture designed for:
 * - Multiple LLM providers (Base44 InvokeLLM, OpenAI, Claude, local models)
 * - RAG pipeline (Retrieval-Augmented Generation)
 * - Vector DB integration (Pinecone, Weaviate, pgvector)
 * - Embeddings (OpenAI, Cohere, local)
 * - OCR (Tesseract, AWS Textract, Google Vision)
 * - Voice (Whisper, ElevenLabs)
 * - Image analysis (GPT-4V, Claude Vision)
 */

// ── LLM PROVIDER REGISTRY ────────────────────────────────────────────────────
export const LLM_PROVIDERS = {
  base44: {
    id: 'base44',
    name: 'Base44 AI (Default)',
    models: ['automatic', 'gpt_5_mini', 'gpt_5_4', 'claude_sonnet_4_6', 'gemini_3_flash'],
    status: 'active',
    invoke: async (prompt, model = 'automatic') => {
      // Implemented via Base44 InvokeLLM integration
      throw new Error('Use base44.integrations.Core.InvokeLLM in backend functions');
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (Future)',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    status: 'placeholder',
    invoke: async (prompt, model) => {
      // TODO: implement via OPENAI_API_KEY secret
      throw new Error('OpenAI integration not yet implemented');
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude (Future)',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    status: 'placeholder',
    invoke: async (prompt, model) => {
      // TODO: implement via ANTHROPIC_API_KEY secret
      throw new Error('Anthropic integration not yet implemented');
    },
  },
  local: {
    id: 'local',
    name: 'Local Model (Future)',
    models: ['llama3', 'mistral', 'phi3'],
    status: 'placeholder',
    invoke: async (prompt, model) => {
      // TODO: implement via local Ollama endpoint
      throw new Error('Local model integration not yet implemented');
    },
  },
};

// ── VECTOR DB REGISTRY ───────────────────────────────────────────────────────
export const VECTOR_DB_PROVIDERS = {
  internal: {
    id: 'internal',
    name: 'Internal (Base44 Entities)',
    status: 'active',
    description: 'Uses AIMemory entity for semantic-like storage. No embeddings.',
  },
  pinecone: {
    id: 'pinecone',
    name: 'Pinecone (Future)',
    status: 'placeholder',
    description: 'High-performance vector search. Requires PINECONE_API_KEY.',
  },
  weaviate: {
    id: 'weaviate',
    name: 'Weaviate (Future)',
    status: 'placeholder',
    description: 'Open-source vector DB. Self-hosted or cloud.',
  },
  pgvector: {
    id: 'pgvector',
    name: 'pgvector (Future)',
    status: 'placeholder',
    description: 'PostgreSQL extension for vector similarity search.',
  },
};

// ── RAG PIPELINE ARCHITECTURE ────────────────────────────────────────────────
/**
 * RAG Pipeline Stages:
 * 1. INGEST: document → extract text → chunk → embed → store
 * 2. RETRIEVE: query → embed → similarity search → top-K chunks
 * 3. AUGMENT: system prompt + retrieved chunks + user query
 * 4. GENERATE: LLM response with citations
 */

export const RAG_CONFIG = {
  // Chunking strategy
  chunking: {
    strategy: 'recursive', // 'fixed', 'recursive', 'semantic'
    chunk_size: 500,        // tokens per chunk
    chunk_overlap: 50,      // token overlap between chunks
    separators: ['\n\n', '\n', '. ', ' '],
  },

  // Retrieval config
  retrieval: {
    top_k: 5,               // number of chunks to retrieve
    min_relevance: 0.7,     // minimum relevance score (0-1)
    rerank: false,          // placeholder for reranking
    hybrid_search: false,   // placeholder for hybrid (semantic + keyword)
  },

  // Embedding config
  embedding: {
    provider: 'internal',   // 'openai', 'cohere', 'local'
    model: 'text-embedding-ada-002', // placeholder
    dimensions: 1536,
    status: 'placeholder',
  },
};

// ── DOCUMENT INDEXING PIPELINE (Placeholder) ─────────────────────────────────
export const DOCUMENT_INDEX_SCHEMA = {
  // Schema for indexed document chunks
  fields: {
    doc_id: 'string',           // original document ID
    chunk_id: 'string',         // unique chunk ID
    content: 'string',          // text content of chunk
    metadata: {
      doc_type: 'string',       // pdf, estimate, contract, sop, etc.
      entity_type: 'string',    // project, client, property, etc.
      entity_id: 'string',
      title: 'string',
      created_date: 'string',
      language: 'string',
    },
    embedding: 'float[]',       // vector embedding (placeholder)
    embedding_model: 'string',
    indexed_at: 'string',
  },
};

// Document types supported for indexing
export const INDEXABLE_DOCUMENT_TYPES = [
  { type: 'estimate', entity: 'Estimate', fields: ['title', 'included_works', 'excluded_works', 'project_summary', 'notes'] },
  { type: 'project_notes', entity: 'Project', fields: ['notes', 'milestones'] },
  { type: 'ticket', entity: 'SupportTicket', fields: ['title', 'notes'] },
  { type: 'knowledge_base', entity: 'KnowledgeBase', fields: ['title', 'problem', 'cause', 'solution', 'recommendations'] },
  { type: 'checklist', entity: 'ChecklistItem', fields: ['title', 'description', 'notes'] },
  { type: 'pdf', entity: 'Document', fields: ['title', 'notes'] }, // OCR placeholder
  { type: 'sop', entity: 'SOPTemplate', fields: ['title', 'description'] },
  { type: 'property', entity: 'Property', fields: ['electrical_notes', 'plumbing_notes', 'networking_notes', 'security_notes'] },
];

// ── AI ACTION REGISTRY ────────────────────────────────────────────────────────
export const AI_ACTIONS = {
  create_estimate_draft: {
    id: 'create_estimate_draft',
    label: 'Crea Bozza Preventivo',
    icon: '📋',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager', 'sales'],
    destructive: false,
  },
  create_task: {
    id: 'create_task',
    label: 'Crea Task',
    icon: '✅',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager', 'sales', 'technician'],
    destructive: false,
  },
  create_checklist: {
    id: 'create_checklist',
    label: 'Crea Checklist',
    icon: '☑️',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager', 'technician'],
    destructive: false,
  },
  create_ticket: {
    id: 'create_ticket',
    label: 'Crea Ticket',
    icon: '🎫',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager', 'technician', 'sales'],
    destructive: false,
  },
  assign_technician: {
    id: 'assign_technician',
    label: 'Assegna Tecnico',
    icon: '👷',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager'],
    destructive: false,
  },
  generate_report: {
    id: 'generate_report',
    label: 'Genera Report',
    icon: '📊',
    requires_confirmation: false,
    allowed_roles: ['admin', 'project_manager', 'sales'],
    destructive: false,
  },
  update_homepassport: {
    id: 'update_homepassport',
    label: 'Aggiorna Home Passport',
    icon: '🏠',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager'],
    destructive: false,
  },
  summarize_project: {
    id: 'summarize_project',
    label: 'Riassumi Progetto',
    icon: '📝',
    requires_confirmation: false,
    allowed_roles: ['admin', 'project_manager', 'sales', 'technician'],
    destructive: false,
  },
  suggest_pricing: {
    id: 'suggest_pricing',
    label: 'Suggerisci Prezzi',
    icon: '💶',
    requires_confirmation: false,
    allowed_roles: ['admin', 'sales', 'project_manager'],
    destructive: false,
  },
  generate_handover: {
    id: 'generate_handover',
    label: 'Report Consegna',
    icon: '🤝',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager'],
    destructive: false,
  },
  extract_knowledge: {
    id: 'extract_knowledge',
    label: 'Estrai Knowledge Base',
    icon: '🧠',
    requires_confirmation: true,
    allowed_roles: ['admin', 'project_manager'],
    destructive: false,
  },
};

// ── SAFETY RULES ─────────────────────────────────────────────────────────────
export const AI_SAFETY_RULES = [
  { pattern: /elimina|cancella|delete|drop/i, risk: 'destructive', requires_confirmation: true },
  { pattern: /cambia margine|modifica contratto|change contract/i, risk: 'financial', requires_confirmation: true },
  { pattern: /assegna|assign/i, risk: 'assignment', requires_confirmation: true },
  { pattern: /password|token|secret|api.?key/i, risk: 'sensitive', block: true },
];

// ── OCR ARCHITECTURE (Placeholder) ───────────────────────────────────────────
export const OCR_PROVIDERS = {
  tesseract: { id: 'tesseract', name: 'Tesseract JS', status: 'placeholder', languages: ['ita', 'eng'] },
  google_vision: { id: 'google_vision', name: 'Google Vision API', status: 'placeholder' },
  aws_textract: { id: 'aws_textract', name: 'AWS Textract', status: 'placeholder' },
};

// ── VOICE ARCHITECTURE (Placeholder) ─────────────────────────────────────────
export const VOICE_PROVIDERS = {
  whisper: { id: 'whisper', name: 'OpenAI Whisper', status: 'available_via_base44' },
  elevenlabs: { id: 'elevenlabs', name: 'ElevenLabs TTS', status: 'placeholder' },
};

export default {
  LLM_PROVIDERS,
  VECTOR_DB_PROVIDERS,
  RAG_CONFIG,
  DOCUMENT_INDEX_SCHEMA,
  INDEXABLE_DOCUMENT_TYPES,
  AI_ACTIONS,
  AI_SAFETY_RULES,
  OCR_PROVIDERS,
  VOICE_PROVIDERS,
};