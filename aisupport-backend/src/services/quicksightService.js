const {
  QuickSightClient,
  GenerateEmbedUrlForRegisteredUserCommand,
} = require('@aws-sdk/client-quicksight');

const quickSightClient = new QuickSightClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const dashboardEnvByRole = {
  support_agent: 'QS_DASHBOARD_SUPPORT_AGENT',
  team_manager: 'QS_DASHBOARD_TEAM_MANAGER',
  business_executive: 'QS_DASHBOARD_BUSINESS_EXECUTIVE',
  system_admin: 'QS_DASHBOARD_SYSTEM_ADMIN',
  system_admin_reports: 'QS_DASHBOARD_SYSTEM_ADMIN',
  customer: 'QS_DASHBOARD_CUSTOMER_PORTAL',
};

const analysisEnvByRole = {
  support_agent: 'QS_ANALYSIS_SUPPORT_AGENT',
  team_manager: 'QS_ANALYSIS_TEAM_MANAGER',
  business_executive: 'QS_ANALYSIS_BUSINESS_EXECUTIVE',
  system_admin: 'QS_ANALYSIS_SYSTEM_ADMIN',
  system_admin_reports: 'QS_ANALYSIS_SYSTEM_ADMIN',
  customer: 'QS_ANALYSIS_CUSTOMER_PORTAL',
};

const getAllowedDomains = () => {
  const configured = (process.env.QUICKSIGHT_ALLOWED_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean);

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://your-production-domain.example',
    ...configured,
  ];
};

const getDashboardId = (role) => {
  const envName = dashboardEnvByRole[role];
  return process.env[envName];
};

const getAnalysisId = (role) => {
  const envName = analysisEnvByRole[role];
  return process.env[envName];
};

const getQuickSightEmbedUrl = async (role) => {
  const dashboardId = getDashboardId(role);
  const analysisId = getAnalysisId(role);

  if (!process.env.AWS_ACCOUNT_ID || !process.env.QUICKSIGHT_USER_ARN || (!dashboardId && !analysisId)) {
    const error = new Error('QuickSight embedding is not fully configured on the backend.');
    error.statusCode = 500;
    throw error;
  }

  const experienceConfiguration = dashboardId
    ? {
      Dashboard: {
        InitialDashboardId: dashboardId,
      },
    }
    : {
      QuickSightConsole: {
        InitialPath: `/analyses/${analysisId}`,
      },
    };

  const command = new GenerateEmbedUrlForRegisteredUserCommand({
    AwsAccountId: process.env.AWS_ACCOUNT_ID,
    UserArn: process.env.QUICKSIGHT_USER_ARN,
    AllowedDomains: getAllowedDomains(),
    ExperienceConfiguration: experienceConfiguration,
    SessionLifetimeInMinutes: 60,
  });

  try {
    const response = await quickSightClient.send(command);
    return response.EmbedUrl;
  } catch (error) {
    const wrapped = new Error('Unable to generate QuickSight embed URL. Check QuickSight user, dashboard permissions, and IAM access.');
    wrapped.statusCode = 502;
    wrapped.cause = error;
    throw wrapped;
  }
};

module.exports = { getQuickSightEmbedUrl };
