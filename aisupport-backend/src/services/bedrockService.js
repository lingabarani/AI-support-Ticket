const crypto = require('crypto');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { getRelevantAgentTrainingContextAsync } = require('./datasetService');

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
const PRIMARY_ANALYZE_MODEL_ID = process.env.BEDROCK_PRIMARY_MODEL_ID
  || process.env.BEDROCK_ANALYZE_MODEL_ID
  || process.env.BEDROCK_CLAUDE_SONNET_MODEL_ID
  || 'anthropic.claude-sonnet-4-5-20250929-v1:0';
const FALLBACK_ANALYZE_MODEL_ID = process.env.BEDROCK_FALLBACK_MODEL_ID
  || process.env.BEDROCK_OPUS_MODEL_ID
  || process.env.BEDROCK_CLAUDE_OPUS_MODEL_ID
  || 'anthropic.claude-opus-4-1-20250805-v1:0';
const AGENT_ID = process.env.BEDROCK_AGENT_ID;
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID;
const BEDROCK_TIMEOUT_MS = Number(process.env.BEDROCK_TIMEOUT_MS || 25000);
const BEDROCK_MAX_RETRIES = Number(process.env.BEDROCK_MAX_RETRIES || 2);
const BEDROCK_ANALYZE_CONFIDENCE_THRESHOLD = Number(process.env.BEDROCK_ANALYZE_CONFIDENCE_THRESHOLD || 0.75);

