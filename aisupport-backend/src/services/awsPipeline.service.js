const crypto = require('crypto');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const REGION = process.env.AWS_REGION || 'us-east-1';
const RAW_BUCKET = process.env.RAW_BUCKET || 'support-ticket-ai-linga-dev-raw-68dec6e5';
const ANALYTICS_BUCKET = process.env.ANALYTICS_BUCKET || 'support-ticket-ai-linga-dev-analytics-68dec6e5';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

const s3 = new S3Client({ region: REGION });
const bedrock = new BedrockRuntimeClient({ region: REGION });

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf-8');
};

const dateParts = () => {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: String(now.getUTCMonth() + 1).padStart(2, '0'),
    day: String(now.getUTCDate()).padStart(2, '0'),
  };
};

const normalizeTicket = (body) => {
  const ticketId = body.ticket_id || `WEB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  return {
    ticket_id: ticketId,
    customer_name: body.customer_name || body.name || 'Frontend User',
    customer_email: body.customer_email || body.email || 'frontend.user@example.com',
    product: body.product || 'Web Portal',
    category: body.category || 'General Support',
    issue_description: body.issue_description || body.description || body.subject || '',
    resolution_notes: body.resolution_notes || '',
    priority: body.priority || 'Medium',
    status: body.status || 'Open',
    channel: body.channel || 'Web',
    region: body.region || 'India',
    customer_age: body.customer_age ?? null,
    customer_gender: body.customer_gender || '',
    subscription_type: body.subscription_type || 'Standard',
    customer_tenure_months: body.customer_tenure_months ?? null,
    previous_tickets: body.previous_tickets ?? 0,
    customer_satisfaction_score: body.customer_satisfaction_score ?? null,
    first_response_time_hours: body.first_response_time_hours ?? null,
    resolution_time_hours: body.resolution_time_hours ?? null,
    ticket_created_date: body.ticket_created_date || new Date().toISOString().slice(0, 10),
    ticket_resolved_date: body.ticket_resolved_date || null,
    escalated: body.escalated || 'No',
    sla_breached: body.sla_breached || 'No',
    operating_system: body.operating_system || '',
    browser: body.browser || '',
    payment_method: body.payment_method || '',
    language: body.language || 'English',
    preferred_contact_time: body.preferred_contact_time || '',
    issue_complexity_score: body.issue_complexity_score ?? 5,
    customer_segment: body.customer_segment || 'Web Customer',
  };
};

exports.getConfig = () => ({
  region: REGION,
  rawBucket: RAW_BUCKET,
  analyticsBucket: ANALYTICS_BUCKET,
  bedrockModelId: BEDROCK_MODEL_ID,
});

exports.submitTicket = async (body) => {
  const ticket = normalizeTicket(body);
  const { year, month, day } = dateParts();
  const key = `tickets/incoming/year=${year}/month=${month}/day=${day}/${ticket.ticket_id}.json`;

  await s3.send(new PutObjectCommand({
    Bucket: RAW_BUCKET,
    Key: key,
    Body: JSON.stringify([ticket]),
    ContentType: 'application/json',
  }));

  return { ticket, bucket: RAW_BUCKET, key };
};

exports.listRecentAnalytics = async (limit = 10) => {
  const response = await s3.send(new ListObjectsV2Command({
    Bucket: ANALYTICS_BUCKET,
    Prefix: 'tickets_enriched_json/',
    MaxKeys: Math.max(limit * 3, 20),
  }));

  const objects = (response.Contents || [])
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .slice(0, limit);

  const records = [];
  for (const obj of objects) {
    const item = await s3.send(new GetObjectCommand({ Bucket: ANALYTICS_BUCKET, Key: obj.Key }));
    records.push(JSON.parse(await streamToString(item.Body)));
  }
  return records;
};

exports.testBedrock = async () => {
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 30,
      messages: [{ role: 'user', content: 'Reply with only: OK' }],
    }),
  }));
  const result = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  return result.content?.[0]?.text || '';
};
