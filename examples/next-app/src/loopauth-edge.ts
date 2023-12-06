import NextClient from '@loopauth/auth-next/edge';

import {AUTH_OPTIONS} from '@/options';

export const loopauth = new NextClient(AUTH_OPTIONS);
