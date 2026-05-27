import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Automation Engine - processes business events and creates notifications
 * Call with: { event, entity_id, entity_type, data }
 * Events: estimate_accepted, estimate_rejected, project_delayed, ticket_urgent,
 *         guardian_expiring, margin_below_target, project_delivered, checklist_overdue
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event, entity_id, entity_type, data = {}, company_id } = await req.json();

    const notifications = [];
    const now = new Date().toISOString();

    // Helper to create a notification
    const notify = async (notif) => {
      const created = await base44.asServiceRole.entities.Notification.create({
        company_id: company_id || user.company_id,
        is_read: false,
        ...notif,
      });
      notifications.push(created);
      return created;
    };

    // Get users by role
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin').map(u => u.email);
    const pms = allUsers.filter(u => u.role === 'project_manager' || u.role === 'admin').map(u => u.email);
    const sales = allUsers.filter(u => u.role === 'sales' || u.role === 'admin').map(u => u.email);

    switch (event) {
      case 'estimate_accepted': {
        // Notify sales + PM
        const recipients = [...new Set([...sales, ...pms])];
        for (const email of recipients) {
          await notify({
            title: 'Preventivo accettato!',
            message: `Il preventivo "${data.title || entity_id}" è stato accettato`,
            type: 'estimate_accepted',
            priority: 'High',
            entity_type: 'estimate',
            entity_id,
            assigned_to: email,
            action_url: `/estimates/${entity_id}`,
          });
        }
        break;
      }

      case 'estimate_rejected': {
        for (const email of sales) {
          await notify({
            title: 'Preventivo rifiutato',
            message: `Il preventivo "${data.title || entity_id}" è stato rifiutato${data.rejection_reason ? `: ${data.rejection_reason}` : ''}`,
            type: 'estimate_rejected',
            priority: 'Medium',
            entity_type: 'estimate',
            entity_id,
            assigned_to: email,
            action_url: `/estimates/${entity_id}`,
          });
        }
        break;
      }

      case 'project_delayed': {
        // Notify PM + Admin
        const pmEmail = data.project_manager;
        const recipients = [...new Set([...admins, ...(pmEmail ? [pmEmail] : [])])];
        for (const email of recipients) {
          await notify({
            title: 'Progetto in ritardo',
            message: `Il progetto "${data.title || entity_id}" ha superato la data prevista`,
            type: 'project_delayed',
            priority: 'High',
            entity_type: 'project',
            entity_id,
            assigned_to: email,
            action_url: `/projects/${entity_id}`,
          });
        }
        break;
      }

      case 'project_delivered': {
        // Suggest Home Passport update
        const recipients = [...new Set([...admins, ...(data.project_manager ? [data.project_manager] : [])])];
        for (const email of recipients) {
          await notify({
            title: 'Progetto consegnato ✓',
            message: `"${data.title}" consegnato. Considera di aggiornare l'Home Passport`,
            type: 'project_delivered',
            priority: 'Medium',
            entity_type: 'project',
            entity_id,
            assigned_to: email,
            action_url: `/projects/${entity_id}`,
          });
        }
        break;
      }

      case 'ticket_urgent': {
        const techEmail = data.assigned_technician;
        const recipients = [...new Set([...admins, ...(techEmail ? [techEmail] : [])])];
        for (const email of recipients) {
          await notify({
            title: '🚨 Ticket urgente',
            message: `Ticket urgente: "${data.title || entity_id}"`,
            type: 'ticket_urgent',
            priority: 'Urgent',
            entity_type: 'ticket',
            entity_id,
            assigned_to: email,
            action_url: `/tickets/${entity_id}`,
          });
        }
        break;
      }

      case 'guardian_expiring': {
        for (const email of sales) {
          await notify({
            title: 'Guardian in scadenza',
            message: `La subscription Guardian sta per scadere`,
            type: 'guardian_expiring',
            priority: 'High',
            entity_type: 'guardian',
            entity_id,
            assigned_to: email,
            action_url: `/guardian/${entity_id}`,
          });
        }
        break;
      }

      case 'margin_below_target': {
        for (const email of admins) {
          await notify({
            title: 'Margine sotto target',
            message: `Progetto "${data.title}": margine ${data.margin_pct?.toFixed(1)}% sotto il target`,
            type: 'margin_below_target',
            priority: 'High',
            entity_type: 'project',
            entity_id,
            assigned_to: email,
            action_url: `/projects/${entity_id}/financial`,
          });
        }
        break;
      }

      case 'checklist_overdue': {
        const assignee = data.assigned_person;
        if (assignee) {
          await notify({
            title: 'Checklist scaduta',
            message: `"${data.title}" è scaduta`,
            type: 'checklist_overdue',
            priority: 'Medium',
            entity_type: 'checklist',
            entity_id,
            assigned_to: assignee,
            action_url: `/checklists/${entity_id}`,
          });
        }
        break;
      }

      case 'task_assigned': {
        if (data.assigned_user) {
          await notify({
            title: 'Task assegnato a te',
            message: `"${data.title}" ti è stato assegnato${data.due_date ? ` · Scadenza: ${data.due_date}` : ''}`,
            type: 'task_assigned',
            priority: data.priority === 'Urgent' ? 'Urgent' : 'Medium',
            entity_type: 'task',
            entity_id,
            assigned_to: data.assigned_user,
            action_url: '/tasks',
          });
        }
        break;
      }

      default:
        return Response.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    return Response.json({ success: true, notifications_created: notifications.length, notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});