const dynamoDbTables = {
  users: { partitionKey: 'user_id', sortKey: 'created_at', pii: true },
  tickets: { partitionKey: 'ticket_id', sortKey: 'created_at', streams: true },
  ticket_history: { partitionKey: 'ticket_id', sortKey: 'timestamp', ttl: 'expires_at' },
  ticket_analyses: { partitionKey: 'ticket_id', sortKey: 'created_at' },
  ai_decisions: { partitionKey: 'ticket_id', sortKey: 'created_at', streams: true },
  agent_workflows: { partitionKey: 'ticket_id', sortKey: 'created_at' },
  audit_logs: { partitionKey: 'entityId', sortKey: 'timestamp', kmsEncrypted: true },
  sla_events: { partitionKey: 'ticket_id', sortKey: 'created_at', streams: true },
  supervisor_reviews: { partitionKey: 'ticket_id', sortKey: 'created_at' },
  product_proof_analyses: { partitionKey: 'orderId', sortKey: 'created_at', s3Backed: true },
  notifications: { partitionKey: 'user_id', sortKey: 'created_at', ttl: 'expires_at' },
  datasets: { partitionKey: 'dataset_id', sortKey: 'uploaded_at', s3Backed: true },
  escalations: { partitionKey: 'ticket_id', sortKey: 'created_at', streams: true },
};

const awsEventArchitecture = {
  apiGateway: ['/api/enterprise/*', '/api/tickets/*', '/api/chat'],
  eventBridgeEvents: ['sla.at_risk', 'ticket.escalated', 'automation.rejected', 'workflow.completed'],
  queues: {
    automationQueue: 'SQS queue for approved low-risk automation',
    supervisorQueue: 'SQS queue for reviews and low-confidence cases',
  },
  notifications: {
    snsTopics: ['sla-breach-alerts', 'supervisor-review-alerts', 'dataset-ingestion-status'],
  },
  analytics: {
    glueCatalog: 'support_intelligence_catalog',
    athenaWorkgroup: 'support-intelligence-bi',
    quickSightNamespace: 'default',
  },
  security: ['IAM least privilege', 'Secrets Manager', 'KMS envelope encryption', 'WAF + Shield'],
};

module.exports = {
  awsEventArchitecture,
  dynamoDbTables,
};
