import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id } = await req.json();
    if (!document_id) {
      return Response.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Fetch document to verify user has access
    const docs = await base44.entities.Document.filter({ id: document_id });
    if (docs.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docs[0];

    // SECURITY: Verify user has access to this document
    // Check based on user role and document associations
    if (user.role === 'client') {
      // Client can only access their own documents
      const clientDocs = await base44.asServiceRole.entities.Document.filter({ 
        id: document_id,
        client_id: doc.client_id 
      });
      if (clientDocs.length === 0) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'technician') {
      // Technician can access documents for assigned projects
      if (doc.project_id) {
        const project = await base44.asServiceRole.entities.Project.filter({ id: doc.project_id });
        if (project.length > 0) {
          const isAssigned = project[0].team_members?.includes(user.email) || 
                            project[0].created_by === user.email;
          if (!isAssigned) {
            return Response.json({ error: 'Access denied' }, { status: 403 });
          }
        }
      }
    }
    // Admin, PM, Sales have full access

    // File must be uploaded to private storage for signed URLs
    // If it's a public file_url, we need to convert it to file_uri first
    if (!doc.file_url) {
      return Response.json({ error: 'No file attached' }, { status: 404 });
    }

    // Extract file_uri from file_url if it's a Base44 private file
    // Base44 file URLs typically have format: https://storage.base44.com/...
    // For signed URLs, we need the file_uri path
    const file_uri = doc.file_uri || `/files/${doc.file_url.split('/').pop()}`;

    // Create signed URL with 7-day expiration (604800 seconds)
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 604800 // 7 days
    });

    return Response.json({ 
      signed_url,
      expires_at: new Date(Date.now() + 604800000).toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});