import { quickSightApi } from './api';

const sharedDashboardUrls = {
  support_agent: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/0fe6b5b8-d6b7-4c9d-9268-1abf2d040c5d',
  team_manager: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/0fcb1f44-2f3f-48cf-a292-dabb3ba3ef74',
  business_executive: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/fcbb70c7-c980-438b-b4f0-a8f8e2d47615',
};

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
    if (sharedDashboardUrls[role]) {
      return {
        embedUrl: sharedDashboardUrls[role],
        source: 'frontend_shared',
        canEmbed: true,
        message: response?.message || 'Backend did not return a registered-user embed URL. Using shared QuickSight iframe embed URL.',
      };
    }
    throw new Error(response?.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.');
  } catch (error) {
    if (sharedDashboardUrls[role]) {
      return {
        embedUrl: sharedDashboardUrls[role],
        source: 'frontend_shared',
        canEmbed: true,
        message: 'Backend QuickSight embed endpoint is unavailable. Using shared QuickSight iframe embed URL.',
        reason: error.message,
      };
    }
    throw new Error(error.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.', { cause: error });
  }
};

export const getQuickSightEmbedUrl = async (role) => {
  const dashboard = await getQuickSightDashboard(role);
  return dashboard.embedUrl;
};
