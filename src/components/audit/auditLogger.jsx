import { base44 } from '@/api/base44Client';

/**
 * Log an action to the audit trail
 * @param {string} entityType - Type of entity (Customer, ScheduleEvent, ServiceLog, InventoryItem)
 * @param {string} entityId - ID of the entity
 * @param {string} entityName - Display name of the entity
 * @param {string} action - Action performed (create, update, delete)
 * @param {object} changes - Object containing the changes made
 * @param {string} metadata - Additional context
 */
export async function logAudit(entityType, entityId, entityName, action, changes = {}, metadata = '') {
  try {
    const user = await base44.auth.me();
    const userName = user.firstname && user.lastname 
      ? `${user.firstname} ${user.lastname}` 
      : user.full_name || user.email;

    await base44.entities.AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      action,
      user_name: userName,
      changes: JSON.stringify(changes),
      metadata,
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

/**
 * Get audit logs for a specific entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - ID of the entity
 */
export async function getAuditLogs(entityType, entityId) {
  try {
    const logs = await base44.entities.AuditLog.filter(
      { entity_type: entityType, entity_id: entityId },
      '-created_date'
    );
    return logs || [];
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Get all audit logs
 */
export async function getAllAuditLogs(limit = 100) {
  try {
    const logs = await base44.entities.AuditLog.list('-created_date', limit);
    return logs || [];
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}