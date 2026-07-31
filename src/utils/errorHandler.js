/**
 * Captura central de erros.
 *
 * Sem isto, dois tipos de falha morrem em silêncio no app:
 *  1. Exceções fora do ciclo de render (callbacks nativos, timers, listeners) —
 *     o handler padrão do React Native derruba o app sem nenhuma pista.
 *  2. Promises rejeitadas sem `.catch` — em build de release o Hermes descarta
 *     a rejeição sem logar nada.
 *
 * Aqui tudo passa a ser logado e reportado para quem estiver escutando
 * (o AppErrorBoundary), em vez de sumir.
 */

let listener = null;
let installed = false;

export function setErrorListener(fn) {
  listener = typeof fn === 'function' ? fn : null;
}

export function reportError(error, context = 'app') {
  const message = error?.message || String(error ?? 'Erro desconhecido');

  console.error(`[GestorPro:${context}]`, message, error?.stack || '');

  try {
    listener?.({ message, context, error });
  } catch (listenerError) {
    // Um listener quebrado não pode derrubar o reporte de erro.
    console.error('[GestorPro:listener]', listenerError?.message);
  }
}

export function installGlobalErrorHandler() {
  if (installed) return;
  installed = true;

  const errorUtils = global?.ErrorUtils;
  if (errorUtils?.setGlobalHandler) {
    const previousHandler = errorUtils.getGlobalHandler?.();

    errorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, isFatal ? 'fatal' : 'global');

      // Em desenvolvimento mantemos o redbox para não esconder o stack trace.
      // Em release o app segue vivo na tela de erro em vez de fechar sozinho.
      if (__DEV__ && typeof previousHandler === 'function') {
        previousHandler(error, isFatal);
      }
    });
  }

  try {
    // Mesmo mecanismo que o React Native usa em dev, ligado também em release.
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id, error) => reportError(error, 'promise'),
      onHandled: () => {},
    });
  } catch (trackingError) {
    console.warn('Rastreio de promises indisponível:', trackingError?.message);
  }
}
