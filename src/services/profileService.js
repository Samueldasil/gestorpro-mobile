import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = 'gestorpro_config';

export async function saveConfig(newConfig = {}) {
  try {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    return newConfig;
  } catch (error) {
    console.warn('Erro ao salvar config no AsyncStorage:', error);
    return newConfig;
  }
}

export async function loadConfig() {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : { gas: '', luz: '', agua: '', horas: '' };
  } catch (error) {
    console.warn('Dados corrompidos no AsyncStorage. Resetando config.', error);
    // Em caso de erro fatal de parsing, retorna a configuração vazia em vez de crashar
    return { gas: '', luz: '', agua: '', horas: '' };
  }
}

export default { saveConfig, loadConfig };
