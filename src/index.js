/**
 * Cloudflare Status API Integration with Cron Jobs
 * 
 * This worker fetches data from the Cloudflare Status API:
 * - ICN (Seoul) components status every hour
 * - Unresolved incidents every hour
 * - Sends notifications to Slack
 */

// Import modules
import { fetchICNComponentsStatus, fetchUnresolvedIncidents } from './api/cloudflareStatus';
import { sendSlackNotification } from './notifications/slack';

/**
 * Main worker handler
 */
export default {
  // Handle HTTP requests
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    
    // Set up CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    
    try {
      // Manual trigger endpoints
      if (path.endsWith('/check/components')) {
        const data = await checkICNComponents(env);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (path.endsWith('/check/incidents')) {
        const data = await checkUnresolvedIncidents(env);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (path.endsWith('/check/all')) {
        // Special endpoint to check both components and incidents
        // Useful for testing after deployment
        const componentsData = await checkICNComponents(env);
        const incidentsData = await checkUnresolvedIncidents(env);
        
        return new Response(JSON.stringify({
          status: 'success',
          message: 'All checks completed and notifications sent',
          components: componentsData,
          incidents: incidentsData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Default response - status page
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'Cloudflare Status Monitor is running',
          endpoints: {
            checkComponents: '/check/components',
            checkIncidents: '/check/incidents',
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      // Handle errors
      console.error('Error processing request:', error);
      
      return new Response(JSON.stringify({
        error: 'Failed to process request',
        message: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
  
  // Handle scheduled events
  async scheduled(event, env, ctx) {
    // Since both cron jobs run hourly, we need to handle both checks
    // Check ICN components status
    await checkICNComponents(env);
    
    // Check unresolved incidents
    await checkUnresolvedIncidents(env);
  },
};

/**
 * Check ICN components status and send notification
 * @param {Object} env - Worker environment
 * @returns {Promise<Object>} - Components status data
 */
async function checkICNComponents(env) {
  try {
    // Fetch ICN components status
    const componentsData = await fetchICNComponentsStatus();
    
    // Check if there are any non-operational components
    const hasIssues = componentsData.components && componentsData.components.some(
      component => component.status !== 'operational'
    );
    
    // Always send notification to Slack, regardless of component status
    await sendSlackNotification(env, componentsData, 'components');
    
    return {
      status: 'success',
      message: 'ICN components status checked',
      hasIssues,
      data: componentsData,
    };
  } catch (error) {
    console.error('Error checking ICN components status:', error);
    throw error;
  }
}

/**
 * Check unresolved incidents and send notification if needed
 * @param {Object} env - Worker environment
 * @returns {Promise<Object>} - Incidents data
 */
async function checkUnresolvedIncidents(env) {
  try {
    // Fetch unresolved incidents
    const incidentsData = await fetchUnresolvedIncidents();
    
    // Send notification to Slack if there are incidents
    if (incidentsData.incidents && incidentsData.incidents.length > 0) {
      await sendSlackNotification(env, incidentsData, 'incidents');
    }
    
    return {
      status: 'success',
      message: 'Unresolved incidents checked',
      incidentsCount: incidentsData.incidents ? incidentsData.incidents.length : 0,
      data: incidentsData,
    };
  } catch (error) {
    console.error('Error checking unresolved incidents:', error);
    throw error;
  }
}
