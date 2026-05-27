export const searchTickets = (tickets, filters = {}) => {
  const query = String(filters.search || '').trim().toLowerCase();
  const priority = filters.priority || 'All';
  const status = filters.status || 'All';

  return (tickets || []).filter((ticket) => {
    const matchesSearch = !query || [
      ticket.id,
      ticket.ticket_id,
      ticket.subject,
      ticket.customer,
      ticket.customer_name,
      ticket.customer_email,
      ticket.category,
      ticket.issue_category,
      ticket.priority,
      ticket.status,
    ].filter(Boolean).join(' ').toLowerCase().includes(query);

    return matchesSearch
      && (priority === 'All' || ticket.priority === priority)
      && (status === 'All' || ticket.status === status);
  });
};
