import {type NextRequest} from 'next/server';

import {loopauth} from '@/loopauth-edge';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  return loopauth.handleSignOut()(request);
}
