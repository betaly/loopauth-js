import {AppState, LoopAuthProvider, LoopAuthProviderOptions} from '@loopauth/react';
import React, {PropsWithChildren} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, useNavigate} from 'react-router-dom';

import App from './App';

const LoopAuthProviderWithRedirectCallback = ({children, ...props}: PropsWithChildren<LoopAuthProviderOptions>) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo ?? window.location.pathname);
  };

  return (
    <LoopAuthProvider onRedirectCallback={onRedirectCallback} {...props}>
      {children}
    </LoopAuthProvider>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LoopAuthProviderWithRedirectCallback
        domain={process.env.REACT_APP_DOMAIN}
        clientId={process.env.REACT_APP_CLIENT_ID}
        cacheProvider={'localstorage'}
        transactionStorageProvider={'session'}
        // authorizationParams={{
        //   audience: process.env.REACT_APP_AUDIENCE,
        //   scope: 'profile email read:users',
        //   redirect_uri: window.location.origin,
        // }}
      >
        <App />
      </LoopAuthProviderWithRedirectCallback>
    </BrowserRouter>
  </React.StrictMode>,
);
