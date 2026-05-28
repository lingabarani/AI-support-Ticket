const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { datasetPaths } = require('./datasetRegistryService');

const bucket = process.env.AWS_S3_BUCKET || 'msp-helpdesk-data-lake';
const region = process.env.AWS_REGION || 'us-east-1';
const client = new S3Client({ region });

const uploadFile = async (localPath, key) => {
  if (!fs.existsSync(localPath)) {
    return { success: false, key, message: 'Source file not found.' };
  }

  const Body = fs.readFileSync(localPath);
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body });
  await client.send(command);
  return { success: true, key, bucket, localPath };
};

const uploadRawDatasetsToS3 = async () => {
  const keys = [
    ['support_tickets_enterprise.csv', datasetPaths.supportTickets],
    ['customer_feedback_sentiment.csv', datasetPaths.customerFeedback],
    ['enterprise_orders_products.csv', datasetPaths.ordersProducts],
    ['sla_operations_analytics.csv', datasetPaths.slaAnalytics],
    ['enterprise_knowledge_base.csv', datasetPaths.knowledgeBase],
    ['product_image_analysis.csv', datasetPaths.productProof],
    ['ai_agent_workflows.csv', datasetPaths.agentWorkflows],
  ];

  const results = [];
  for (const [name, localPath] of keys) {
    results.push(await uploadFile(localPath, `raw/${name}`));
  }
  return results;
};

const uploadKnowledgeBaseToS3 = async () => {
  const keys = [
    ['enterprise_knowledge_base.csv', datasetPaths.knowledgeBase],
    ['DATA_DICTIONARY_AND_GUIDE.md', datasetPaths.knowledgeBaseDocs.dataDictionary],
    ['QUICK_START_GUIDE.md', datasetPaths.knowledgeBaseDocs.quickStartGuide],
    ['README.md', datasetPaths.knowledgeBaseDocs.readme],
  ];

  const results = [];
  for (const [name, localPath] of keys) {
    results.push(await uploadFile(localPath, `knowledge-base/${name}`));
  }
  return results;
};

const uploadAnalyticsDatasetsToS3 = async () => {
  const keys = [
    ['support_tickets_enterprise.csv', datasetPaths.supportTickets],
    ['sla_operations_analytics.csv', datasetPaths.slaAnalytics],
    ['customer_feedback_sentiment.csv', datasetPaths.customerFeedback],
    ['enterprise_orders_products.csv', datasetPaths.ordersProducts],
    ['ai_agent_workflows.csv', datasetPaths.agentWorkflows],
  ];

  const results = [];
  for (const [name, localPath] of keys) {
    results.push(await uploadFile(localPath, `analytics/${name}`));
  }
  return results;
};

const uploadProductProofToS3 = async () => [await uploadFile(datasetPaths.productProof, 'product-proof/product_image_analysis.csv')];

module.exports = {
  uploadRawDatasetsToS3,
  uploadKnowledgeBaseToS3,
  uploadAnalyticsDatasetsToS3,
  uploadProductProofToS3,
};
