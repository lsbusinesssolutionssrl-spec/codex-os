import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const actions = [];
    const errors = [];

    // Get all companies
    const companies = await base44.asServiceRole.entities.Company.list();
    
    // 1. CODEX-OS - Internal Platform Workspace
    const codexOS = companies.find(c => c.slug === 'codex-os' || c.name === 'CODEX-OS');
    if (codexOS) {
      try {
        await base44.asServiceRole.entities.Company.update(codexOS.id, {
          tenant_type: 'internal',
          visibility: 'platform_only',
        });
        actions.push(`✅ CODEX-OS → internal, platform_only`);
      } catch (e) {
        errors.push(`❌ CODEX-OS: ${e.message}`);
      }
    }

    // 2. Ls Business Solutions Srl - TRUE PRODUCTION TENANT
    const productionTenant = companies.find(c => c.email === 'amministrazione@lsbusiness.it');
    if (productionTenant) {
      try {
        await base44.asServiceRole.entities.Company.update(productionTenant.id, {
          tenant_type: 'production_customer',
          visibility: 'visible',
        });
        actions.push(`✅ Ls Business Solutions Srl → production_customer, visible`);

        // Repair membership for admin user
        const adminMembership = await base44.asServiceRole.entities.TenantMembership.filter({
          tenant_id: productionTenant.id,
          user_email: 'amministrazione@lsbusiness.it',
        }).then(m => m[0]);

        if (adminMembership) {
          await base44.asServiceRole.entities.TenantMembership.update(adminMembership.id, {
            tenant_role: 'tenant_admin',
            status: 'active',
            membership_type: 'customer_member',
            is_primary: true,
          });
          actions.push(`✅ Admin membership repaired for amministrazione@lsbusiness.it`);
        } else {
          // Create membership if missing
          const adminUser = await base44.asServiceRole.entities.User.filter({
            email: 'amministrazione@lsbusiness.it',
          }).then(u => u[0]);

          if (adminUser) {
            await base44.asServiceRole.entities.TenantMembership.create({
              user_id: adminUser.id,
              tenant_id: productionTenant.id,
              tenant_role: 'tenant_admin',
              status: 'active',
              membership_type: 'customer_member',
              is_primary: true,
              invited_by: user.email,
              invited_at: new Date().toISOString(),
              joined_at: new Date().toISOString(),
            });
            actions.push(`✅ Admin membership created for amministrazione@lsbusiness.it`);
          }
        }
      } catch (e) {
        errors.push(`❌ Ls Business Solutions Srl: ${e.message}`);
      }
    }

    // 3. Ls Business Solutions (duplicate) - ARCHIVE
    const duplicateTenant = companies.find(c => 
      c.name === 'Ls Business Solutions' && 
      c.email === 'lsbusiness.solutions.srl@gmail.com' &&
      c.id !== codexOS?.id
    );
    if (duplicateTenant) {
      try {
        await base44.asServiceRole.entities.Company.update(duplicateTenant.id, {
          tenant_type: 'duplicate',
          visibility: 'hidden',
          archived: true,
          archived_reason: 'Duplicate tenant created with platform owner email instead of tenant admin email',
          archived_at: new Date().toISOString(),
          archived_by: user.email,
        });
        actions.push(`✅ Ls Business Solutions (duplicate) → archived`);
      } catch (e) {
        errors.push(`❌ Ls Business Solutions duplicate: ${e.message}`);
      }
    }

    // 4. Demo Tenant
    const demoTenant = companies.find(c => c.name === 'Demo Tenant' || c.demo_mode === true);
    if (demoTenant) {
      try {
        await base44.asServiceRole.entities.Company.update(demoTenant.id, {
          tenant_type: 'demo',
          visibility: 'platform_only',
        });
        actions.push(`✅ Demo Tenant → demo, platform_only`);
      } catch (e) {
        errors.push(`❌ Demo Tenant: ${e.message}`);
      }
    }

    // 5. Codex Solution (Default)
    const defaultTenant = companies.find(c => c.name === 'Codex Solution (Default)' || c.slug === 'codex-solution-default');
    if (defaultTenant) {
      try {
        await base44.asServiceRole.entities.Company.update(defaultTenant.id, {
          tenant_type: 'default_seed',
          visibility: 'platform_only',
        });
        actions.push(`✅ Codex Solution (Default) → default_seed, platform_only`);
      } catch (e) {
        errors.push(`❌ Codex Solution Default: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      actions,
      errors,
      summary: {
        total: companies.length,
        classified: actions.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});