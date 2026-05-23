import { quickSightApi } from './api';

export const getQuickSightDashboard = async (role) => {
  try {
    const response = await quickSightApi.embedUrl(role);
    if (response?.embedUrl) {
      return {
        embedUrl: response.embedUrl,
        source: response.source || 'backend',
        canEmbed: response.canEmbed !== false,
        message: response.message || '',
        reason: response.reason || '',
      };
    }
    throw new Error(response?.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.');
  } catch (error) {
    throw new Error(error.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.', { cause: error });
  }
};

export const getQuickSightEmbedUrl = async (role) => {
  const dashboard = await getQuickSightDashboard(role);
  return dashboard.embedUrl;
};
