import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testResults = {
      user_email: user.email,
      user_role: user.role,
      user_company_id: user.company_id || null,
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Check TenantMembership
    const memberships = await base44.asServiceRole.entities.TenantMembership.filter({ user_id: user.id });
    testResults.tests.push({
      name: 'TenantMembership Check',
      passed: memberships.length > 0,
      details: memberships.length > 0 
        ? `Found ${memberships.length} membership(s): ${memberships.map(m => m.tenant_id).join(', ')}`
        : 'No TenantMembership records found',
      memberships: memberships.map(m => ({
        tenant_id: m.tenant_id,
        tenant_role: m.tenant_role,
        status: m.status,
      })),
    });

    // Test 2: Get company context
    if (user.company_id) {
      const company = await base44.asServiceRole.entities.Company.get(user.company_id);
      testResults.tests.push({
        name: 'Company Context',
        passed: !!company,
        details: company 
          ? `Company: ${company.name} (${company.slug})`
          : `company_id ${user.company_id} exists but Company not found`,
        company: company ? { name: company.name, slug: company.slug } : null,
      });
    } else {
      testResults.tests.push({
        name: 'Company Context',
        passed: user.role === 'admin' || user.role === 'developer',
        details: user.role === 'admin' || user.role === 'developer'
          ? 'Platform user - no company_id expected'
          : 'ERROR: Tenant user without company_id',
      });
    }

    // Test 3: Query data with tenant filter
    if (user.company_id) {
      const [projects, clients, estimates] = await Promise.all([
        base44.entities.Project.filter({ company_id: user.company_id }),
        base44.entities.Client.filter({ company_id: user.company_id }),
        base44.entities.Estimate.filter({ company_id: user.company_id }),
      ]);

      testResults.tests.push({
        name: 'Tenant-Filtered Data Query',
        passed: true,
        details: `Found ${projects.length} projects, ${clients.length} clients, ${estimates.length} estimates`,
        counts: {
          projects: projects.length,
          clients: clients.length,
          estimates: estimates.length,
        },
        has_sample_data: projects.some(p => p.is_sample) || clients.some(c => c.is_sample),
      });

      // Test 4: Check for sample data leakage
      const sampleProjects = projects.filter(p => p.is_sample);
      const sampleClients = clients.filter(c => c.is_sample);
      
      testResults.tests.push({
        name: 'Sample Data Check',
        passed: sampleProjects.length === 0 && sampleClients.length === 0,
        details: sampleProjects.length === 0 && sampleClients.length === 0
          ? 'No sample data found - using real tenant data only'
          : `WARNING: Found ${sampleProjects.length} sample projects and ${sampleClients.length} sample clients`,
        sample_counts: {
          projects: sampleProjects.length,
          clients: sampleClients.length,
        },
      });

      // Test 5: Intelligence Insights
      const insights = await base44.entities.IntelligenceInsight.filter({ 
        company_id: user.company_id 
      }, '-created_date', 10);

      testResults.tests.push({
        name: 'Intelligence Insights',
        passed: true,
        details: `Found ${insights.length} insights for tenant`,
        insights: insights.map(i => ({
          id: i.id,
          title: i.title,
          insight_type: i.insight_type,
          severity: i.severity,
          created_date: i.created_date,
          company_id: i.company_id,
        })),
      });
    } else {
      testResults.tests.push({
        name: 'Tenant-Filtered Data Query',
        passed: false,
        details: 'Skipped - no company_id',
      });
      
      testResults.tests.push({
        name: 'Sample Data Check',
        passed: true,
        details: 'Skipped - platform user',
      });
      
      testResults.tests.push({
        name: 'Intelligence Insights',
        passed: true,
        details: 'Skipped - platform user',
      });
    }

    // Test 6: Platform users can access all tenants (via service role)
    if (user.role === 'admin' || user.role === 'developer') {
      const allCompanies = await base44.asServiceRole.entities.Company.list();
      const allProjects = await base44.asServiceRole.entities.Project.list(undefined, 5);
      
      testResults.tests.push({
        name: 'Platform Access Check',
        passed: true,
        details: `Platform user can see ${allCompanies.length} companies`,
        platform_stats: {
          total_companies: allCompanies.length,
          sample_projects_visible: allProjects.length,
        },
      });
    }

    // Summary
    const passedTests = testResults.tests.filter(t => t.passed).length;
    const totalTests = testResults.tests.length;
    
    testResults.summary = {
      total_tests: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      all_passed: passedTests === totalTests,
    };

    return Response.json(testResults);
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
});