/**
 * TENANT TEAM SERVICE
 * Single source of truth for all team-related data
 * 
 * All team data comes from TenantMembership entity
 * filtered by tenant_id and joined with User data.
 */

import { base44 } from '@/api/base44Client';

export const TenantTeamService = {
  /**
   * Get all team memberships for a tenant
   * Returns raw TenantMembership records with User data joined
   */
  getAllMemberships: async (tenantId) => {
    try {
      const [memberships, users] = await Promise.all([
        base44.entities.TenantMembership.filter({ tenant_id: tenantId }),
        base44.entities.User.list(),
      ]);

      console.log('[TenantTeamService] Loaded:', {
        membershipsCount: memberships.length,
        usersCount: users.length,
        tenantId,
      });

      return memberships.map(m => ({
        ...m,
        user: users.find(u => u.id === m.user_id),
      }));
    } catch (error) {
      console.error('[TenantTeamService] Error loading memberships:', error);
      throw error;
    }
  },

  /**
   * Get team summary for dashboard
   * Returns counts that match Team & Ruoli page
   */
  getTeamSummary: async (tenantId) => {
    const allMemberships = await TenantTeamService.getAllMemberships(tenantId);
    
    const activeMembers = allMemberships.filter(m => m.status === 'active');
    const pendingInvites = allMemberships.filter(m => ['invited', 'pending'].includes(m.status));
    const removedMembers = allMemberships.filter(m => m.status === 'removed');
    const suspendedMembers = allMemberships.filter(m => m.status === 'suspended');

    return {
      activeMembersCount: activeMembers.length,
      pendingInvitesCount: pendingInvites.length,
      removedCount: removedMembers.length,
      suspendedCount: suspendedMembers.length,
      totalCount: activeMembers.length + pendingInvites.length,
      allMemberships: allMemberships.length,
      membershipsMissingUser: allMemberships.filter(m => !m.user).length,
    };
  },

  /**
   * Get active team members (for Team & Ruoli main list)
   */
  getActiveMembers: async (tenantId) => {
    const allMemberships = await TenantTeamService.getAllMemberships(tenantId);
    return allMemberships.filter(m => m.status === 'active');
  },

  /**
   * Get pending invitations (for Team & Ruoli invitations list)
   */
  getPendingInvitations: async (tenantId) => {
    const allMemberships = await TenantTeamService.getAllMemberships(tenantId);
    return allMemberships.filter(m => ['invited', 'pending'].includes(m.status));
  },

  /**
   * Debug: Get detailed team pipeline info
   */
  debugTeamPipeline: async (tenantId) => {
    const [memberships, users] = await Promise.all([
      base44.entities.TenantMembership.filter({ tenant_id: tenantId }),
      base44.entities.User.list(),
    ]);

    const membersWithUsers = memberships.map(m => ({
      ...m,
      user: users.find(u => u.id === m.user_id),
    }));

    return {
      tenantId,
      rawMembershipsCount: memberships.length,
      activeCount: membersWithUsers.filter(m => m.status === 'active').length,
      pendingCount: membersWithUsers.filter(m => ['invited', 'pending'].includes(m.status)).length,
      removedCount: membersWithUsers.filter(m => m.status === 'removed').length,
      suspendedCount: membersWithUsers.filter(m => m.status === 'suspended').length,
      usersLoaded: users.length,
      membershipsMissingUser: membersWithUsers.filter(m => !m.user).length,
      memberships: membersWithUsers.map(m => ({
        id: m.id,
        user_id: m.user_id,
        user_email: m.user?.email,
        tenant_role: m.tenant_role,
        status: m.status,
        invited_by: m.invited_by,
        joined_at: m.joined_at,
      })),
    };
  },
};