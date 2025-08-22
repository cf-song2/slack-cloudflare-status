/**
 * Configuration constants for the Cloudflare Status API integration
 */

// API endpoints
export const API_BASE_URL = 'https://www.cloudflarestatus.com/api/v2';
export const ENDPOINTS = {
  components: `${API_BASE_URL}/components.json`,
  incidents: `${API_BASE_URL}/incidents/unresolved.json`,
};

// Cache TTL in seconds
export const CACHE_TTL = 60;

// Filter constants
export const ICN_KEYWORDS = ['icn', 'seoul', 'korea', 'south korea'];

// Slack configuration
export const SLACK_CONFIG = {
  webhookEnvKey: 'SLACK_WEBHOOK_URL',
};
