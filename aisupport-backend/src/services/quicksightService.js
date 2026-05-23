const {
  QuickSightClient,
  GenerateEmbedUrlForRegisteredUserCommand,
} = require('@aws-sdk/client-quicksight');
const { fromIni } = require('@aws-sdk/credential-provider-ini');

const readEnv = (...names) => names.map((name) => process.env[name]).find(Boolean);

const createQuickSightClient = () => {
  const config = {
    region: process.env.AWS_REGION || 'us-east-1',
  };

  const accessKeyId = readEnv('aws_access_key_id', 'AWS_ACCESS_KEY_ID');
  const secretAccessKey = readEnv('aws_secret_access_key', 'AWS_SECRET_ACCESS_KEY');
  const sessionToken = readEnv('aws_session_token', 'AWS_SESSION_TOKEN');

  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  } else if (process.env.AWS_PROFILE) {
    config.credentials = fromIni({
      profile: process.env.AWS_PROFILE,
      filepath: process.env.AWS_SHARED_CREDENTIALS_FILE || undefined,
    });
  }

  return new QuickSightClient(config);
};

const quickSightClient = createQuickSightClient();

const dashboardEnvByRole = {
  support_agent: 'QS_DASHBOARD_SUPPORT_AGENT',
  team_manager: 'QS_DASHBOARD_TEAM_MANAGER',
  business_executive: 'QS_DASHBOARD_BUSINESS_EXECUTIVE',
};

const analysisEnvByRole = {
  support_agent: 'QS_ANALYSIS_SUPPORT_AGENT',
  team_manager: 'QS_ANALYSIS_TEAM_MANAGER',
  business_executive: 'QS_ANALYSIS_BUSINESS_EXECUTIVE',
};

const sharedDashboardUrls = {
  support_agent: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/0fe6b5b8-d6b7-4c9d-9268-1abf2d040c5d',
  team_manager: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/0fcb1f44-2f3f-48cf-a292-dabb3ba3ef74',
  business_executive: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/AkashQS/embed/share/accounts/711560820682/dashboards/fcbb70c7-c980-438b-b4f0-a8f8e2d47615',
};

const getAllowedDomains = () => {
  const configured = (process.env.QUICKSIGHT_ALLOWED_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean);

  return [...new Set([
    process.env.FRONTEND_URL,
    ...configured,
    'http://localhost:5174',
    'http://localhost:5173',
  ]
    .filter(Boolean)
    .map((domain) => domain.replace('http://127.0.0.1:', 'http://localhost:'))
  )].slice(0, 3);
};

const getDashboardId = (role) => {
  const envName = dashboardEnvByRole[role];
  return process.env[envName];
};

const getAnalysisId = (role) => {
  const envName = analysisEnvByRole[role];
  return process.env[envName];
};

const getSharedQuickSightUrl = (role) => sharedDashboardUrls[role] || '';

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
    SessionLifetimeInMinutes: 600,
  });

  try {
    const response = await quickSightClient.send(command);
    return response.EmbedUrl;
  } catch (error) {
    const wrapped = new Error('Unable to generate QuickSight embed URL. Check QuickSight user, dashboard permissions, and IAM access.');
    wrapped.statusCode = 502;
    wrapped.cause = error;
    wrapped.awsErrorName = error.name;
    wrapped.awsErrorMessage = error.message;
    throw wrapped;
  }
};

module.exports = { getQuickSightEmbedUrl, getSharedQuickSightUrl };
