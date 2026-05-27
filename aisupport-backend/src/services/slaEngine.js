const PRIORITY_TARGET_BUSINESS_DAYS = {
  Critical: 1,
  Urgent: 1,
  High: 3,
  Medium: 5,
  Low: 7,
};

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const isBusinessDay = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

const addBusinessDays = (date, days) => {
  const result = new Date(date);
  let remaining = Math.max(0, Number(days) || 0);
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) remaining -= 1;
  }
  return result;
};

const getPriorityTargetBusinessDays = (priority = 'Medium') => (
  PRIORITY_TARGET_BUSINESS_DAYS[priority] || PRIORITY_TARGET_BUSINESS_DAYS.Medium
);

const calculateSlaDueAt = ({ createdAt = new Date(), priority = 'Medium' } = {}) => {
  const created = asDate(createdAt) || new Date();
  return addBusinessDays(created, getPriorityTargetBusinessDays(priority));
};

const evaluateSla = (ticket = {}, now = new Date()) => {
  const priority = ticket.priority || 'Medium';
  const createdAt = asDate(ticket.ticket_created_date || ticket.created_at || ticket.createdAt) || now;
  const dueAt = asDate(ticket.sla_due_at || ticket.slaDueAt) || calculateSlaDueAt({ createdAt, priority });
  const resolvedAt = asDate(ticket.resolvedAt || ticket.resolved_at);
  const clock = resolvedAt || now;
  const remainingMs = dueAt.getTime() - clock.getTime();
  const remainingHours = remainingMs / (60 * 60 * 1000);
  const elapsedHours = Math.max(0, (clock.getTime() - createdAt.getTime()) / (60 * 60 * 1000));
  const targetBusinessDays = getPriorityTargetBusinessDays(priority);
  const targetHours = targetBusinessDays * 24;
  const consumedPct = targetHours ? Math.min(999, (elapsedHours / targetHours) * 100) : 0;
  const alreadyBreached = ticket.sla_breached === true || String(ticket.sla_status || '').toLowerCase() === 'breached';
  const breached = alreadyBreached || remainingMs < 0;
  const stale = !['Resolved', 'Closed'].includes(ticket.status) && elapsedHours >= Math.min(48, targetHours * 0.5);
  const atRisk = !breached && (remainingHours <= Math.max(8, targetHours * 0.25) || consumedPct >= 75 || stale);
  const escalationTriggered = breached || atRisk || stale;

  return {
    priority,
    targetBusinessDays,
    targetHours,
    dueAt,
    elapsedHours: Number(elapsedHours.toFixed(2)),
    remainingHours: Number(remainingHours.toFixed(2)),
    consumedPct: Number(consumedPct.toFixed(1)),
    status: breached ? 'breached' : atRisk ? 'at_risk' : 'on_track',
    breached,
    atRisk,
    stale,
    escalationTriggered,
  };
};

const summarizeSlaQueue = (tickets = [], now = new Date()) => {
  const evaluations = tickets.map((ticket) => ({ ticket, sla: evaluateSla(ticket, now) }));
  const breached = evaluations.filter(({ sla }) => sla.breached);
  const atRisk = evaluations.filter(({ sla }) => sla.atRisk);
  const open = evaluations.filter(({ ticket }) => !['Resolved', 'Closed'].includes(ticket.status));
  const averageRemainingHours = open.length
    ? open.reduce((sum, item) => sum + asNumber(item.sla.remainingHours), 0) / open.length
    : 0;

  return {
    total: tickets.length,
    open: open.length,
    breached: breached.length,
    atRisk: atRisk.length,
    stale: evaluations.filter(({ sla }) => sla.stale).length,
    escalationTriggers: evaluations.filter(({ sla }) => sla.escalationTriggered).length,
    averageRemainingHours: Number(averageRemainingHours.toFixed(2)),
    highestRisk: evaluations
      .filter(({ ticket }) => !['Resolved', 'Closed'].includes(ticket.status))
      .sort((a, b) => a.sla.remainingHours - b.sla.remainingHours)
      .slice(0, 5)
      .map(({ ticket, sla }) => ({
        ticketId: ticket.ticket_id || ticket.ticketId,
        priority: ticket.priority,
        status: sla.status,
        remainingHours: sla.remainingHours,
      })),
  };
};

module.exports = {
  PRIORITY_TARGET_BUSINESS_DAYS,
  addBusinessDays,
  calculateSlaDueAt,
  evaluateSla,
  getPriorityTargetBusinessDays,
  summarizeSlaQueue,
};
