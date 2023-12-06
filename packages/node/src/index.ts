import {LoopAuthNodeBaseClient} from './client';

export type {GetContextOptions} from './client';
export {LoopAuthNodeBaseClient} from './client';
export * from './types';
export * from '@loopauth/client';

export class NodeClient extends LoopAuthNodeBaseClient {}
