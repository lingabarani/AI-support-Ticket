const analyzeProductProof = async ({
  uploadedImage = '',
  productId = '',
  orderId = '',
  metadata = {},
} = {}) => {
  const hasImage = Boolean(uploadedImage);
  const text = [
    metadata.description,
    metadata.issue,
    metadata.notes,
    metadata.filename,
  ].filter(Boolean).join(' ').toLowerCase();
  const damageDetected = /damage|damaged|broken|crack|cracked|dent|leak|torn/.test(text);
  const mismatchDetected = /wrong|mismatch|different color|color mismatch|fake|counterfeit|not original/.test(text);
  const packagingIssueDetected = /package|packaging|box|seal|opened/.test(text);
  const refundEligible = damageDetected || mismatchDetected;
  const recommendedAction = hasImage
    ? refundEligible
      ? 'Queue proof for supervisor validation and provisional refund review.'
      : 'Store proof and queue for Rekognition/Textract analysis when enabled.'
    : 'Request a product proof image before analysis.';

  return {
    orderId,
    productId,
    uploadedImage,
    fileMetadata: {
      originalName: metadata.filename || metadata.originalName || '',
      mimeType: metadata.mimeType || '',
      size: metadata.size || 0,
      storagePath: uploadedImage,
      uploadedAt: new Date().toISOString(),
    },
    damageDetected,
    mismatchDetected,
    fakeProductDetected: /fake|counterfeit|not original/.test(text),
    packagingIssueDetected,
    OCRResult: '',
    confidence: hasImage ? (refundEligible ? 0.48 : 0.35) : 0,
    recommendedAction,
    refundEligible,
    metadata,
    supportedProofTypes: [
      'product_image',
      'damaged_product',
      'wrong_item',
      'color_mismatch',
      'invoice_screenshot',
      'error_screenshot',
    ],
    analysisPlaceholder: {
      provider: 'bedrock_image_ready',
      status: 'metadata_stored',
      promptTemplate: [
        'Analyze the uploaded support proof for damage, wrong item, color mismatch, invoice details, or error screenshot.',
        'Return JSON with evidence, confidence, recommended action, and refund review status.',
      ].join(' '),
      note: 'Bedrock image prompt support prepared for later multimodal enablement.',
    },
    integrationReady: {
      rekognition: true,
      textract: true,
      bedrockImagePrompt: true,
      requiredEnv: ['AWS_REGION', 'BEDROCK_MODEL_ID'],
    },
  };
};

module.exports = {
  analyzeProductProof,
};
