import {AuthenticationResult, DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS, GenericError} from '@loopauth/client';

import {PopupCancelledError, PopupTimeoutError} from './errors';
import {PopupConfigOptions} from './types';

export const openPopup = (url: string) => {
  const width = 400;
  const height = 600;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  return window.open(
    url,
    'loopauth:authorize:popup',
    `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`,
  );
};

export const runPopup = (config: PopupConfigOptions) => {
  return new Promise<AuthenticationResult>((resolve, reject) => {
    // eslint-disable-next-line prefer-const
    let popupEventListener: (e: MessageEvent) => void;

    // Check each second if the popup is closed triggering a PopupCancelledError
    const popupTimer = setInterval(() => {
      if (config.popup?.closed) {
        clearInterval(popupTimer);
        clearTimeout(timeoutId);
        window.removeEventListener('message', popupEventListener, false);
        reject(new PopupCancelledError(config.popup));
      }
    }, 1000);

    const timeoutId = setTimeout(
      () => {
        clearInterval(popupTimer);
        reject(new PopupTimeoutError(config.popup));
        window.removeEventListener('message', popupEventListener, false);
      },
      (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1000,
    );

    popupEventListener = function (e: MessageEvent) {
      if (!e.data || e.data.type !== 'authorization_response') {
        return;
      }

      clearTimeout(timeoutId);
      clearInterval(popupTimer);
      window.removeEventListener('message', popupEventListener, false);
      config.popup.close();

      if (e.data.response.error) {
        return reject(GenericError.fromPayload(e.data.response));
      }

      resolve(e.data.response);
    };

    window.addEventListener('message', popupEventListener);
  });
};
