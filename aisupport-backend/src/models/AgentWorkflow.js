const mongoose = require('mongoose');

const agentStepSchema = new mongoose.Schema({
  agentName: String,
  status: String,
  confidence: Number,
  recommendation: String,
  nextAction: String,
  output: mongoose.Schema.Types.Mixed,
}, { _id: false });

const agentWorkflowSchema = new mongoose.Schema({
  ticket_id: { type: String, index: true },
  status: { type: String, default: 'started', index: true },
  steps: [agentStepSchema],
  summary: mongoose.Schema.Types.Mixed,
  startedBy: { type: String, default: 'system' },
}, { timestamps: true, collection: 'agent_workflows' });

module.exports = mongoose.model('AgentWorkflow', agentWorkflowSchema);
