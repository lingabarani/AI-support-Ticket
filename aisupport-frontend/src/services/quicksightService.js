import { quickSightApi } from './api';

export const getQuickSightEmbedUrl = async (role) => {
  try {
    const response = await quickSightApi.embedUrl(role);
    if (response?.embedUrl) return response.embedUrl;
    throw new Error(response?.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.');
  } catch {
    throw new Error('QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.');
  }
};
