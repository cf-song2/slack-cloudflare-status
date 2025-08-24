/**
 * Cloudflare Status API client
 */
import { API_BASE_URL, ENDPOINTS, CACHE_TTL, ICN_KEYWORDS } from '../config/constants';

/**
 * Fetch ICN components status from Cloudflare Status API
 * @returns {Promise<Object>} - Filtered components data for ICN
 */
export async function fetchICNComponentsStatus() {
  try {
    // Fetch components data
    const componentsResponse = await fetch(ENDPOINTS.components, {
      cf: {
        cacheTtl: CACHE_TTL,
        cacheEverything: true,
      },
    });
    
    if (!componentsResponse.ok) {
      throw new Error(`Failed to fetch components data: ${componentsResponse.status} ${componentsResponse.statusText}`);
    }
    
    // Fetch status data to get overall status
    const statusResponse = await fetch(`${API_BASE_URL}/status.json`, {
      cf: {
        cacheTtl: CACHE_TTL,
        cacheEverything: true,
      },
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to fetch status data: ${statusResponse.status} ${statusResponse.statusText}`);
    }
    
    // Parse both responses
    const componentsData = await componentsResponse.json();
    const statusData = await statusResponse.json();
    
    // Combine the data
    const combinedData = {
      ...statusData,
      components: componentsData.components || [],
    };
    
    return filterForICN(combinedData);
  } catch (error) {
    console.error('Error fetching ICN components status:', error);
    throw error;
  }
}

/**
 * Fetch unresolved incidents from Cloudflare Status API
 * @returns {Promise<Object>} - Unresolved incidents data
 */
export async function fetchUnresolvedIncidents() {
  try {
    const response = await fetch(ENDPOINTS.incidents, {
      cf: {
        cacheTtl: CACHE_TTL,
        cacheEverything: true,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch incidents data: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching unresolved incidents:', error);
    throw error;
  }
}

/**
 * Filter data to focus on ICN (Seoul) information
 * @param {Object} data - The data to filter
 * @returns {Object} - Filtered data with only ICN components
 */
function filterForICN(data) {
  // Create a deep copy to avoid modifying the original data
  const filteredData = JSON.parse(JSON.stringify(data));
  
  if (filteredData.components) {
    // Filter components to only include ICN/Seoul related ones
    filteredData.components = filteredData.components.filter(component => {
      const name = component.name.toLowerCase();
      const description = (component.description || '').toLowerCase();
      return ICN_KEYWORDS.some(keyword => name.includes(keyword) || description.includes(keyword));
    });
  }
  
  return filteredData;
}