const ROLE_PROMPTS = {
  customer:
    'You are a friendly customer support assistant. Help customers with ticket status, refunds, login issues, payment problems, and next steps in simple language.',
  support_agent:
    'You are an AI support assistant for customer support agents. Help agents resolve tickets faster. Provide concise summaries, sentiment, priority, root cause, and suggested professional replies. Keep responses practical and action-oriented.',
  team_manager:
    'You are an AI operations manager assistant. Help support managers understand ticket trends, SLA risks, team workload, recurring issues, and escalation patterns. Provide clear operational insights and recommended management actions.',
  business_executive:
    'You are an AI executive business insights assistant. Help executives understand customer sentiment, churn risk, revenue impact, recurring business issues, and strategic improvement opportunities. Provide concise executive-level recommendations.',
  system_admin:
    'You are a system administration assistant. Help monitor system health, API connectivity, user roles, permissions, security, and configuration.',
};

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const logBedrock = (level, message, meta = {}) => {
  const safeMeta = {
    ...meta,
    accessKey: undefined,
    secretKey: undefined,
    token: undefined,
  };
  const line = JSON.stringify({
    level,
    service: 'bedrockService',
    message,
    timestamp: new Date().toISOString(),
    ...safeMeta,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
};

let agentRuntimeClient;
let agentRuntimeCommands;

const getAgentRuntime = () => {
  if (!agentRuntimeCommands) {
    agentRuntimeCommands = require('@aws-sdk/client-bedrock-agent-runtime');
  }

  if (!agentRuntimeClient) {
    agentRuntimeClient = new agentRuntimeCommands.BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  return {
    client: agentRuntimeClient,
    InvokeAgentCommand: agentRuntimeCommands.InvokeAgentCommand,
  };
};

const mapBedrockError = (error) => {
  const name = error?.name || error?.Code || error?.code;
  const rawMessage = error?.message || '';
  if (name === 'CredentialsProviderError' || rawMessage.includes('Could not load credentials')) {
    return 'AWS credentials are not available to the backend. Configure an AWS CLI profile or set AWS credentials in the backend environment.';
  }

  const messages = {
    AccessDeniedException: 'Bedrock access was denied. Check IAM permissions and model access in Amazon Bedrock.',
    ResourceNotFoundException: 'Bedrock agent or model was not found. Check your Bedrock agent ID, alias ID, model ID, and region.',
    ValidationException: 'Bedrock rejected the request. Check the model ID, guardrail settings, and prompt format.',
    ThrottlingException: 'Bedrock is throttling requests. Please wait a moment and try again.',
    ModelNotReadyException: 'The Bedrock model is not ready yet. Please try again shortly.',
  };

  return messages[name] || 'Unable to get a response from Amazon Bedrock right now.';
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableBedrockError = (error) => {
  const name = error?.name || error?.Code || error?.code;
  return [
    'ThrottlingException',
    'TooManyRequestsException',
    'ModelNotReadyException',
    'InternalServerException',
    'ServiceUnavailableException',
    'TimeoutError',
    'AbortError',
    'NetworkingError',
  ].includes(name) || Number(error?.$metadata?.httpStatusCode || 0) >= 500;
};

const sendWithTimeoutAndRetry = async (command, {
  operation,
  modelId,
  timeoutMs = BEDROCK_TIMEOUT_MS,
  maxRetries = BEDROCK_MAX_RETRIES,
} = {}) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      logBedrock('info', 'Bedrock invocation started', { operation, modelId, attempt: attempt + 1, timeoutMs });
      const response = await bedrockClient.send(command, { abortSignal: controller.signal });
      logBedrock('info', 'Bedrock invocation completed', {
        operation,
        modelId,
        attempt: attempt + 1,
        latencyMs: Date.now() - startedAt,
      });
      response.$retryCount = attempt;
      return response;
    } catch (error) {
      lastError = error;
      lastError.$modelId = modelId;
      lastError.$retryCount = attempt;
      const retryable = attempt < maxRetries && isRetryableBedrockError(error);
      logBedrock(retryable ? 'warn' : 'error', 'Bedrock invocation failed', {
        operation,
        modelId,
        attempt: attempt + 1,
        latencyMs: Date.now() - startedAt,
        retryable,
        errorName: error?.name || error?.code,
        statusCode: error?.$metadata?.httpStatusCode,
        errorMessage: error?.message,
      });

      if (!retryable) break;
      await sleep(Math.min(2000 * (attempt + 1), 6000));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
};

const buildCommandInput = ({ role, message, datasetContext = '' }) => {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 800,
    temperature: 0.2,
    system: [
      ROLE_PROMPTS[role],
      'Use the enterprise support dataset grounding when it is relevant. For support, operations, SLA, churn, revenue, dashboard, customer, and ticket questions, ground the response in the provided evidence.',
      'If the evidence is insufficient, say what is missing and give the next best action. Do not invent metrics or ticket details.',
      datasetContext,
    ].filter(Boolean).join('\n\n'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      },
    ],
  };

  const input = {
    modelId: MODEL_ID,
    body: JSON.stringify(body),
    contentType: 'application/json',
    accept: 'application/json',
  };

  if (process.env.BEDROCK_GUARDRAIL_ID && process.env.BEDROCK_GUARDRAIL_VERSION) {
    input.guardrailIdentifier = process.env.BEDROCK_GUARDRAIL_ID;
    input.guardrailVersion = process.env.BEDROCK_GUARDRAIL_VERSION;
  }

  return input;
};

const readAgentCompletion = async (completionStream) => {
  if (!completionStream) {
    throw new Error('Bedrock Agent returned an empty response stream.');
  }

  let reply = '';
  const decoder = new TextDecoder('utf-8');

  for await (const chunkEvent of completionStream) {
    if (chunkEvent.chunk?.bytes) {
      reply += decoder.decode(chunkEvent.chunk.bytes);
    }
  }

  return reply.trim();
};

const createSessionId = (role) => {
  const prefix = process.env.BEDROCK_AGENT_SESSION_PREFIX || 'aisupport';
  return `${prefix}-${role}-${crypto.randomBytes(8).toString('hex')}`;
};

const invokeAgent = async ({ role, message, sessionId }) => {
  const datasetContext = await getRelevantAgentTrainingContextAsync({ role, message });
  const { client, InvokeAgentCommand } = getAgentRuntime();
  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId: sessionId || createSessionId(role),
    inputText: [
      `[${role}]`,
      datasetContext,
      `User request: ${message}`,
    ].filter(Boolean).join('\n\n'),
  });

  const response = await client.send(command);
  const reply = await readAgentCompletion(response.completion);

  if (!reply) {
    throw new Error('Bedrock Agent returned an empty response.');
  }

  return { reply, sessionId: command.input.sessionId, mode: 'agent' };
};

