// `server-only` guarantees any modules that import code in file
// will never run on the client. Even though this particular api
// doesn't currently use sensitive environment variables, it's
// good practise to add `server-only` preemptively.
import 'server-only';

import {LoopAuthContext} from '@loopauth/node';
import {cookies} from 'next/headers';

import {AUTH_OPTIONS} from '@/options';

export async function getUser() {
  const response = await fetch(`${AUTH_OPTIONS.baseUrl}/api/auth/user`, {
    cache: 'no-store',
    headers: {
      cookie: cookies().toString(),
    },
  });

  if (!response.ok) {
    throw new Error('Something went wrong!');
  }

  return (await response.json()) as LoopAuthContext;
}
