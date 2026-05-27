import { base44 } from '@/api/base44Client';

/**
 * TENANT METRICS SERVICE
 * Single source of truth for all tenant operational data
 * 
 * Usage:
 *   const metrics = await TenantMetricsService.getMetrics();
 *   const data = await TenantMetricsService.getOperationalData();
 */

export const TenantMetricsService = {
  /**
   * Get current user's company_id with caching
   */
  getCompanyId: async () => {
    try {
      const user = await base44.auth.me();
      return user?.company_id || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all operational data for current tenant
   * Returns EMPTY arrays if no tenant context
   */
  getOperationalData: async () => {
    const companyId = await TenantMetricsService.getCompanyId();
    
    if (!companyId) {
      return {
        projects: [],
        clients: [],
        properties: [],
        estimates: [],
        tickets: [],
        costs: [],
        timesheets: [],
        documents: [],
        guardians: [],
        suppliers: [],
        knowledge: [],
        memories: [],
        learnings: [],
      };
    }

    try {
      const [
        projects,
        clients,
        properties,
        estimates,
        tickets,
        costs,
        timesheets,
        documents,
        guardians,
        suppliers,
        knowledge,
        memories,
        learnings,
      ] = await Promise.all([
        base44.entities.Project.filter({ company_id: companyId }, '-updated_date', 100).catch(() => []),
        base44.entities.Client.filter({ company_id: companyId }, '-updated_date', 100).catch(() => []),
        base44.entities.Property.filter({ company_id: companyId }, '-updated_date', 100).catch(() => []),
        base44.entities.Estimate.filter({ company_id: companyId }, '-updated_date', 100).catch(() => []),
        base44.entities.SupportTicket.filter({ company_id: companyId }, '-created_date', 100).catch(() => []),
        base44.entities.ProjectCost.filter({ company_id: companyId }, '-date', 200).catch(() => []),
        base44.entities.Timesheet.filter({ company_id: companyId }, '-date', 100).catch(() => []),
        base44.entities.Document.filter({ company_id: companyId }, '-created_date', 100).catch(() => []),
        base44.entities.GuardianSubscription.filter({ company_id: companyId }, '-created_date', 100).catch(() => []),
        base44.entities.Supplier.filter({ company_id: companyId }, '-updated_date', 100).catch(() => []),
        base44.entities.KnowledgeBase.filter({ company_id: companyId }, '-created_date', 100).catch(() => []),
        base44.entities.AIMemory.filter({ company_id: companyId }, '-created_date', 100).catch(() => []),
        base44.entities.ProjectLearning.filter({ company_id: companyId }, '-created_date', 100).catch(() => []),
      ]);

      return {
        projects,
        clients,
        properties,
        estimates,
        tickets,
        costs,
        timesheets,
        documents,
        guardians,
        suppliers,
        knowledge,
        memories,
        learnings,
      };
    } catch (error) {
      console.error('TenantMetricsService error:', error);
      return {
        projects: [],
        clients: [],
        properties: [],
        estimates: [],
        tickets: [],
        costs: [],
        timesheets: [],
        documents: [],
        guardians: [],
        suppliers: [],
        knowledge: [],
        memories: [],
        learnings: [],
      };
    }
  },

  /**
   * Get metrics summary for dashboards
   */
  getMetrics: async () => {
    const data = await TenantMetricsService.getOperationalData();
    
    const completedProjects = data.projects.filter(p => p.status === 'Delivered');
    const activeProjects = data.projects.filter(p => ['In Progress', 'Testing', 'Approved'].includes(p.status));
    const delayedProjects = activeProjects.filter(p => 
      p.expected_end_date && new Date(p.expected_end_date) < new Date()
    );
    
    const avgMargin = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / completedProjects.length
      : 0;

    const openTickets = data.tickets.filter(t => t.status === 'Open');
    const activeGuardians = data.guardians.filter(g => g.status === 'Active');

    return {
      totalProjects: data.projects.length,
      completedProjects: completedProjects.length,
      activeProjects: activeProjects.length,
      delayedProjects: delayedProjects.length,
      avgMargin: avgMargin.toFixed(1),
      totalClients: data.clients.length,
      totalProperties: data.properties.length,
      totalEstimates: data.estimates.length,
      openTickets: openTickets.length,
      totalCosts: data.costs.length,
      totalTimesheets: data.timesheets.length,
      totalDocuments: data.documents.length,
      activeGuardians: activeGuardians.length,
      totalSuppliers: data.suppliers.length,
      knowledgeArticles: data.knowledge.length,
      aiMemories: data.memories.length,
      lessonsLearned: data.learnings.length,
      hasData: data.projects.length > 0 || data.clients.length > 0,
    };
  },

  /**
   * Check if tenant has minimum operational data
   */
  hasMinimumData: async (minimums = {}) => {
    const metrics = await TenantMetricsService.getMetrics();
    
    const defaults = {
      projects: 1,
      clients: 1,
    };
    
    const required = { ...defaults, ...minimums };
    
    return metrics.totalProjects >= required.projects && 
           metrics.totalClients >= required.clients;
  },

  /**
   * Get data maturity level (0-4)
   * 0: Empty
   * 1: Initial (basic entities)
   * 2: Growing (some projects)
   * 3: Operational (completed projects + costs)
   * 4: Advanced (full history + learnings)
   */
  getDataMaturity: async () => {
    const metrics = await TenantMetricsService.getMetrics();
    let score = 0;

    if (metrics.totalProjects > 0) score += 1;
    if (metrics.completedProjects > 0) score += 1;
    if (metrics.totalCosts > 0) score += 1;
    if (metrics.totalTimesheets > 0) score += 1;
    if (metrics.lessonsLearned > 0) score += 1;
    if (metrics.knowledgeArticles > 0) score += 1;
    if (metrics.aiMemories > 0) score += 1;

    if (score >= 6) return { level: 4, label: 'Advanced', score };
    if (score >= 4) return { level: 3, label: 'Operational', score };
    if (score >= 2) return { level: 2, label: 'Growing', score };
    if (score >= 1) return { level: 1, label: 'Initial', score };
    return { level: 0, label: 'Empty', score };
  },
};

export default TenantMetricsService;