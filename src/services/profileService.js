import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = 'gestorpro_config';

const configPadrao = () => ({ gas: '', luz: '', agua: '', horas: '' });

// Só os quatro campos conhecidos, sempre presentes. Um JSON válido porém com
// outro formato (array, string, null) chegava direto ao cálculo e virava NaN.
const normalizarConfig = (valor) => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return configPadrao();

  const padrao = configPadrao();
  Object.keys(padrao).forEach((chave) => {
    const campo = valor[chave];
    padrao[chave] = campo === null || campo === undefined ? '' : String(campo);
  });
  return padrao;
};

export async function saveConfig(newConfig = {}) {
  const config = normalizarConfig(newConfig);
  // Falha de escrita precisa subir: antes o erro era engolido aqui e a tela
  // exibia "Configurações salvas" mesmo sem nada ter sido gravado.
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export async function loadConfig() {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    return raw ? normalizarConfig(JSON.parse(raw)) : configPadrao();
  } catch (error) {
    console.warn('Dados corrompidos no AsyncStorage. Resetando config.', error);
    // Em caso de erro fatal de parsing, retorna a configuração vazia em vez de crashar
    return configPadrao();
  }
}

export default { saveConfig, loadConfig };
