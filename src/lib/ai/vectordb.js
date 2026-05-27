/**
 * Vector Database Adapter
 *
 * Unified interface for storing and querying vector embeddings.
 * Currently backed by Base44 RAGDocument entity store.
 *
 * Interface:
 *   vectordb.upsert(id, vector, metadata?) → Promise<void>   [future]
 *   vectordb.query(vector, topK?, filter?) → Promise<Match[]> [future]
 *   vectordb.delete(id) → Promise<void>                       [future]
 *   vectordb.listCollections() → Promise<string[]>            [future]
 */

/**
 * [STUB] Upsert a vector with associated metadata.
 */
async function upsert(id, vector, metadata = {}, options = {}) {
  const provider = options.provider ?? 'base44_internal';

  if (provider === 'pinecone') {
    // TODO: invoke backend function `pineconeUpsert`
    // Requires: PINECONE_API_KEY, index name, namespace
    throw new Error('Pinecone not yet activated. Set PINECONE_API_KEY and create pineconeUpsert function.');
  }

  if (provider === 'supabase_pgvector') {
    // TODO: invoke backend function `pgvectorUpsert`
    throw new Error('pgvector not yet activated. Configure Supabase connection.');
  }

  // Default: store in RAGDocument entity (text-based, not raw vectors)
  throw new Error('Direct vector upsert requires an external vector DB. Use embeddings.index() for the current RAG pipeline.');
}

/**
 * [STUB] Query by vector similarity.
 */
async function query(vector, topK = 10, filter = {}, options = {}) {
  throw new Error('Direct vector query requires an external vector DB. Use embeddings.search() for the current RAG pipeline.');
}

/**
 * [STUB] Delete a vector by ID.
 */
async function deleteVector(id, options = {}) {
  throw new Error('Direct vector delete requires an external vector DB.');
}

export const vectordb = { upsert, query, delete: deleteVector };