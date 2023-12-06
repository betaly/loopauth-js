import {type NextRequest} from 'next/server';

import {loopauth} from '@/loopauth-edge';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const context = await loopauth.getLoopAuthContext(request, {
    withAccessToken: true,
  });

  if (!context.isAuthenticated) {
    return new Response(JSON.stringify({message: 'Unauthorized'}), {status: 401});
  }

  // if (!scopes?.includes('read:users')) {
  //   return new Response(JSON.stringify({message: 'Access denied, requires read:user scope.'}), {
  //     status: 403,
  //   });
  // }

  return new Response(
    JSON.stringify({
      data: 'this_is_resource_protected',
    }),
  );
}
