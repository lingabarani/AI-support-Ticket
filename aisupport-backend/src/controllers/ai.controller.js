const Ticket = require('../models/Ticket.model');
const AIInsight = require('../models/AIInsight.model');
const { analyzeTicketWithBedrock, sendChatMessage } = require('../services/bedrockService');
const mongoose = require('mongoose');
const {
  getDynamoKeys,
  getDynamoTables,
  getItem,
  isDynamoDbProvider,
  putItem,
  updateItem: updateDynamoItem,
} = require('../services/dynamoDbService');

const getDynamoTicket = async (ticketId) => {
  if (!ticketId) return null;
  return getItem(getDynamoTables().tickets, { [getDynamoKeys().tickets]: ticketId });
};

const saveDynamoAiResult = async ({ ticketId, analysisText, result, metadata }) => {
  const now = new Date().toISOString();
  const resultId = `ai-${ticketId || 'ad-hoc'}-${Date.now()}`;
  return putItem(getDynamoTables().aiResults, {
    [getDynamoKeys().aiResults]: resultId,
    result_id: resultId,
    id: resultId,
    ticket_id: ticketId || metadata?.ticketId || '',
    ticketId: ticketId || metadata?.ticketId || '',
    result_type: 'bedrock_ticket_analysis',
    source: result.source,
    modelId: result.modelId,
    modelUsed: result.modelUsed,
    fallback: result.fallback,
    fallbackTriggered: result.fallbackTriggered,
    responseLatencyMs: result.responseLatencyMs,
    retryCount: result.retryCount,
    routingReason: result.routingReason,
    providerStatus: result.providerStatus,
    analysis: result.analysis,
    input: { textLength: analysisText.length, metadata },
    modelErrors: result.modelErrors || [],
    created_at: now,
    timestamp: now,
  });
};

// POST /api/ai/analyze-ticket
exports.analyzeTicket = async (req, res) => {
  try {
    const { ticketId, ticketText, text, metadata = {} } = req.body;
    let ticket = null;
    let analysisText = String(ticketText || text || '').trim();

    if (!analysisText && ticketId && isDynamoDbProvider()) {
      try {
        ticket = await getDynamoTicket(ticketId);
        if (ticket) {
          analysisText = [
            `Subject: ${ticket.subject || ''}`,
            `Description: ${ticket.description || ticket.ticket_description || ''}`,
            `Category: ${ticket.category || ticket.issue_category || ''}`,
            `Priority: ${ticket.priority || ''}`,
            `Status: ${ticket.status || ''}`,
          ].join('\n');
        }
      } catch {
        console.error('DynamoDB ticket lookup failed during AI analysis; falling back to MongoDB.');
      }
    }

    if (!analysisText && ticketId) {
      const filters = [{ ticket_id: ticketId }, { ticketId }];
      if (mongoose.Types.ObjectId.isValid(ticketId)) filters.push({ _id: ticketId });
      ticket = await Ticket.findOne({ $or: filters }).populate('customer', 'name');
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
      analysisText = [
        `Subject: ${ticket.subject || ''}`,
        `Description: ${ticket.description || ticket.ticket_description || ''}`,
        `Category: ${ticket.category || ticket.issue_category || ''}`,
        `Priority: ${ticket.priority || ''}`,
        `Status: ${ticket.status || ''}`,
      ].join('\n');
    }

    if (!analysisText) {
      return res.status(400).json({ success: false, message: 'ticketText or ticketId is required.' });
    }

    const result = await analyzeTicketWithBedrock({
      ticketText: analysisText,
      metadata: {
        ...metadata,
        ticketId,
      },
    });

    if (isDynamoDbProvider()) {
      try {
        await saveDynamoAiResult({ ticketId, analysisText, result, metadata });
        if (ticket && !(typeof ticket.save === 'function')) {
          await updateDynamoItem(getDynamoTables().tickets, { [getDynamoKeys().tickets]: ticket.ticket_id || ticket.ticketId || ticketId }, {
            aiSummary: result.analysis.resolutionSummary,
            aiRootCause: result.analysis.subcategory,
            sentiment: result.analysis.sentiment,
            priority: ['Urgent', 'Critical'].includes(result.analysis.priority) ? 'Urgent' : result.analysis.priority,
            ai_summary: result.analysis.resolutionSummary,
            ai_sentiment: result.analysis.sentiment,
            ai_root_cause: result.analysis.subcategory,
            ai_suggested_resolution: result.analysis.recommendedAction,
            ai_confidence_score: result.analysis.confidenceScore,
            updated_at: new Date(),
            ticket_updated_date: new Date(),
          });
        }
      } catch {
        console.error('DynamoDB AI result persistence failed; continuing with response and MongoDB fallback if available.');
      }
    }

    if (ticket && typeof ticket.save === 'function') {
      await AIInsight.create({
        insight_type: 'ticket_analysis',
        role: 'support_agent',
        source: result.source,
        data: {
          ticketObjectId: ticket._id,
          ticketId: ticket.ticket_id || ticket.ticketId || ticketId,
          input: { textLength: analysisText.length },
          output: result.analysis,
          modelId: result.modelId,
          modelUsed: result.modelUsed,
          fallback: result.fallback,
          fallbackTriggered: result.fallbackTriggered,
          responseLatencyMs: result.responseLatencyMs,
          retryCount: result.retryCount,
          routingReason: result.routingReason,
          modelErrors: result.modelErrors,
        },
      });

      ticket.aiSummary = result.analysis.resolutionSummary;
      ticket.aiRootCause = result.analysis.subcategory;
      ticket.sentiment = result.analysis.sentiment;
      ticket.priority = ['Urgent', 'Critical'].includes(result.analysis.priority) ? 'Urgent' : result.analysis.priority;
      ticket.ai_summary = result.analysis.resolutionSummary;
      ticket.ai_sentiment = result.analysis.sentiment;
      ticket.ai_root_cause = result.analysis.subcategory;
      ticket.ai_suggested_resolution = result.analysis.recommendedAction;
      ticket.ai_confidence_score = result.analysis.confidenceScore;
      await ticket.save();
    }

    res.json({
      success: true,
      analysis: result.analysis,
      source: result.source,
      modelId: result.modelId,
      modelUsed: result.modelUsed,
      fallbackTriggered: result.fallbackTriggered,
      responseLatencyMs: result.responseLatencyMs,
      retryCount: result.retryCount,
      fallback: result.fallback,
      routingReason: result.routingReason,
      modelErrors: result.modelErrors,
      providerStatus: result.providerStatus,
      message: result.message,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/summarize
exports.summarize = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await sendChatMessage({ role: 'support_agent', message: `Summarize this customer support conversation in 2-3 sentences:\n\n${text}` });
    res.json({ success: true, summary: result.reply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/sentiment
exports.analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = `Analyze the sentiment of this customer message. Respond only with JSON: {"sentiment": "Positive|Neutral|Negative", "confidence": 0-100, "keywords": []}\n\nText: ${text}`;
    const result = await sendChatMessage({ role: 'support_agent', message: prompt });
    let parsed;
    try { parsed = JSON.parse(result.reply); } catch { parsed = { sentiment: 'Neutral', confidence: 70, keywords: [] }; }
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
    const result = await sendChatMessage({ role: 'business_executive', message: prompt });
    let recommendations;
    try { recommendations = JSON.parse(result.reply); } catch { recommendations = [result.reply]; }
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

    const result = await sendChatMessage({ role: 'support_agent', message: prompt });
    const suggestedResponse = result.reply;
    ticket.aiSuggestedReply = suggestedResponse;
    await ticket.save();
    res.json({ success: true, suggestedResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
