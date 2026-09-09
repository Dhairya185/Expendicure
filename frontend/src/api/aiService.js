import api from './api';

/**
 * Service client for the Expendicure Financial Agent / Copilot.
 * Connects the frontend to the backend deterministic reasoning engine
 * and provides structured financial context layer for future LLM integration.
 */

export const queryFinancialCopilot = async (question) => {
  try {
    const response = await api.post('/financial-agent/query', { question });
    return response.data;
  } catch (error) {
    console.error('Error querying Financial Copilot:', error);
    throw error;
  }
};

export const getFinancialContext = async () => {
  try {
    const response = await api.get('/financial-agent/context');
    return response.data;
  } catch (error) {
    console.error('Error fetching financial context:', error);
    throw error;
  }
};

export default {
  queryFinancialCopilot,
  getFinancialContext
};
