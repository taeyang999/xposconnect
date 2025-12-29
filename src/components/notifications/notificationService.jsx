import { base44 } from '@/api/base44Client';

/**
 * Creates a notification for an employee
 * @param {Object} params - Notification parameters
 * @param {string} params.recipientEmail - Email of the recipient
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.type - Type: 'service_log', 'schedule', 'inventory', 'general'
 * @param {string} params.link - Optional link to related page
 */
export async function createNotification({ recipientEmail, title, message, type = 'general', link = '' }) {
  return await base44.entities.Notification.create({
    recipient_email: recipientEmail,
    title,
    message,
    type,
    is_read: false,
    link,
  });
}

/**
 * Creates a notification with AI-generated personalized message
 * @param {Object} params - Parameters for generating the notification
 * @param {string} params.recipientEmail - Email of the recipient
 * @param {string} params.context - Context about what happened (e.g., "assigned to service log")
 * @param {Object} params.details - Additional details to include
 * @param {string} params.type - Notification type
 * @param {string} params.link - Optional link
 */
export async function createSmartNotification({ recipientEmail, context, details, type = 'general', link = '' }) {
  const prompt = `Generate a brief, professional notification message for an employee.
Context: ${context}
Details: ${JSON.stringify(details)}

Keep the message concise (max 2 sentences) and friendly. Return only the message text, no quotes.`;

  const generatedMessage = await base44.integrations.Core.InvokeLLM({ prompt });

  return await createNotification({
    recipientEmail,
    title: details.title || context,
    message: generatedMessage,
    type,
    link,
  });
}