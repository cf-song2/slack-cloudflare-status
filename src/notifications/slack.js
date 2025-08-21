/**
 * Slack notification functionality
 */
import { SLACK_CONFIG } from '../config/constants';

/**
 * Send a notification to Slack
 * @param {Object} env - Worker environment with secrets
 * @param {Object} data - Data to send to Slack
 * @param {string} type - Type of notification (components or incidents)
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
export async function sendSlackNotification(env, data, type) {
  try {
    const webhookUrl = env[SLACK_CONFIG.webhookEnvKey];
    
    if (!webhookUrl) {
      console.error('Slack webhook URL not configured');
      return false;
    }
    
    const payload = formatSlackPayload(data, type);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send Slack notification: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

/**
 * Format data for Slack notification
 * @param {Object} data - Data to format
 * @param {string} type - Type of notification (components or incidents)
 * @returns {Object} - Formatted Slack payload
 */
function formatSlackPayload(data, type) {
  if (type === 'components') {
    return formatComponentsPayload(data);
  } else if (type === 'incidents') {
    return formatIncidentsPayload(data);
  }
  
  throw new Error(`Unknown notification type: ${type}`);
}

/**
 * Format ICN components data for Slack
 * @param {Object} data - Components data
 * @returns {Object} - Formatted Slack payload
 */
function formatComponentsPayload(data) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🌐 Cloudflare ICN (Seoul) Status Update',
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
  ];
  
  // Add overall status
  if (data.status) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Overall Status:* ${data.status.description || 'Unknown'}`,
      },
    });
  }
  
  // Add components
  if (data.components && data.components.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*ICN Components:*',
      },
    });
    
    data.components.forEach(component => {
      let statusEmoji = '✅';
      if (component.status !== 'operational') {
        statusEmoji = component.status === 'degraded_performance' ? '⚠️' : '❌';
      }
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${statusEmoji} *${component.name}*: ${component.status.replace('_', ' ')}`,
        },
      });
    });
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No ICN components found_',
      },
    });
  }
  
  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Last updated: ${new Date().toISOString()}`,
      },
    ],
  });
  
  return {
    blocks,
    text: 'Cloudflare ICN (Seoul) Status Update',
  };
}

/**
 * Format incidents data for Slack
 * @param {Object} data - Incidents data
 * @returns {Object} - Formatted Slack payload
 */
function formatIncidentsPayload(data) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 Cloudflare Incident Alert',
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
  ];
  
  // Add incidents
  if (data.incidents && data.incidents.length > 0) {
    data.incidents.forEach(incident => {
      // Add incident name, status, and impact
      const impactText = incident.impact ? `Impact: ${incident.impact}` : '';
      const monitoringText = incident.monitoring ? '🔍 Being monitored' : '';
      const statusEmoji = getStatusEmoji(incident.status);
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${statusEmoji} *${incident.name}*\n*Status:* ${incident.status || 'Unknown'}${impactText ? `\n*${impactText}*` : ''}${monitoringText ? `\n${monitoringText}` : ''}`,
        },
      });
      
      // Add incident details if available
      if (incident.incident_updates && incident.incident_updates.length > 0) {
        // Show incident timeline header
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Incident Timeline:*`,
          },
        });
        
        // Show up to 3 most recent updates (most recent first)
        const updates = incident.incident_updates.slice(0, 3);
        updates.forEach((update, index) => {
          // Format the timestamp
          const updateTime = new Date(update.created_at).toLocaleString();
          const updateStatus = update.status ? `[${update.status}]` : '';
          
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${index === 0 ? '*Latest Update:*' : `*Update ${updates.length - index}:*`} ${updateStatus}\n${update.body}`,
            },
          });
          
          // Add update time
          blocks.push({
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Updated: ${updateTime}`,
              },
            ],
          });
        });
        
        // If there are more updates than we're showing, add a note
        if (incident.incident_updates.length > 3) {
          blocks.push({
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `_${incident.incident_updates.length - 3} more updates not shown_`,
              },
            ],
          });
        }
      }
      
      // Add affected components if available
      if (incident.components && incident.components.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Affected Components:* ${incident.components.map(c => c.name).join(', ')}`,
          },
        });
      }
      
      // Add divider between incidents
      blocks.push({
        type: 'divider',
      });
    });
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No active incidents reported_',
      },
    });
  }
  
  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Last checked: ${new Date().toISOString()}`,
      },
    ],
  });
  
  return {
    blocks,
    text: 'Cloudflare Incident Alert',
  };
}

/**
 * Get emoji for incident status
 * @param {string} status - Incident status
 * @returns {string} - Emoji representing the status
 */
function getStatusEmoji(status) {
  if (!status) return '⚠️';
  
  status = status.toLowerCase();
  
  switch(status) {
    case 'investigating':
      return '🔍';
    case 'identified':
      return '🔎';
    case 'monitoring':
      return '👀';
    case 'resolved':
      return '✅';
    case 'postmortem':
      return '📝';
    default:
      return '⚠️';
  }
}
