import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

export default function useBackHandler(handler) {
  const handlerRef = useRef(handler);

  // Mantém a função de voltar sempre atualizada na memória de forma silenciosa
  // sem precisar destruir e recriar o listener nativo do Android
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const handleBackPress = () => {
      if (handlerRef.current) {
        return handlerRef.current();
      }
      return false;
    };

    // Aloca o recurso no Android exatamente UMA vez na inicialização
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // Desaloca apenas se o app for fechado de verdade
    return () => subscription.remove();
  }, []); // Array vazio garante que o listener nativo nunca sofra flooding
}