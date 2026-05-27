# Workspace System - Quick Start Guide

## What Changed?

Codex OS now has **role-based workspaces** - dedicated operational environments for each user type.

## Quick Navigation

### For Technicians
→ Your workspace loads automatically at `/`  
→ Shows ONLY your assigned tasks, projects, and field tools  
→ Optimized for mobile use

### For Sales
→ Access at `/workspace` or switch from header  
→ See leads, estimates, pipeline, and AI estimator  
→ Focus on conversion and follow-ups

### For Project Managers
→ Default: Operations workspace  
→ Projects, scheduling, tasks, tickets, team coordination  
→ Fast, actionable, operational

### For Executives
→ Executive workspace provides strategic oversight  
→ Business intelligence, margins, risks, team performance  
→ Decision-focused dashboard

### For Finance
→ Financial workspace  
→ Profitability, cashflow, margins, alerts  
→ Numbers-first, no operational clutter

### For Super Admins
→ Platform workspace  
→ Tenants, analytics, AI systems, developer tools  
→ Full system controls

## How to Switch Workspaces

1. Look for the workspace dropdown in the header (next to brand selector)
2. Click to see available workspaces for your role
3. Select desired workspace
4. Instant switch - preference saved automatically

## Role Restrictions

You can ONLY access workspaces authorized for your role:

- **Admin**: All workspaces
- **Company Admin**: Executive, Operations, Financial, Sales, Guardian
- **Project Manager**: Operations, Financial
- **Technician**: Technician ONLY
- **Sales**: Sales ONLY

## Workspace Features

Each workspace includes:
- ✅ Dedicated dashboard with role-specific KPIs
- ✅ Custom navigation (only relevant tools)
- ✅ Quick actions grid
- ✅ Role-aware AI assistance
- ✅ Unique visual identity (colors, icons)
- ✅ Mobile optimization (especially Technician)

## Technical Details

- Workspace preference saved in `localStorage`
- Audit logging tracks workspace switches
- Unified backend (no data fragmentation)
- Real-time sync across workspaces

## Questions?

See full documentation: `docs/ROLE_BASED_WORKSPACE_SYSTEM.md