const invokeModel = async ({ role, message }) => {
  const datasetContext = await getRelevantAgentTrainingContextAsync({ role, message });
  const command = new InvokeModelCommand(buildCommandInput({ role, message, datasetContext }));
  const response = await sendWithTimeoutAndRetry(command, {
    operation: 'chat',
    modelId: MODEL_ID,
  });
  const payload = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  const reply = payload.content?.[0]?.text;

  if (!reply) {
    throw new Error('Bedrock returned an empty response.');
  }

  return { reply, mode: 'model' };
};

const requiredAnalysisKeys = [
  'category',
  'subcategory',
  'priority',
  'sentiment',
  'slaRisk',
  'recommendedAction',
  'escalationNeeded',
  'escalationTeam',
  'resolutionSummary',
  'confidenceScore',
];

const fallbackTicketAnalysis = (ticketText = '', reason = 'fallback') => {
  const text = String(ticketText || '').toLowerCase();
  const security = /security|breach|fraud|stolen|unauthorized|account takeover|compromised/.test(text);
  const payment = /payment|billing|invoice|refund|charge|card/.test(text);
  const login = /login|password|mfa|otp|auth|sso/.test(text);
  const negative = /angry|frustrated|urgent|failed|broken|not working|complaint/.test(text);
  const category = security ? 'Security' : payment ? 'Billing' : login ? 'Authentication' : 'General Support';
  const priority = security ? 'Critical' : negative || payment ? 'High' : login ? 'Medium' : 'Low';

  return {
    category,
    subcategory: security ? 'Account Security' : payment ? 'Payment or Refund' : login ? 'Login Access' : 'Customer Request',
    priority,
    sentiment: negative ? 'Negative' : 'Neutral',
    slaRisk: ['Critical', 'High'].includes(priority) ? 'High' : 'Low',
    recommendedAction: security
      ? 'Escalate to the security team and pause automation until reviewed.'
      : payment
        ? 'Route to billing support and send a status acknowledgement.'
        : login
          ? 'Send password or authentication recovery guidance and monitor for repeat failures.'
          : 'Send a standard support acknowledgement and request missing context if needed.',
    escalationNeeded: security || priority === 'High',
    escalationTeam: security ? 'Security Team' : payment ? 'Billing Team' : priority === 'High' ? 'Support Manager' : 'None',
    resolutionSummary: 'Automated fallback analysis generated because Bedrock analysis was unavailable.',
    confidenceScore: reason === 'parse_error' ? 0.45 : 0.38,
  };
};

const extractJsonObject = (value = '') => {
  const text = String(value || '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in Bedrock response.');
    return JSON.parse(match[0]);
  }
};

const normalizeTicketAnalysis = (analysis = {}, ticketText = '') => {
  const fallback = fallbackTicketAnalysis(ticketText, 'parse_error');
  const normalized = {
    category: String(analysis.category || fallback.category),
    subcategory: String(analysis.subcategory || fallback.subcategory),
    priority: String(analysis.priority || fallback.priority),
    sentiment: String(analysis.sentiment || fallback.sentiment),
    slaRisk: String(analysis.slaRisk || fallback.slaRisk),
    recommendedAction: String(analysis.recommendedAction || fallback.recommendedAction),
    escalationNeeded: Boolean(analysis.escalationNeeded ?? fallback.escalationNeeded),
    escalationTeam: String(analysis.escalationTeam || fallback.escalationTeam),
    resolutionSummary: String(analysis.resolutionSummary || fallback.resolutionSummary),
    confidenceScore: Number(analysis.confidenceScore ?? fallback.confidenceScore),
  };

  normalized.confidenceScore = Number.isFinite(normalized.confidenceScore)
    ? Math.max(0, Math.min(1, normalized.confidenceScore > 1 ? normalized.confidenceScore / 100 : normalized.confidenceScore))
    : fallback.confidenceScore;

  for (const key of requiredAnalysisKeys) {
    if (normalized[key] === undefined || normalized[key] === null || normalized[key] === '') {
      normalized[key] = fallback[key];
    }
  }

  return normalized;
};

