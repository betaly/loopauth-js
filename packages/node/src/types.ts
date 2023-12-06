import {User} from '@loopauth/client';

declare module 'http' {
  // Honor module definition
  interface IncomingMessage {
    user: LoopAuthContext;
  }
}

export type LoopAuthContext = {
  isAuthenticated: boolean;
  accessToken?: string;
  user?: User;
};
