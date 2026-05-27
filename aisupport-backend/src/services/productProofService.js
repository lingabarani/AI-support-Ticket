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
    damageDetected,
    mismatchDetected,
    fakeProductDetected: /fake|counterfeit|not original/.test(text),
    packagingIssueDetected,
    OCRResult: '',
    confidence: hasImage ? (refundEligible ? 0.48 : 0.35) : 0,
    recommendedAction,
    refundEligible,
    metadata,
    integrationReady: {
      rekognition: true,
      textract: true,
      requiredEnv: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    },
  };
};

module.exports = {
  analyzeProductProof,
};
