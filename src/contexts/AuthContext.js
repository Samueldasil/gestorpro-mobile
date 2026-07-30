import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('auth_user');

        let parsedUser = null;
        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (parseError) {
            console.warn('Erro ao parsear auth_user do AsyncStorage', parseError);
          }
        }

        if (storedToken && parsedUser) {
          setToken(storedToken);
          setAuthToken(storedToken);
          setUser(parsedUser);
        } else if (storedToken && !parsedUser) {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Erro ao carregar auth do AsyncStorage', err);
      } finally {
        setLoadingAuth(false);
      }
    };
    load();
  }, []);

  const login = useCallback(async (userData, authToken) => {
    if (!userData || !authToken) {
      console.warn('Login inválido: userData ou authToken ausente');
      throw new Error('Credenciais inválidas');
    }

    setUser(userData);
    setToken(authToken);
    setAuthToken(authToken);
    try {
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (err) {
      console.warn('Erro ao salvar auth no AsyncStorage', err);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
    } catch (err) {
      console.warn('Erro ao limpar auth do AsyncStorage', err);
    }
  }, []);

  // Identidade estável evita que quem depende de login/logout re-registre a cada render.
  const value = useMemo(
    () => ({ user, token, login, logout, loadingAuth }),
    [user, token, login, logout, loadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
