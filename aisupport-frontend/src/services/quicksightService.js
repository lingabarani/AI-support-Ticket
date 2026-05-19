import { quickSightApi } from './api';

const sharedDashboardUrls = {
  support_agent: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/5728c877-dc8d-4367-ae41-bcee1d41611a',
  team_manager: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/e070b737-5990-43f1-bfb4-1bd9182c2119',
  business_executive: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/f79b49a9-619f-407e-81ec-52a0e0ee1c52',
  system_admin: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/7f60c68c-5d88-4802-b188-816bce1060a7',
  customer: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/a417a51c-c15f-4aa6-8efb-650fdd06bccb',
};

export const getQuickSightEmbedUrl = async (role) => {
  try {
    const response = await quickSightApi.embedUrl(role);
    if (response?.embedUrl) return response.embedUrl;
    return sharedDashboardUrls[role] || Promise.reject(new Error(response?.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.'));
  } catch (error) {
    if (sharedDashboardUrls[role]) return sharedDashboardUrls[role];
    throw new Error(error.message || 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.');
  }
};
