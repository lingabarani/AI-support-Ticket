const crypto = require('crypto');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
const AGENT_ID = process.env.BEDROCK_AGENT_ID;
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID;

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

const buildCommandInput = ({ role, message }) => {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 800,
    temperature: 0.2,
    system: ROLE_PROMPTS[role],
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
  const { client, InvokeAgentCommand } = getAgentRuntime();
  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId: sessionId || createSessionId(role),
    inputText: `[${role}] ${message}`,
  });

  const response = await client.send(command);
  const reply = await readAgentCompletion(response.completion);

  if (!reply) {
    throw new Error('Bedrock Agent returned an empty response.');
  }

  return { reply, sessionId: command.input.sessionId, mode: 'agent' };
};

const invokeModel = async ({ role, message }) => {
  const command = new InvokeModelCommand(buildCommandInput({ role, message }));
  const response = await bedrockClient.send(command);
  const payload = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  const reply = payload.content?.[0]?.text;

  if (!reply) {
    throw new Error('Bedrock returned an empty response.');
  }

  return { reply, mode: 'model' };
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

module.exports = { ROLE_PROMPTS, sendChatMessage };
