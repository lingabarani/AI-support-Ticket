const fs = require('fs');
const path = require('path');
const { datasetPaths } = require('./datasetRegistryService');

const ensureFileExists = (filepath) => fs.existsSync(filepath);

const validateKBFilesExist = () => ({
  enterpriseKnowledgeBase: ensureFileExists(datasetPaths.knowledgeBase),
  dataDictionary: ensureFileExists(datasetPaths.knowledgeBaseDocs.dataDictionary),
  quickStartGuide: ensureFileExists(datasetPaths.knowledgeBaseDocs.quickStartGuide),
  readme: ensureFileExists(datasetPaths.knowledgeBaseDocs.readme),
});

const getSyncInstructions = () => {
  const instructions = [
    '1. Confirm the knowledge base CSV file is in aisupport-backend/data/raw/enterprise_knowledge_base.csv.',
    '2. Confirm supplement files: DATA_DICTIONARY_AND_GUIDE.md, QUICK_START_GUIDE.md, README.md in aisupport-backend/data/knowledge-base.',
    '3. Use /api/datasets/upload-s3 to stage knowledge-base artifacts into the S3 data lake in the knowledge-base folder.',
    '4. Do not delete existing Bedrock artifacts. Add new knowledge base entries and synchronize them incrementally.',
  ];

  return instructions.join(' ');
};

const prepareKnowledgeBaseSync = () => ({
  success: true,
  files: {
    enterpriseKnowledgeBase: datasetPaths.knowledgeBase,
    dataDictionary: datasetPaths.knowledgeBaseDocs.dataDictionary,
    quickStartGuide: datasetPaths.knowledgeBaseDocs.quickStartGuide,
    readme: datasetPaths.knowledgeBaseDocs.readme,
  },
  status: validateKBFilesExist(),
  instructions: getSyncInstructions(),
});

module.exports = {
  validateKBFilesExist,
  getSyncInstructions,
  prepareKnowledgeBaseSync,
};
