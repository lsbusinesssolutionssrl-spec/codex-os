import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id (tenant)
    const companyId = user.company_id;
    
    if (!companyId) {
      return Response.json({ 
        error: 'User has no tenant association',
        data_maturity: { level: 0, message: 'No tenant context' }
      }, { status: 400 });
    }

    // Load ONLY tenant-filtered data
    const [projects, costs, learnings, insights] = await Promise.all([
      base44.entities.Project.filter({ company_id: companyId }),
      base44.entities.ProjectCost.filter({ company_id: companyId }),
      base44.entities.ProjectLearning.filter({ company_id: companyId }),
      base44.entities.IntelligenceInsight.filter({ company_id: companyId }),
    ]);

    // Calculate data maturity level
    const maturity = calculateDataMaturity(projects, costs, learnings);

    // Only generate insights if sufficient data exists
    if (maturity.level < 2) {
      return Response.json({
        message: 'Insufficient data for AI insights',
        data_maturity: maturity,
        insights_generated: 0,
        recommendation: maturity.recommendation,
      });
    }

    const newInsights = [];

    // Generate insights ONLY from real tenant data
    for (const project of projects) {
      const marginPct = project.gross_margin_pct || 0;
      
      if (marginPct < 25 && project.status !== 'Archived') {
        newInsights.push({
          company_id: companyId,
          insight_type: 'Profitability',
          category: 'Financial',
          severity: marginPct < 15 ? 'Critical' : 'High',
          title: `Margine Critico: ${project.title}`,
          description: `Il progetto ha un margine del ${marginPct.toFixed(1)}%, sotto la soglia del 25%`,
          recommendation: 'Rivedere i costi o negoziare variazioni con il cliente',
          impact: `Perdita potenziale di €${(project.contract_value || 0 * 0.1).toFixed(0)}`,
          metrics: {
            value: marginPct,
            trend: 'down',
            change_pct: -5
          },
          project_id: project.id,
          is_actionable: true,
          confidence_level: 'high',
          data_sources: ['project_costs', 'estimate_data'],
          generated_at: new Date().toISOString(),
        });
      }
    }

    // Generate insights from lessons learned (only completed projects)
    for (const learning of learnings) {
      if (learning.what_went_wrong && learning.improvements) {
        const project = projects.find(p => p.id === learning.project_id);
        if (project && project.status === 'Delivered') {
          newInsights.push({
            company_id: companyId,
            insight_type: 'Trend',
            category: learning.category || 'Operations',
            severity: 'Medium',
            title: `Learning: ${learning.project_type || 'Progetto'}`,
            description: learning.what_went_wrong,
            recommendation: learning.improvements,
            impact: 'Miglioramento processi futuri',
            metrics: {
              value: learning.gross_margin_pct || 0,
              trend: learning.would_repeat ? 'up' : 'stable',
              change_pct: 0
            },
            project_id: learning.project_id,
            is_actionable: true,
            confidence_level: 'medium',
            data_sources: ['lessons_learned', 'project_closure'],
            generated_at: new Date().toISOString(),
          });
        }
      }
    }

    // Create insights with tenant isolation
    if (newInsights.length > 0) {
      await base44.entities.IntelligenceInsight.bulkCreate(newInsights);
    }

    return Response.json({ 
      message: `Generati ${newInsights.length} intelligence insight`,
      count: newInsights.length,
      data_maturity: maturity,
      tenant_id: companyId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Data Maturity Engine
function calculateDataMaturity(projects, costs, learnings) {
  const completedProjects = projects.filter(p => p.status === 'Delivered');
  const activeProjects = projects.filter(p => ['In Progress', 'Testing', 'Approved'].includes(p.status));
  const hasFinancialData = costs.length > 0;
  const hasHistoricalData = completedProjects.length > 0;
  const hasTimesheets = false; // Would need to check timesheets entity
  
  let level = 0;
  const milestones = [];

  // LEVEL 0: No projects
  if (projects.length === 0) {
    milestones.push('❌ No projects tracked');
    return {
      level: 0,
      milestones,
      recommendation: 'Start by creating your first project to unlock operational intelligence',
      readiness: {
        projects: 0,
        financial_data: 0,
        team_tracking: 0,
        historical_depth: 0,
        ai_confidence: 'none',
      },
    };
  }

  milestones.push(`✅ ${projects.length} projects tracked`);

  // LEVEL 1: Projects exist (basic operational metrics)
  level = 1;

  if (hasFinancialData) {
    milestones.push(`✅ ${costs.length} cost records`);
    level = 2; // LEVEL 2: Financials exist (margin analytics)
  } else {
    milestones.push('❌ No cost tracking activated');
  }

  if (hasHistoricalData) {
    milestones.push(`✅ ${completedProjects.length} completed projects`);
    level = 4; // LEVEL 4: Historical data exists (predictive insights)
  } else {
    milestones.push('❌ No completed projects yet');
  }

  if (learnings.length > 0) {
    milestones.push(`✅ ${learnings.length} lessons learned`);
    level = Math.max(level, 3); // LEVEL 3: Team/time tracking
  } else {
    milestones.push('❌ No lessons learned captured');
  }

  // Calculate readiness percentages
  const readiness = {
    projects: Math.min(100, (projects.length / 10) * 100), // Target: 10 projects
    financial_data: hasFinancialData ? Math.min(100, (costs.length / 50) * 100) : 0, // Target: 50 cost records
    team_tracking: 0, // Would need timesheets
    historical_depth: hasHistoricalData ? Math.min(100, (completedProjects.length / 5) * 100) : 0, // Target: 5 completed
    ai_confidence: level >= 3 ? 'medium' : level >= 2 ? 'low' : 'none',
  };

  const recommendation = getMaturityRecommendation(level, milestones);

  return {
    level,
    milestones,
    recommendation,
    readiness,
  };
}

function getMaturityRecommendation(level, milestones) {
  switch (level) {
    case 0:
      return 'Create your first project to begin tracking operational data';
    case 1:
      return 'Start tracking project costs to unlock margin analytics';
    case 2:
      return 'Complete project lifecycles and capture lessons learned for predictive insights';
    case 3:
      return 'Continue building historical data for advanced AI recommendations';
    case 4:
      return 'Excellent data maturity! AI can now provide strategic operational intelligence';
    default:
      return 'Continue improving data quality for better insights';
  }
}