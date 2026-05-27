import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * saveAIMemory — Persists a new AI memory with multi-entity linking.
 * Can be called from frontend or from other backend functions.
 *
 * Payload:
 *   memory_type: enum (required)
 *   title: string (required)
 *   content: string (required)
 *   client_id, property_id, project_id, supplier_id, estimate_id: optional links
 *   tags: string[] optional
 *   relevance_score: 0-1
 *   confidence: 0-1
 *   source: enum (default: 'ai_chat')
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    memory_type, title, content,
    client_id, property_id, project_id, supplier_id, estimate_id,
    tags = [], relevance_score = 0.7, confidence = 0.8,
    source = 'ai_chat',
  } = body;

  if (!memory_type || !content || !title) {
    return Response.json({ error: 'memory_type, title, content are required' }, { status: 400 });
  }

  // Determine primary linked entity (first non-null in priority order)
  let linked_entity_type = 'tenant';
  let linked_entity_id = user.company_id || '';
  if (project_id) { linked_entity_type = 'project'; linked_entity_id = project_id; }
  else if (client_id) { linked_entity_type = 'client'; linked_entity_id = client_id; }
  else if (property_id) { linked_entity_type = 'property'; linked_entity_id = property_id; }
  else if (supplier_id) { linked_entity_type = 'supplier'; linked_entity_id = supplier_id; }
  else if (estimate_id) { linked_entity_type = 'estimate'; linked_entity_id = estimate_id; }

  // Deduplicate: check if a very similar memory already exists (same type + title)
  const existing = await base44.asServiceRole.entities.AIMemory.filter({
    company_id: user.company_id,
    memory_type,
    linked_entity_id,
  }, '-created_date', 5).catch(() => []);

  const duplicate = existing.find(m =>
    m.title?.toLowerCase() === title.toLowerCase() ||
    m.content?.slice(0, 80) === content.slice(0, 80)
  );

  if (duplicate) {
    // Update access count and content if duplicate
    await base44.asServiceRole.entities.AIMemory.update(duplicate.id, {
      content,
      relevance_score: Math.min(1, (duplicate.relevance_score || 0.7) + 0.05),
      access_count: (duplicate.access_count || 0) + 1,
      last_accessed: new Date().toISOString(),
    });
    return Response.json({ memory: { ...duplicate, content }, action: 'updated' });
  }

  const memory = await base44.asServiceRole.entities.AIMemory.create({
    company_id: user.company_id,
    memory_type,
    title,
    content,
    client_id: client_id || null,
    property_id: property_id || null,
    project_id: project_id || null,
    supplier_id: supplier_id || null,
    estimate_id: estimate_id || null,
    linked_entity_type,
    linked_entity_id,
    tags,
    relevance_score,
    confidence,
    source,
    access_count: 0,
    last_accessed: new Date().toISOString(),
    is_active: true,
  });

  return Response.json({ memory, action: 'created' });
});