const buildAnalyzeTicketCommand = ({ ticketText, metadata = {}, modelId }) => {
  const prompt = [
    'Analyze this customer support ticket for an enterprise SaaS support platform.',
    'Return only strict JSON. Do not include markdown, comments, explanations, or code fences.',
    'JSON schema:',
    JSON.stringify({
      category: 'string',
      subcategory: 'string',
      priority: 'Critical|High|Medium|Low',
      sentiment: 'Positive|Neutral|Negative',
      slaRisk: 'High|Medium|Low',
      recommendedAction: 'string',
      escalationNeeded: true,
      escalationTeam: 'string',
      resolutionSummary: 'string',
      confidenceScore: 0.0,
    }),
    '',
    `Metadata: ${JSON.stringify(metadata || {})}`,
    '',
    `Ticket text:\n${ticketText}`,
  ].join('\n');

  return new InvokeModelCommand({
    modelId,
    body: JSON.stringify({
      anthropic_version: process.env.BEDROCK_ANTHROPIC_VERSION || 'bedrock-2023-05-31',
      max_tokens: Number(process.env.BEDROCK_ANALYZE_MAX_TOKENS || 1000),
      temperature: Number(process.env.BEDROCK_ANALYZE_TEMPERATURE || 0),
      system: 'You are a precise enterprise support ticket triage engine. You produce valid compact JSON only.',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    }),
    contentType: 'application/json',
    accept: 'application/json',
  });
};

const isGovernanceOrRootCauseWorkflow = (metadata = {}) => {
  const workflow = String(metadata.workflow || metadata.workflowType || metadata.intent || '').toLowerCase();
  return Boolean(metadata.governance || metadata.rootCause || metadata.root_cause)
    || /governance|audit|policy|root[-_\s]?cause/.test(workflow);
};

const invokeAnalysisModel = async ({ modelId, ticketText, metadata = {}, maxRetries, operation }) => {
  const command = buildAnalyzeTicketCommand({ ticketText, metadata, modelId });
  const response = await sendWithTimeoutAndRetry(command, {
    operation,
    modelId,
    maxRetries,
  });
  const payload = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  const rawText = payload.content?.find((item) => item.type === 'text')?.text || payload.content?.[0]?.text || '';
  const parsed = extractJsonObject(rawText);
  return {
    analysis: normalizeTicketAnalysis(parsed, ticketText),
    modelId,
    retryCount: Number(response.$retryCount || 0),
  };
};

