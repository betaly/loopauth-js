import {LoopAuthNodeBaseClient} from './client';

export type {GetContextOptions} from './client';
export {LoopAuthNodeBaseClient} from './client';
export * from './types';
export * from '@loopauth/auth-js';

export class NodeClient extends LoopAuthNodeBaseClient {}
