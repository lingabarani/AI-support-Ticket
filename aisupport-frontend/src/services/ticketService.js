import { ticketApi } from './api';

export const createTicket = (payload) => ticketApi.create(payload);
export const getTicket = (ticketId) => ticketApi.get(ticketId);
export const listTickets = (params) => ticketApi.list(params);
export const listCustomerTickets = (email) => ticketApi.byCustomerEmail(email);
export const updateTicket = (ticketId, payload) => ticketApi.update(ticketId, payload);
