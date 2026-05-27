const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const auditPath = path.resolve(__dirname, '..', '..', 'data', 'audit-events.jsonl');

const redact = (value = {}) => {
  if (!value || typeof value !== 'object') return value;
  return Object.entries(value).reduce((acc, [key, item]) => {
    if (/password|token|secret|authorization|cookie/i.test(key)) {
      acc[key] = '[redacted]';
    } else {
      acc[key] = item;
    }
    return acc;
  }, {});
};

const buildAuditEvent = ({
  actor = 'system',
  action,
  entityType = 'ticket',
  entityId = '',
  outcome = 'success',
  metadata = {},
} = {}) => ({
  timestamp: new Date().toISOString(),
  actor,
  action,
  entityType,
  entityId,
  outcome,
  metadata: redact(metadata),
});

const writeAuditEvent = async (eventInput = {}) => {
  const event = buildAuditEvent(eventInput);
  if (mongoose.connection.readyState === 1) {
    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create(event);
    } catch {
      // JSONL fallback below keeps audit capture resilient.
    }
  }
  await fs.promises.mkdir(path.dirname(auditPath), { recursive: true });
  await fs.promises.appendFile(auditPath, `${JSON.stringify(event)}\n`, 'utf-8');
  return event;
};

const readAuditEvents = async ({ limit = 100, entityId } = {}) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const AuditLog = require('../models/AuditLog');
      const filter = entityId ? { entityId } : {};
      return await AuditLog.find(filter).sort({ timestamp: -1, createdAt: -1 }).limit(limit).lean();
    } catch {
      // Fall through to JSONL events.
    }
  }
  try {
    const raw = await fs.promises.readFile(auditPath, 'utf-8');
    return raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((event) => !entityId || event.entityId === entityId)
      .slice(-limit)
      .reverse();
  } catch {
    return [];
  }
};

module.exports = {
  buildAuditEvent,
  readAuditEvents,
  writeAuditEvent,
};
