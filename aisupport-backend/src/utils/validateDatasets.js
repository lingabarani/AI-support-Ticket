const hasAny = (row, fields = []) => fields.some((field) => row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '');

const DATASET_VALIDATION_RULES = {
  support_tickets_enterprise: [
    ['ticket_id', 'id'],
    ['description', 'ticket_description', 'subject'],
    ['customer_email', 'email'],
    ['status'],
    ['priority'],
  ],
  sla_operations_analytics: [
    ['ticket_id', 'team_name', 'assigned_team'],
    ['sla_status', 'sla_breached', 'sla_compliance'],
    ['resolution_time', 'avg_resolution_time'],
  ],
  customer_feedback_sentiment: [
    ['customer_id', 'customer_email', 'feedback_id'],
    ['feedback_text', 'comment', 'message'],
    ['sentiment', 'rating'],
  ],
  enterprise_orders_products: [
    ['order_id', 'product_id'],
    ['product_name', 'product_category'],
    ['payment_status', 'delivery_status', 'refund_status'],
  ],
  enterprise_knowledge_base: [
    ['question', 'issue', 'title'],
    ['answer', 'resolution', 'solution'],
  ],
  product_image_analysis: [
    ['image_id', 'product_id', 'ticket_id'],
    ['damage_detected', 'mismatch_detected', 'analysis_result'],
  ],
  ai_agent_workflows: [
    ['workflow_id', 'ticket_id'],
    ['agent_name', 'step_name'],
    ['status', 'workflow_status', 'decision'],
  ],
};

const validateRows = (rows = [], datasetKey) => {
  const rules = DATASET_VALIDATION_RULES[datasetKey] || [];
  const first = rows[0] || {};
  const missing = rules
    .filter((group) => !hasAny(first, group))
    .map((group) => group[0]);

  return {
    valid: missing.length === 0 && rows.length > 0,
    missing,
    totalRows: rows.length,
  };
};

const validateDatasetFile = (datasetKey, rows) => {
  const result = validateRows(rows, datasetKey);
  if (result.valid) return result;
  return {
    ...result,
    message: rows.length ? 'Dataset file is missing required columns.' : 'Dataset file is empty or not available.',
  };
};

module.exports = {
  validateDatasetFile,
  validateRows,
};
