import { ticketApi } from './api';

export const createTicket = (payload) => ticketApi.create(payload);
export const createTicketForm = (payload) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  return ticketApi.create(form);
};
export const getTicket = (ticketId) => ticketApi.get(ticketId);
export const listTickets = (params) => ticketApi.list(params);
export const listCustomerTickets = (email) => email ? ticketApi.byCustomerEmail(email) : ticketApi.myCustomerTickets();
export const updateTicket = (ticketId, payload) => ticketApi.update(ticketId, payload);
