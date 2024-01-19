import {useLoopAuth} from '@loopauth/react';
import {useEffect, useState} from 'react';

export const useApi = (url: string, options: any = {}): {error?: Error | null; loading: boolean; data?: any} => {
  const {getAccessTokenSilently} = useLoopAuth();
  const [state, setState] = useState({
    error: null,
    loading: true,
    data: null,
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      let error;
      try {
        const {audience, scope, ...fetchOptions} = options;
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {audience, scope},
        });
        const res = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            // Add the Authorization header to the existing headers
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        error = data?.error;
        if (!error) {
          return setState({
            ...state,
            data,
            error: null,
            loading: false,
          });
        }
      } catch (e: any) {
        error = e;
      }
      if (error) {
        setState({
          ...state,
          error,
          loading: false,
        });
      }
    })();
  }, []);

  return state;
};
