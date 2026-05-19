export const searchTickets = (tickets, { search = '', status = 'All', priority = 'All', category = 'All' } = {}) => {
  const query = search.toLowerCase();
  return tickets.filter((ticket) => {
    const haystack = [
      ticket.ticket_id,
      ticket.id,
      ticket.customer_name,
      ticket.customer,
      ticket.customer_email,
      ticket.issue_category,
      ticket.category,
      ticket.ticket_description,
      ticket.subject,
      ticket.priority,
      ticket.status,
      ticket.assigned_agent,
      ticket.assigned_team,
      ticket.tags?.join(' '),
    ].filter(Boolean).join(' ').toLowerCase();

    return (!query || haystack.includes(query))
      && (status === 'All' || ticket.status === status)
      && (priority === 'All' || ticket.priority === priority)
      && (category === 'All' || ticket.issue_category === category || ticket.category === category);
  });
};