const analyzeTicketWithBedrock = async ({ ticketText, metadata = {} } = {}) => {
  const startedAt = Date.now();
  const cleanText = String(ticketText || '').trim();
  if (!cleanText) {
    const error = new Error('ticketText is required.');
    error.statusCode = 400;
    throw error;
  }

  const modelErrors = [];
  let retryCount = 0;
  const useOpusDirectly = isGovernanceOrRootCauseWorkflow(metadata);

  try {
    if (useOpusDirectly) {
      try {
        const opus = await invokeAnalysisModel({
          modelId: FALLBACK_ANALYZE_MODEL_ID,
          ticketText: cleanText,
          metadata: { ...metadata, routingReason: 'governance_or_root_cause' },
          maxRetries: BEDROCK_MAX_RETRIES,
          operation: 'analyze-ticket-opus-direct',
        });
        retryCount += opus.retryCount;
        return {
          analysis: opus.analysis,
          source: 'bedrock',
          modelId: opus.modelId,
          modelUsed: opus.modelId,
          fallbackTriggered: false,
          retryCount,
          responseLatencyMs: Date.now() - startedAt,
          fallback: false,
          routingReason: 'governance_or_root_cause',
        };
      } catch (error) {
        retryCount += Number(error?.$retryCount || 0);
        modelErrors.push({ modelId: error?.$modelId || FALLBACK_ANALYZE_MODEL_ID, message: error?.message, name: error?.name || error?.code });
        logBedrock('warn', 'Opus direct workflow failed; trying Sonnet before rule fallback', {
          operation: 'analyze-ticket',
          modelId: FALLBACK_ANALYZE_MODEL_ID,
          fallbackModelId: PRIMARY_ANALYZE_MODEL_ID,
          errorName: error?.name || error?.code,
        });
        const sonnetAfterOpusFailure = await invokeAnalysisModel({
          modelId: PRIMARY_ANALYZE_MODEL_ID,
          ticketText: cleanText,
          metadata: { ...metadata, routingReason: 'opus_direct_failed', primaryError: error?.name || error?.code },
          maxRetries: 1,
          operation: 'analyze-ticket-sonnet-after-opus',
        });
        retryCount += sonnetAfterOpusFailure.retryCount;
        return {
          analysis: sonnetAfterOpusFailure.analysis,
          source: 'bedrock',
          modelId: sonnetAfterOpusFailure.modelId,
          modelUsed: sonnetAfterOpusFailure.modelId,
          fallbackTriggered: true,
          retryCount,
          responseLatencyMs: Date.now() - startedAt,
          fallback: false,
          routingReason: 'opus_direct_failed',
          modelErrors,
        };
      }
    }

    let sonnet;
    try {
      sonnet = await invokeAnalysisModel({
        modelId: PRIMARY_ANALYZE_MODEL_ID,
        ticketText: cleanText,
        metadata,
        maxRetries: 1,
        operation: 'analyze-ticket-sonnet',
      });
      retryCount += sonnet.retryCount;
    } catch (error) {
      retryCount += Number(error?.$retryCount || 0);
      modelErrors.push({ modelId: error?.$modelId || PRIMARY_ANALYZE_MODEL_ID, message: error?.message, name: error?.name || error?.code });
      logBedrock('warn', 'Primary Sonnet analysis failed; routing to Opus fallback', {
        operation: 'analyze-ticket',
        modelId: PRIMARY_ANALYZE_MODEL_ID,
        fallbackModelId: FALLBACK_ANALYZE_MODEL_ID,
        errorName: error?.name || error?.code,
      });
      const opusAfterFailure = await invokeAnalysisModel({
        modelId: FALLBACK_ANALYZE_MODEL_ID,
        ticketText: cleanText,
        metadata: { ...metadata, routingReason: 'sonnet_failed', primaryError: error?.name || error?.code },
        maxRetries: BEDROCK_MAX_RETRIES,
        operation: 'analyze-ticket-opus-fallback',
      });
      retryCount += opusAfterFailure.retryCount;
      return {
        analysis: opusAfterFailure.analysis,
        source: 'bedrock',
        modelId: opusAfterFailure.modelId,
        modelUsed: opusAfterFailure.modelId,
        fallbackTriggered: true,
        retryCount,
        responseLatencyMs: Date.now() - startedAt,
        fallback: false,
        routingReason: 'sonnet_failed',
        modelErrors,
      };
    }

    if (sonnet.analysis.confidenceScore < BEDROCK_ANALYZE_CONFIDENCE_THRESHOLD) {
      try {
        const opusValidation = await invokeAnalysisModel({
          modelId: FALLBACK_ANALYZE_MODEL_ID,
          ticketText: cleanText,
          metadata: {
            ...metadata,
            routingReason: 'low_confidence_validation',
            sonnetAnalysis: sonnet.analysis,
            sonnetConfidenceScore: sonnet.analysis.confidenceScore,
          },
          maxRetries: BEDROCK_MAX_RETRIES,
          operation: 'analyze-ticket-opus-validation',
        });
        retryCount += opusValidation.retryCount;
        return {
          analysis: opusValidation.analysis,
          source: 'bedrock',
          modelId: opusValidation.modelId,
          modelUsed: opusValidation.modelId,
          fallbackTriggered: true,
          retryCount,
          responseLatencyMs: Date.now() - startedAt,
          fallback: false,
          routingReason: 'low_confidence_validation',
          primaryAnalysis: sonnet.analysis,
        };
      } catch (error) {
        modelErrors.push({ modelId: error?.$modelId || FALLBACK_ANALYZE_MODEL_ID, message: error?.message, name: error?.name || error?.code });
        logBedrock('warn', 'Opus validation failed; returning low-confidence Sonnet analysis', {
          operation: 'analyze-ticket',
          modelId: FALLBACK_ANALYZE_MODEL_ID,
          errorName: error?.name || error?.code,
        });
        return {
          analysis: sonnet.analysis,
          source: 'bedrock',
          modelId: sonnet.modelId,
          modelUsed: sonnet.modelId,
          fallbackTriggered: true,
          retryCount,
          responseLatencyMs: Date.now() - startedAt,
          fallback: false,
          routingReason: 'low_confidence_validation_failed',
          modelErrors,
        };
      }
    }

    return {
      analysis: sonnet.analysis,
      source: 'bedrock',
      modelId: sonnet.modelId,
      modelUsed: sonnet.modelId,
      fallbackTriggered: false,
      retryCount,
      responseLatencyMs: Date.now() - startedAt,
      fallback: false,
      routingReason: 'primary_sonnet',
    };
  } catch (error) {
    const friendlyMessage = mapBedrockError(error);
    modelErrors.push({ modelId: error?.$modelId || (useOpusDirectly ? PRIMARY_ANALYZE_MODEL_ID : FALLBACK_ANALYZE_MODEL_ID), message: error?.message, name: error?.name || error?.code });
    logBedrock('error', 'Using fallback ticket analysis', {
      operation: 'analyze-ticket',
      modelId: useOpusDirectly ? FALLBACK_ANALYZE_MODEL_ID : PRIMARY_ANALYZE_MODEL_ID,
      fallbackModelId: FALLBACK_ANALYZE_MODEL_ID,
      errorName: error?.name || error?.code,
      errorMessage: error?.message,
    });
    return {
      analysis: fallbackTicketAnalysis(cleanText, error?.name === 'SyntaxError' ? 'parse_error' : 'bedrock_error'),
      source: 'fallback',
      modelId: 'rule-based-fallback',
      modelUsed: 'rule-based-fallback',
      fallbackTriggered: true,
      retryCount,
      responseLatencyMs: Date.now() - startedAt,
      fallback: true,
      providerStatus: 'unavailable',
      message: friendlyMessage,
      routingReason: 'all_models_failed',
      modelErrors,
    };
  }
};

const sendChatMessage = async ({ role, message, sessionId }) => {
  try {
    if (AGENT_ID && AGENT_ALIAS_ID) {
      return invokeAgent({ role, message, sessionId });
    }

    return invokeModel({ role, message });
  } catch (error) {
    const friendlyMessage = mapBedrockError(error);
    const wrapped = new Error(friendlyMessage);
    wrapped.statusCode = ['AccessDeniedException', 'ValidationException', 'ResourceNotFoundException'].includes(error?.name) ? 403 : 502;
    wrapped.cause = error;
    throw wrapped;
  }
};

module.exports = {
  ANALYZE_MODEL_ID: PRIMARY_ANALYZE_MODEL_ID,
  FALLBACK_ANALYZE_MODEL_ID,
  PRIMARY_ANALYZE_MODEL_ID,
  ROLE_PROMPTS,
  analyzeTicketWithBedrock,
  fallbackTicketAnalysis,
  sendChatMessage,
};
