import {User} from '@loopauth/auth-js';

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
