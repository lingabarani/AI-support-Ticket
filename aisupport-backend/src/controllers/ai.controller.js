const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const Ticket = require('../models/Ticket.model');
const AIInsight = require('../models/AIInsight.model');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const invokeModel = async (prompt) => {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  };
  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
    body: JSON.stringify(payload),
    contentType: 'application/json',
    accept: 'application/json',
  });
  const response = await bedrockClient.send(command);
  const result = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  return result.content[0].text;
};

// POST /api/ai/analyze-ticket
exports.analyzeTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId).populate('customer', 'name');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const prompt = `Analyze this customer support ticket and provide:
1. A brief summary (2-3 sentences)
2. Detected sentiment (Positive/Neutral/Negative)
3. Root cause analysis
4. Priority recommendation (High/Medium/Low)

Ticket Subject: ${ticket.subject}
Description: ${ticket.description}
Category: ${ticket.category}

Respond in JSON format: { "summary": "", "sentiment": "", "rootCause": "", "priority": "" }`;

    const aiResponse = await invokeModel(prompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { summary: aiResponse, sentiment: 'Neutral', rootCause: 'Analysis pending.', priority: ticket.priority }; }

    // Save insight
    await AIInsight.create({ ticket: ticket._id, type: 'summarization', input: { subject: ticket.subject }, output: parsed });

    // Update ticket with AI data
    ticket.aiSummary = parsed.summary;
    ticket.aiRootCause = parsed.rootCause;
    ticket.sentiment = parsed.sentiment;
    await ticket.save();

    res.json({ success: true, analysis: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/summarize
exports.summarize = async (req, res) => {
  try {
    const { text } = req.body;
    const summary = await invokeModel(`Summarize this customer support conversation in 2-3 sentences:\n\n${text}`);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/sentiment
exports.analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = `Analyze the sentiment of this customer message. Respond only with JSON: {"sentiment": "Positive|Neutral|Negative", "confidence": 0-100, "keywords": []}\n\nText: ${text}`;
    const result = await invokeModel(prompt);
    let parsed;
    try { parsed = JSON.parse(result); } catch { parsed = { sentiment: 'Neutral', confidence: 70, keywords: [] }; }
    res.json({ success: true, ...parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/recommendation
exports.getRecommendations = async (req, res) => {
  try {
    const { context } = req.body;
    const prompt = `Based on this customer support data, provide 5 actionable business recommendations to reduce ticket volume and churn:\n\n${JSON.stringify(context)}\n\nRespond as a JSON array of strings.`;
    const result = await invokeModel(prompt);
    let recommendations;
    try { recommendations = JSON.parse(result); } catch { recommendations = [result]; }
    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/suggest-response
exports.suggestResponse = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId).populate('customer', 'name');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const prompt = `Write a professional, empathetic customer support response for this ticket:
Subject: ${ticket.subject}
Description: ${ticket.description}
Customer: ${ticket.customer?.name}

Keep it concise (3-4 sentences), apologize for the inconvenience, and provide next steps.`;

    const suggestedResponse = await invokeModel(prompt);
    ticket.aiSuggestedReply = suggestedResponse;
    await ticket.save();
    res.json({ success: true, suggestedResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
