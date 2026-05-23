import { analyticsApi } from './api';

export const getSupportAgentAnalytics = () => analyticsApi.supportAgent();
export const getTeamManagerAnalytics = () => analyticsApi.teamManager();
export const getBusinessExecutiveAnalytics = () => analyticsApi.businessExecutive();
export const getAnalyticsSummary = () => analyticsApi.summary();
