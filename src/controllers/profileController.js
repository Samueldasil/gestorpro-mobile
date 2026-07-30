import * as profileService from '../services/profileService';
import { getHistory } from '../api/api';

export async function saveGlobalConfig(newConfig = {}) {
  return profileService.saveConfig(newConfig);
}

export async function loadGlobalConfig() {
  return profileService.loadConfig();
}

export async function clearAndReloadData() {
  const response = await getHistory();
  return response;
}

export default {
  saveGlobalConfig,
  loadGlobalConfig,
  clearAndReloadData
};
