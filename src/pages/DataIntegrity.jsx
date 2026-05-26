import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Database, TrendingUp, Users, Home, FileText, FolderKanban, Shield, Archive } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DataIntegrity() {
  const [issues, setIssues] = useState({});
  const [checking, setChecking] = useState(false);

  const checkIntegrity = async () => {
    setChecking(true);
    const results = {};

    try {
      // Fetch all data
      const [projects, estimates, clients, properties, guardians, tickets, documents, costs] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.Client.list(),
        base44.entities.Property.list(),
        base44.entities.GuardianSubscription.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Document.list(),
        base44.entities.ProjectCost.list(),
      ]);

      // 1. Projects without client
      results.projectsNoClient = projects.filter(p => !p.client_id);

      // 2. Projects without property
      results.projectsNoProperty = projects.filter(p => !p.property_id);

      // 3. Accepted estimates not converted to project
      results.acceptedNotConverted = estimates.filter(
        e => e.status === 'Accepted' && !estimates.some(e2 => e2.estimate_id === e.id)
      );

      // 4. Delivered projects without Home Passport update
      results.deliveredNoPassport = projects.filter(
        p => p.status === 'Delivered' && !properties.some(prop => 
          prop.interventions?.some(i => i.project_id === p.id)
        )
      );

      // 5. Guardian subscriptions without property
      results.guardiansNoProperty = guardians.filter(g => !g.property_id);

      // 6. Tickets without client
      results.ticketsNoClient = tickets.filter(t => !t.client_id);

      // 7. Documents not linked to any entity
      results.orphanDocuments = documents.filter(
        d => !d.client_id && !d.property_id && !d.project_id
      );

      // 8. Projects with missing financial data
      results.projectsNoFinancials = projects.filter(
        p => p.status === 'In Progress' && !p.contract_value
      );

      // 9. Duplicate clients (by email)
      const clientEmails = {};
      clients.forEach(c => {
        if (c.email) {
          clientEmails[c.email] = (clientEmails[c.email] || 0) + 1;
        }
      });
      results.duplicateClients = clients.filter(c => c.email && clientEmails[c.email] > 1);

      // 10. Duplicate properties (by address + client)
      const propertyKeys = {};
      properties.forEach(p => {
        const key = `${p.address}_${p.client_id}`;
        propertyKeys[key] = (propertyKeys[key] || 0) + 1;
      });
      results.duplicateProperties = properties.filter(p => {
        const key = `${p.address}_${p.client_id}`;
        return propertyKeys[key] > 1;
      });

      setIssues(results);
    } catch (error) {
      console.error('Integrity check failed:', error);
      toast.error('Failed to check data integrity');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkIntegrity();
  }, []);

  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Integrity</h1>
            <p className="text-sm text-gray-500">
              {totalIssues === 0 ? 'All data relationships valid' : `${totalIssues} issues found`}
            </p>
          </div>
        </div>
        <button
          onClick={checkIntegrity}
          disabled={checking}
          className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
          style={{ backgroundColor: '#1147FF' }}
        >
          {checking ? 'Checking...' : 'Recheck'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <IssueCard 
          icon={Users} 
          label="Duplicate Clients" 
          count={issues.duplicateClients?.length || 0} 
          color="#EF4444"
        />
        <IssueCard 
          icon={Home} 
          label="Duplicate Properties" 
          count={issues.duplicateProperties?.length || 0} 
          color="#EF4444"
        />
        <IssueCard 
          icon={FolderKanban} 
          label="Projects No Client" 
          count={issues.projectsNoClient?.length || 0} 
          color="#F58220"
        />
        <IssueCard 
          icon={FileText} 
          label="Estimates Not Converted" 
          count={issues.acceptedNotConverted?.length || 0} 
          color="#F58220"
        />
        <IssueCard 
          icon={Shield} 
          label="Guardians No Property" 
          count={issues.guardiansNoProperty?.length || 0} 
          color="#F58220"
        />
      </div>

      {/* Detailed Issues */}
      {totalIssues > 0 && (
        <div className="space-y-4">
          {issues.projectsNoClient?.length > 0 && (
            <IssueSection title="Projects Without Client" icon={AlertTriangle} color="#F58220">
              {issues.projectsNoClient.map(p => (
                <ProjectLinkFix 
                  key={p.id} 
                  project={p} 
                  issueType="link_project_client"
                  onFix={checkIntegrity}
                />
              ))}
            </IssueSection>
          )}

          {issues.projectsNoProperty?.length > 0 && (
            <IssueSection title="Projects Without Property" icon={AlertTriangle} color="#F58220">
              {issues.projectsNoProperty.map(p => (
                <ProjectLinkFix 
                  key={p.id} 
                  project={p} 
                  issueType="link_project_property"
                  onFix={checkIntegrity}
                />
              ))}
            </IssueSection>
          )}

          {issues.acceptedNotConverted?.length > 0 && (
            <IssueSection title="Accepted Estimates Not Converted" icon={AlertTriangle} color="#F58220">
              {issues.acceptedNotConverted.map(e => (
                <div key={e.id} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">{e.title} - €{e.revenue} (ID: {e.id})</div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Convert "${e.title}" to project?`)) return;
                      try {
                        await base44.functions.invoke('fixDataIntegrityIssue', { 
                          issue_type: 'convert_estimate_to_project',
                          record_id: e.id 
                        });
                        toast.success('Estimate converted to project');
                        checkIntegrity();
                      } catch (err) {
                        toast.error(err.message || 'Conversion failed');
                      }
                    }}
                    className="px-3 py-1 text-xs text-white rounded-lg flex-shrink-0"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    Convert to Project
                  </button>
                </div>
              ))}
            </IssueSection>
          )}

          {issues.duplicateClients?.length > 0 && (
            <IssueSection title="Duplicate Clients" icon={AlertTriangle} color="#EF4444">
              {(() => {
                // Group duplicates by email
                const emailGroups = {};
                issues.duplicateClients.forEach(c => {
                  if (!emailGroups[c.email]) emailGroups[c.email] = [];
                  emailGroups[c.email].push(c);
                });
                
                return Object.entries(emailGroups).map(([email, clients]) => (
                  <div key={email} className="mb-4 last:mb-0">
                    <div className="text-xs font-medium text-gray-500 mb-2">{email}</div>
                    <div className="space-y-2">
                      {clients.map((c, idx) => (
                        <div key={c.id} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">{c.name} (ID: {c.id})</div>
                          {clients.length > 1 && (
                            <div className="flex gap-2">
                              {idx === 0 ? (
                                <span className="text-xs text-green-600 font-medium">Keep</span>
                              ) : (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Merge ${c.email} into ${clients[0].email}? All records will be transferred.`)) return;
                                    try {
                                      await base44.functions.invoke('fixDataIntegrityIssue', {
                                        issue_type: 'merge_duplicate_clients',
                                        keep_id: clients[0].id,
                                        merge_id: c.id
                                      });
                                      toast.success('Clients merged successfully');
                                      checkIntegrity();
                                    } catch (err) {
                                      toast.error(err.message || 'Merge failed');
                                    }
                                  }}
                                  className="px-3 py-1 text-xs text-white rounded-lg"
                                  style={{ backgroundColor: '#EF4444' }}
                                >
                                  Merge into First
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </IssueSection>
          )}

          {issues.duplicateProperties?.length > 0 && (
            <IssueSection title="Duplicate Properties" icon={AlertTriangle} color="#EF4444">
              {issues.duplicateProperties.map(p => (
                <div key={p.id} className="text-sm text-gray-600">{p.property_name} - {p.address} (ID: {p.id})</div>
              ))}
            </IssueSection>
          )}

          {issues.orphanDocuments?.length > 0 && (
            <IssueSection title="Orphan Documents" icon={AlertTriangle} color="#F58220">
              {issues.orphanDocuments.map(d => (
                <div key={d.id} className="text-sm text-gray-600">{d.title} (ID: {d.id})</div>
              ))}
            </IssueSection>
          )}
        </div>
      )}

      {totalIssues === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-green-800 font-medium">All data relationships are valid!</p>
          <p className="text-green-600 text-sm mt-1">No orphaned records or missing relationships found.</p>
        </div>
      )}
    </div>
  );
}

function IssueCard({ icon: Icon, label, count, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${count > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {count}
      </p>
    </div>
  );
}

function IssueSection({ title, icon: Icon, color, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2" style={{ backgroundColor: color + '10' }}>
        <Icon className="w-4 h-4" style={{ color }} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5 space-y-2">
        {children}
      </div>
    </div>
  );
}

function ProjectLinkFix({ project, issueType, onFix }) {
  const [linking, setLinking] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [entities, setEntities] = useState([]);

  const loadEntities = async () => {
    try {
      const data = issueType === 'link_project_client' 
        ? await base44.entities.Client.list()
        : await base44.entities.Property.list();
      setEntities(data);
      setShowSelect(true);
    } catch (err) {
      toast.error('Failed to load entities');
    }
  };

  const handleLink = async () => {
    if (!selectedId) return;
    setLinking(true);
    try {
      await base44.functions.invoke('fixDataIntegrityIssue', {
        issue_type: issueType,
        project_id: project.id,
        [issueType === 'link_project_client' ? 'client_id' : 'property_id']: selectedId
      });
      toast.success('Project linked successfully');
      setShowSelect(false);
      onFix();
    } catch (err) {
      toast.error(err.message || 'Link failed');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600">{project.title} (ID: {project.id})</div>
      {!showSelect ? (
        <button
          onClick={loadEntities}
          className="px-3 py-1 text-xs text-white rounded-lg flex-shrink-0"
          style={{ backgroundColor: '#1147FF' }}
        >
          Link
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Select...</option>
            {entities.map(e => (
              <option key={e.id} value={e.id}>
                {issueType === 'link_project_client' ? e.name : e.property_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={!selectedId || linking}
            className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: '#10B981' }}
          >
            {linking ? '...' : 'Save'}
          </button>
          <button
            onClick={() => setShowSelect(false)}
            className="px-2 py-1 text-xs text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function GuardianLinkFix({ guardian, onFix }) {
  const [linking, setLinking] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [properties, setProperties] = useState([]);

  const loadProperties = async () => {
    try {
      const data = await base44.entities.Property.list();
      setProperties(data);
      setShowSelect(true);
    } catch (err) {
      toast.error('Failed to load properties');
    }
  };

  const handleLink = async () => {
    if (!selectedId) return;
    setLinking(true);
    try {
      await base44.functions.invoke('fixDataIntegrityIssue', {
        issue_type: 'link_guardian_property',
        guardian_id: guardian.id,
        property_id: selectedId
      });
      toast.success('Guardian linked successfully');
      setShowSelect(false);
      onFix();
    } catch (err) {
      toast.error(err.message || 'Link failed');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600">{guardian.title} (ID: {guardian.id})</div>
      {!showSelect ? (
        <button
          onClick={loadProperties}
          className="px-3 py-1 text-xs text-white rounded-lg flex-shrink-0"
          style={{ backgroundColor: '#1147FF' }}
        >
          Link Property
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Select...</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.property_name}</option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={!selectedId || linking}
            className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: '#10B981' }}
          >
            {linking ? '...' : 'Save'}
          </button>
          <button
            onClick={() => setShowSelect(false)}
            className="px-2 py-1 text-xs text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}