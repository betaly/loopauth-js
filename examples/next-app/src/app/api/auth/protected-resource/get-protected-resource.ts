// `server-only` guarantees any modules that import code in file
// will never run on the client. Even though this particular api
// doesn't currently use sensitive environment variables, it's
// good practise to add `server-only` preemptively.
// eslint-disable-next-line import/no-unassigned-import
import 'server-only';

import {cookies} from 'next/headers';

import {AUTH_OPTIONS} from '@/options';

export interface ProtectedResourceResponse {
  data?: string;
  error?: string;
}

export async function getProtectedResource(): Promise<ProtectedResourceResponse> {
  const response = await fetch(`${AUTH_OPTIONS.baseUrl}/api/auth/protected-resource`, {
    cache: 'no-store',
    headers: {
      cookie: cookies().toString(),
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      return {error: 'Access denied, requires read:user scope.'};
    }
    return {error: 'Something went wrong!'};
  }

  // eslint-disable-next-line no-restricted-syntax
  return (await response.json()) as {data: string};
}
