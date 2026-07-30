import { saveBudget as apiSaveBudget } from '../api/api';

export async function saveBudgetService(payload /*, token - handled by apiService */) {
  // wrapper para futuras extensões (logging, telemetry, transform)
  return apiSaveBudget(payload);
}

export default {
  saveBudgetService,
};
